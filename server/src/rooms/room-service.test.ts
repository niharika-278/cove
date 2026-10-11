import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRoomStore } from "./room-store";
import { RoomService } from "./room-service";
import { transferHost } from "./room-helpers";
import { createEmptyRoom } from "./room-helpers";
import { DEFAULT_ROOM_THEME, type Participant, type RoomTheme } from "@cinecouch/shared";

describe("RoomService", () => {
  let service: RoomService;

  beforeEach(() => {
    service = new RoomService(new InMemoryRoomStore());
  });

  it("creates a room with secure id and creator token", () => {
    const { room, creatorToken } = service.createRoom();
    expect(room.roomId).toHaveLength(12);
    expect(room.participants).toHaveLength(0);
    expect(creatorToken).toHaveLength(32);
    expect(room.creatorToken).toBe(creatorToken);
    expect(room.theme).toBe(DEFAULT_ROOM_THEME);
    expect(service.getPublicRoom(room.roomId)?.theme).toBe(DEFAULT_ROOM_THEME);
  });

  it("makes only the room creator host when they join with creator token", () => {
    const { room, creatorToken } = service.createRoom();

    const creator = service.joinRoom(room.roomId, "Alice", "socket-1", undefined, creatorToken);
    if ("code" in creator) throw new Error(creator.message);
    expect(creator.participant.isHost).toBe(true);

    const joiner = service.joinRoom(room.roomId, "Bob", "socket-2");
    if ("code" in joiner) throw new Error(joiner.message);
    expect(joiner.participant.isHost).toBe(false);
  });

  it("does not make a link visitor host even if they join first", () => {
    const { room } = service.createRoom();

    const earlyJoiner = service.joinRoom(room.roomId, "Bob", "socket-1");
    if ("code" in earlyJoiner) throw new Error(earlyJoiner.message);
    expect(earlyJoiner.participant.isHost).toBe(false);
  });

  it("joins up to max participants", () => {
    const { room, creatorToken } = service.createRoom();
    service.joinRoom(room.roomId, "Host", "socket-0", undefined, creatorToken);

    for (let i = 1; i < 4; i++) {
      const result = service.joinRoom(room.roomId, `User${i}`, `socket-${i}`);
      if ("code" in result) throw new Error(result.message);
    }

    const fifth = service.joinRoom(room.roomId, "User5", "socket-5");
    expect("code" in fifth && fifth.code).toBe("ROOM_FULL");
  });

  it("reconnects with session token", () => {
    const { room, creatorToken } = service.createRoom();
    const joined = service.joinRoom(room.roomId, "Alice", "socket-1", undefined, creatorToken);
    if ("code" in joined) throw new Error(joined.message);

    const reconnected = service.reconnectRoom(
      room.roomId,
      joined.sessionToken,
      "socket-2"
    );
    if ("code" in reconnected) throw new Error(reconnected.message);

    expect(reconnected.participant.participantId).toBe(joined.participant.participantId);
    expect(reconnected.participant.socketId).toBe("socket-2");
    expect(reconnected.participant.isHost).toBe(true);
    expect(reconnected.room.theme).toBe(DEFAULT_ROOM_THEME);
  });

  it("allows only the current host to change the room theme", () => {
    const { room, creatorToken } = service.createRoom();
    const host = service.joinRoom(room.roomId, "Alice", "socket-1", undefined, creatorToken);
    const guest = service.joinRoom(room.roomId, "Bob", "socket-2");
    if ("code" in host || "code" in guest) throw new Error("Failed to join test room");

    const updated = service.setTheme(room.roomId, host.participant.participantId, "rainy-evening");
    if ("code" in updated) throw new Error(updated.message);
    expect(updated.theme).toBe("rainy-evening");

    const denied = service.setTheme(room.roomId, guest.participant.participantId, "midnight-cinema");
    expect("code" in denied && denied.code).toBe("UNAUTHORIZED");
    expect(service.getPublicRoom(room.roomId)?.theme).toBe("rainy-evening");
  });

  it("preserves the current theme in join and reconnect snapshots", () => {
    const { room, creatorToken } = service.createRoom();
    const host = service.joinRoom(room.roomId, "Alice", "socket-1", undefined, creatorToken);
    if ("code" in host) throw new Error(host.message);
    service.setTheme(room.roomId, host.participant.participantId, "midnight-cinema");

    const guest = service.joinRoom(room.roomId, "Bob", "socket-2");
    if ("code" in guest) throw new Error(guest.message);
    expect(guest.room.theme).toBe("midnight-cinema");

    service.disconnectParticipant(room.roomId, guest.participant.participantId);
    const reconnected = service.reconnectRoom(room.roomId, guest.sessionToken, "socket-3");
    if ("code" in reconnected) throw new Error(reconnected.message);
    expect(reconnected.room.theme).toBe("midnight-cinema");

    const rejoined = service.joinRoom(room.roomId, "Bob", "socket-4", guest.sessionToken);
    if ("code" in rejoined) throw new Error(rejoined.message);
    expect(rejoined.room.theme).toBe("midnight-cinema");
  });

  it("uses the transferred host rather than the original creator for theme permissions", () => {
    const { room, creatorToken } = service.createRoom();
    const host = service.joinRoom(room.roomId, "Alice", "socket-1", undefined, creatorToken);
    const guest = service.joinRoom(room.roomId, "Bob", "socket-2");
    if ("code" in host || "code" in guest) throw new Error("Failed to join test room");

    service.disconnectParticipant(room.roomId, host.participant.participantId);
    service.reconnectRoom(room.roomId, host.sessionToken, "socket-3");
    expect(service.setTheme(room.roomId, host.participant.participantId, "rainy-evening"))
      .toMatchObject({ code: "UNAUTHORIZED" });
    expect(service.setTheme(room.roomId, guest.participant.participantId, "sunday-morning"))
      .toMatchObject({ theme: "sunday-morning" });
  });

  it("rejects disconnected hosts, unknown participants, and invalid themes without mutation", () => {
    const { room, creatorToken } = service.createRoom();
    const host = service.joinRoom(room.roomId, "Alice", "socket-1", undefined, creatorToken);
    if ("code" in host) throw new Error(host.message);

    expect(service.setTheme(room.roomId, host.participant.participantId, "invalid" as RoomTheme))
      .toMatchObject({ code: "INVALID_PAYLOAD" });
    expect(service.setTheme(room.roomId, "unknown", "rainy-evening"))
      .toMatchObject({ code: "UNAUTHORIZED" });

    service.disconnectParticipant(room.roomId, host.participant.participantId);
    expect(service.setTheme(room.roomId, host.participant.participantId, "rainy-evening"))
      .toMatchObject({ code: "UNAUTHORIZED" });
    expect(service.getPublicRoom(room.roomId)?.theme).toBe(DEFAULT_ROOM_THEME);
  });
});

describe("createEmptyRoom", () => {
  it("starts with the default cozy cabin theme", () => {
    expect(createEmptyRoom("test").theme).toBe("cozy-cabin");
  });
});

describe("transferHost", () => {
  it("transfers to oldest connected participant", () => {
    const room = createEmptyRoom("test");
    const now = Date.now();

    const makeParticipant = (id: string, joinedAt: number, connected: boolean): Participant => ({
      participantId: id,
      sessionToken: `token-${id}`,
      displayName: id,
      avatarSeed: id,
      joinedAt,
      isHost: id === "a",
      connected,
      lastSeenAt: now,
    });

    room.participants = [
      makeParticipant("a", 100, false),
      makeParticipant("b", 200, true),
      makeParticipant("c", 300, true),
    ];
    room.hostParticipantId = "a";

    const newHost = transferHost(room);
    expect(newHost).toBe("b");
    expect(room.participants.find((p) => p.participantId === "b")?.isHost).toBe(true);
  });
});
