import type { PublicRoom } from "@cinecouch/shared";
import type { Server, Socket } from "socket.io";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomService } from "../rooms/room-service";
import { InMemoryRoomStore } from "../rooms/room-store";
import { registerSocketHandlers } from "./handlers";

type Handler = (payload?: unknown, ack?: (response: unknown) => void) => void;

function createSocketHarness(service: RoomService) {
  let onConnection: (socket: Socket) => void;
  const broadcast = vi.fn();
  const io = {
    on: (_event: string, callback: (socket: Socket) => void) => { onConnection = callback; },
    to: (roomId: string) => ({
      emit: (event: string, payload: unknown) => broadcast(roomId, event, payload),
    }),
  };
  registerSocketHandlers(io as unknown as Server, service);

  function connect(id: string) {
    const handlers = new Map<string, Handler>();
    const socket = {
      id,
      data: {} as Record<string, unknown>,
      on: (event: string, handler: Handler) => handlers.set(event, handler),
      emit: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      to: () => ({ emit: vi.fn() }),
    };
    onConnection(socket as unknown as Socket);
    return {
      ...socket,
      receive(event: string, payload?: unknown, ack?: (response: unknown) => void) {
        const handler = handlers.get(event);
        if (!handler) throw new Error(`Missing handler: ${event}`);
        handler(payload, ack);
      },
    };
  }

  return { connect, broadcast };
}

describe("room theme and reaction socket handlers", () => {
  let service: RoomService;
  let harness: ReturnType<typeof createSocketHarness>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
    service = new RoomService(new InMemoryRoomStore());
    harness = createSocketHarness(service);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function join(socketId: string, roomId: string, creatorToken?: string) {
    const socket = harness.connect(socketId);
    const ack = vi.fn();
    socket.receive("room:join", { roomId, displayName: socketId, creatorToken }, ack);
    const response = ack.mock.calls[0][0] as {
      ok: boolean;
      participantId: string;
      sessionToken: string;
      room: PublicRoom;
    };
    expect(response.ok).toBe(true);
    return { socket, response };
  }

  it("broadcasts the host's updated public room and includes its theme in join/reconnect snapshots", () => {
    const { room, creatorToken } = service.createRoom();
    const { socket: host } = join("host", room.roomId, creatorToken);
    const ack = vi.fn();
    host.receive("room:set-theme", { roomId: room.roomId, theme: "rainy-evening" }, ack);

    const publicRoom = service.getPublicRoom(room.roomId);
    expect(ack).toHaveBeenCalledWith({ ok: true, room: publicRoom });
    expect(harness.broadcast).toHaveBeenCalledWith(room.roomId, "room:theme-updated", {
      room: expect.objectContaining({ theme: "rainy-evening" }),
    });
    expect(publicRoom).not.toHaveProperty("creatorToken");
    expect(publicRoom?.participants[0]).not.toHaveProperty("sessionToken");

    const guest = join("guest", room.roomId);
    expect(guest.response.room.theme).toBe("rainy-evening");
    expect(guest.socket.emit).toHaveBeenCalledWith("room:state",
      expect.objectContaining({ theme: "rainy-evening" }));
    guest.socket.receive("disconnect");
    const reconnected = harness.connect("guest-reconnected");
    const reconnectAck = vi.fn();
    reconnected.receive("room:reconnect", {
      roomId: room.roomId, sessionToken: guest.response.sessionToken,
    }, reconnectAck);
    expect(reconnectAck).toHaveBeenCalledWith(expect.objectContaining({
      ok: true, room: expect.objectContaining({ theme: "rainy-evening" }),
    }));
    expect(reconnected.emit).toHaveBeenCalledWith("room:state",
      expect.objectContaining({ theme: "rainy-evening" }));
  });

  it("emits and acknowledges UNAUTHORIZED for guests and unjoined callers", () => {
    const { room, creatorToken } = service.createRoom();
    join("host", room.roomId, creatorToken);
    const { socket: guest } = join("guest", room.roomId);
    const outsider = harness.connect("outsider");

    for (const socket of [guest, outsider]) {
      const ack = vi.fn();
      socket.receive("room:set-theme", { roomId: room.roomId, theme: "rainy-evening" }, ack);
      expect(ack).toHaveBeenCalledWith({
        ok: false, error: expect.objectContaining({ code: "UNAUTHORIZED" }),
      });
      expect(socket.emit).toHaveBeenCalledWith("room:error",
        expect.objectContaining({ code: "UNAUTHORIZED" }));
    }
    expect(harness.broadcast).not.toHaveBeenCalled();
    expect(service.getPublicRoom(room.roomId)?.theme).toBe("cozy-cabin");
  });

  it("rejects invalid theme payloads without changing or broadcasting room state", () => {
    const { room, creatorToken } = service.createRoom();
    const { socket } = join("host", room.roomId, creatorToken);
    const ack = vi.fn();
    socket.receive("room:set-theme", { roomId: room.roomId, theme: "invalid" }, ack);
    expect(ack).toHaveBeenCalledWith({
      ok: false, error: expect.objectContaining({ code: "INVALID_PAYLOAD" }),
    });
    expect(harness.broadcast).not.toHaveBeenCalled();
    expect(service.getPublicRoom(room.roomId)?.theme).toBe("cozy-cabin");
  });

  it("keeps valid reactions transient, room-scoped, and identified by the server", () => {
    const { room } = service.createRoom();
    const { socket, response } = join("guest", room.roomId);
    const before = JSON.stringify(service.getRoom(room.roomId));
    const ack = vi.fn();
    socket.receive("reaction:send", {
      roomId: room.roomId, emoji: "❤️", displayName: "spoofed", participantId: "spoofed", timestamp: 1,
    }, ack);
    expect(ack).toHaveBeenCalledWith({ ok: true });
    expect(harness.broadcast).toHaveBeenCalledExactlyOnceWith(room.roomId, "reaction:received", {
      emoji: "❤️", displayName: "guest", participantId: response.participantId, timestamp: 100_000,
    });
    expect(JSON.stringify(service.getRoom(room.roomId))).toBe(before);
  });

  it("acknowledges invalid, cross-room, and disconnected reactions", () => {
    const { room } = service.createRoom();
    const otherRoom = service.createRoom().room;
    const { socket, response } = join("guest", room.roomId);
    const invalidAck = vi.fn();
    socket.receive("reaction:send", { roomId: room.roomId, emoji: "🔥" }, invalidAck);
    expect(invalidAck).toHaveBeenCalledWith({
      ok: false, error: expect.objectContaining({ code: "INVALID_PAYLOAD" }),
    });

    const crossRoomAck = vi.fn();
    socket.receive("reaction:send", { roomId: otherRoom.roomId, emoji: "❤️" }, crossRoomAck);
    expect(crossRoomAck).toHaveBeenCalledWith({
      ok: false, error: expect.objectContaining({ code: "NOT_IN_ROOM" }),
    });

    service.disconnectParticipant(room.roomId, response.participantId);
    const disconnectedAck = vi.fn();
    socket.receive("reaction:send", { roomId: room.roomId, emoji: "❤️" }, disconnectedAck);
    expect(disconnectedAck).toHaveBeenCalledWith({
      ok: false, error: expect.objectContaining({ code: "UNAUTHORIZED" }),
    });
    expect(harness.broadcast).not.toHaveBeenCalled();
  });

  it("rejects an old socket after the same participant reconnects", () => {
    const { room } = service.createRoom();
    const original = join("original", room.roomId).socket;
    const session = service.getRoom(room.roomId)?.participants[0]?.sessionToken;
    if (!session) throw new Error("Missing test session");

    const replacement = harness.connect("replacement");
    const reconnectAck = vi.fn();
    replacement.receive("room:reconnect", { roomId: room.roomId, sessionToken: session }, reconnectAck);
    expect(reconnectAck).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));

    original.receive("disconnect");
    const reactionAck = vi.fn();
    original.receive("reaction:send", { roomId: room.roomId, emoji: "❤️" }, reactionAck);
    expect(reactionAck).toHaveBeenCalledWith({
      ok: false, error: expect.objectContaining({ code: "UNAUTHORIZED" }),
    });

    const replacementReactionAck = vi.fn();
    replacement.receive("reaction:send", { roomId: room.roomId, emoji: "❤️" }, replacementReactionAck);
    expect(replacementReactionAck).toHaveBeenCalledWith({ ok: true });
    expect(harness.broadcast).toHaveBeenCalledWith(
      room.roomId,
      "reaction:received",
      expect.objectContaining({ participantId: expect.any(String) })
    );
  });

  it("ignores a socket replaced by a reconnect for theme changes", () => {
    const { room, creatorToken } = service.createRoom();
    const { socket, response } = join("host", room.roomId, creatorToken);
    service.reconnectRoom(room.roomId, response.sessionToken, "replacement");
    socket.receive("room:set-theme", { roomId: room.roomId, theme: "rainy-evening" });
    expect(socket.emit).toHaveBeenCalledWith("room:error",
      expect.objectContaining({ code: "UNAUTHORIZED" }));
    expect(harness.broadcast).not.toHaveBeenCalled();
  });

  it("limits reaction bursts per socket and resets the limit after one second", () => {
    const { room } = service.createRoom();
    const first = join("first", room.roomId).socket;
    const second = join("second", room.roomId).socket;
    const payload = { roomId: room.roomId, emoji: "😂" };
    for (let i = 0; i < 12; i++) first.receive("reaction:send", payload, vi.fn());
    expect(harness.broadcast).toHaveBeenCalledTimes(8);
    second.receive("reaction:send", payload);
    expect(harness.broadcast).toHaveBeenCalledTimes(9);
    vi.advanceTimersByTime(999);
    first.receive("reaction:send", payload);
    expect(harness.broadcast).toHaveBeenCalledTimes(9);
    vi.advanceTimersByTime(1);
    first.receive("reaction:send", payload);
    expect(harness.broadcast).toHaveBeenCalledTimes(10);
  });
});
