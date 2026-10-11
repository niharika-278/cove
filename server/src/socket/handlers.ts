import type { Server, Socket } from "socket.io";
import {
  chatMessageSchema,
  joinRoomSchema,
  leaveRoomSchema,
  playbackActionSchema,
  reactionSchema,
  reconnectRoomSchema,
  setThemeSchema,
  setVideoSchema,
  webrtcAnswerSchema,
  webrtcIceCandidateSchema,
  webrtcMediaStateSchema,
  webrtcOfferSchema,
  webrtcReconnectSchema,
  type PublicRoom,
  type RoomError,
} from "@cinecouch/shared";
import type { RoomService } from "../rooms/room-service";
import { ZodError, type ZodSchema } from "zod";

type SocketData = Partial<{
  roomId: string;
  participantId: string;
  sessionToken: string;
}>;

function formatZodError(error: ZodError): string {
  return error.errors.map((e) => e.message).join(", ");
}

function socketInRoom(
  data: SocketData,
  roomId: string
): data is SocketData & { roomId: string; participantId: string } {
  return data.roomId === roomId && !!data.participantId;
}

function emitError(socket: Socket, error: RoomError | { code: string; message: string }) {
  socket.emit("room:error", error);
}

const SIGNALING_WINDOW_MS = 10_000;
const SIGNALING_MAX_EVENTS = 120;
const REACTION_WINDOW_MS = 1_000;
const REACTION_MAX_EVENTS = 8;

type RateLimitEntry = { count: number; resetAt: number };
type SocketAck = (response: {
  ok: boolean;
  error?: { code: string; message: string };
}) => void;

function allowSignaling(socket: Socket): boolean {
  const data = socket.data as { signalingRate?: RateLimitEntry };
  const now = Date.now();
  if (!data.signalingRate || now > data.signalingRate.resetAt) {
    data.signalingRate = { count: 0, resetAt: now + SIGNALING_WINDOW_MS };
  }
  data.signalingRate.count += 1;
  return data.signalingRate.count <= SIGNALING_MAX_EVENTS;
}

function allowReaction(socket: Socket): boolean {
  const data = socket.data as { reactionRate?: RateLimitEntry };
  const now = Date.now();
  if (!data.reactionRate || now >= data.reactionRate.resetAt) {
    data.reactionRate = { count: 0, resetAt: now + REACTION_WINDOW_MS };
  }
  data.reactionRate.count += 1;
  return data.reactionRate.count <= REACTION_MAX_EVENTS;
}

function resolveSignalingTarget(
  roomService: RoomService,
  roomId: string,
  senderParticipantId: string,
  targetParticipantId: string
): string | null {
  if (senderParticipantId === targetParticipantId) return null;

  const room = roomService.getRoom(roomId);
  if (!room) return null;

  const sender = room.participants.find((p) => p.participantId === senderParticipantId);
  const target = room.participants.find((p) => p.participantId === targetParticipantId);

  if (!sender?.connected || !target?.connected || !target.socketId) return null;

  return target.socketId;
}

function relaySignaling<T extends { roomId: string; targetParticipantId: string }>(
  io: Server,
  roomService: RoomService,
  socket: Socket,
  data: SocketData,
  payload: unknown,
  event: string,
  schema: ZodSchema<T>
): void {
  try {
    if (!allowSignaling(socket)) return;

    const parsed = schema.parse(payload);
    if (!socketInRoom(data, parsed.roomId)) return;

    const targetSocketId = resolveSignalingTarget(
      roomService,
      parsed.roomId,
      data.participantId,
      parsed.targetParticipantId
    );
    if (!targetSocketId) return;

    io.to(targetSocketId).emit(event, {
      ...parsed,
      fromParticipantId: data.participantId,
    });
  } catch {
    // ignore invalid signaling payloads
  }
}

export function registerSocketHandlers(io: Server, roomService: RoomService): void {
  io.on("connection", (socket: Socket) => {
    const data = socket.data as SocketData;

    socket.on("room:join", (payload, ack) => {
      try {
        const parsed = joinRoomSchema.parse(payload);
        const result = roomService.joinRoom(
          parsed.roomId,
          parsed.displayName,
          socket.id,
          parsed.sessionToken,
          parsed.creatorToken
        );

        if ("code" in result) {
          emitError(socket, result);
          ack?.({ ok: false, error: result });
          return;
        }

        data.roomId = parsed.roomId;
        data.participantId = result.participant.participantId;
        data.sessionToken = result.sessionToken;

        socket.join(parsed.roomId);

        ack?.({
          ok: true,
          sessionToken: result.sessionToken,
          participantId: result.participant.participantId,
          room: result.room,
        });

        socket.to(parsed.roomId).emit("room:participant-joined", {
          participant: result.room.participants.find(
            (p) => p.participantId === result.participant.participantId
          ),
          room: result.room,
        });

        socket.emit("room:state", result.room);
      } catch (err) {
        const message = err instanceof ZodError ? formatZodError(err) : "Invalid join payload";
        const error = { code: "INVALID_PAYLOAD" as const, message };
        emitError(socket, error);
        ack?.({ ok: false, error });
      }
    });

    socket.on("room:reconnect", (payload, ack) => {
      try {
        const parsed = reconnectRoomSchema.parse(payload);
        const result = roomService.reconnectRoom(
          parsed.roomId,
          parsed.sessionToken,
          socket.id
        );

        if ("code" in result) {
          emitError(socket, result);
          ack?.({ ok: false, error: result });
          return;
        }

        data.roomId = parsed.roomId;
        data.participantId = result.participant.participantId;
        data.sessionToken = parsed.sessionToken;

        socket.join(parsed.roomId);

        ack?.({
          ok: true,
          participantId: result.participant.participantId,
          room: result.room,
        });

        socket.to(parsed.roomId).emit("room:participant-joined", {
          participant: result.room.participants.find(
            (p) => p.participantId === result.participant.participantId
          ),
          room: result.room,
        });

        socket.emit("room:state", result.room);
      } catch (err) {
        const message =
          err instanceof ZodError ? formatZodError(err) : "Invalid reconnect payload";
        const error = { code: "INVALID_PAYLOAD" as const, message };
        emitError(socket, error);
        ack?.({ ok: false, error });
      }
    });

    socket.on("room:leave", (payload) => {
      try {
        const parsed = leaveRoomSchema.parse(payload);
        if (!data.participantId || !socketInRoom(data, parsed.roomId)) {
          emitError(socket, { code: "NOT_IN_ROOM", message: "Not in room" });
          return;
        }

        const leavingId = data.participantId;
        const roomBefore = roomService.getRoom(parsed.roomId);
        const leavingName = roomBefore?.participants.find(
          (p) => p.participantId === leavingId
        )?.displayName;

        const result = roomService.leaveRoom(parsed.roomId, leavingId);
        if ("code" in result) {
          emitError(socket, result);
          return;
        }

        socket.leave(parsed.roomId);
        (data as SocketData).roomId = undefined;
        (data as SocketData).participantId = undefined;
        (data as SocketData).sessionToken = undefined;

        if (result.room) {
          io.to(parsed.roomId).emit("room:participant-left", {
            participantId: leavingId,
            displayName: leavingName,
            room: result.room,
          });

          if (result.hostChanged) {
            io.to(parsed.roomId).emit("room:host-changed", {
              hostParticipantId: result.newHostId,
              room: result.room,
            });
          }
        }
      } catch {
        emitError(socket, { code: "INVALID_PAYLOAD", message: "Invalid leave payload" });
      }
    });

    socket.on("room:set-theme", (payload, ack) => {
      try {
        const parsed = setThemeSchema.parse(payload);
        const participant = roomService.getParticipantBySocket(parsed.roomId, socket.id);
        if (!socketInRoom(data, parsed.roomId) || participant?.participantId !== data.participantId) {
          const error = {
            code: "UNAUTHORIZED" as const,
            message: "Only the room host can change the theme.",
          };
          emitError(socket, error);
          ack?.({ ok: false, error });
          return;
        }

        const result = roomService.setTheme(parsed.roomId, data.participantId, parsed.theme);
        if ("code" in result) {
          emitError(socket, result);
          ack?.({ ok: false, error: result });
          return;
        }

        io.to(parsed.roomId).emit("room:theme-updated", { room: result });
        ack?.({ ok: true, room: result });
      } catch (err) {
        const message = err instanceof ZodError ? formatZodError(err) : "Invalid theme payload";
        const error = { code: "INVALID_PAYLOAD" as const, message };
        emitError(socket, error);
        ack?.({ ok: false, error });
      }
    });

    socket.on("playback:set-video", (payload, ack) => {
      try {
        const parsed = setVideoSchema.parse(payload);
        handlePlayback(
          socket,
          data,
          roomService,
          () => {
            if (!data.participantId) throw new Error("Not in room");
            return roomService.setVideo(parsed.roomId, data.participantId, parsed.url);
          },
          io,
          ack,
          parsed.roomId
        );
      } catch (err) {
        const message =
          err instanceof ZodError ? formatZodError(err) : "Invalid playback payload";
        const error = { code: "INVALID_PAYLOAD" as const, message };
        emitError(socket, error);
        ack?.({ ok: false, error });
      }
    });

    socket.on("playback:play", (payload) => {
      try {
        const parsed = playbackActionSchema.parse(payload);
        if (!socketInRoom(data, parsed.roomId)) return;

        const result = roomService.play(
          parsed.roomId,
          data.participantId,
          parsed.positionSeconds
        );

        if ("code" in result) {
          emitError(socket, result);
          return;
        }

        broadcastPlayback(io, parsed.roomId, result);
      } catch {
        emitError(socket, { code: "INVALID_PAYLOAD", message: "Invalid play payload" });
      }
    });

    socket.on("playback:pause", (payload) => {
      try {
        const parsed = playbackActionSchema.parse(payload);
        if (!socketInRoom(data, parsed.roomId)) return;

        const result = roomService.pause(
          parsed.roomId,
          data.participantId,
          parsed.positionSeconds
        );

        if ("code" in result) {
          emitError(socket, result);
          return;
        }

        broadcastPlayback(io, parsed.roomId, result);
      } catch {
        emitError(socket, { code: "INVALID_PAYLOAD", message: "Invalid pause payload" });
      }
    });

    socket.on("playback:seek", (payload) => {
      try {
        const parsed = playbackActionSchema.parse(payload);
        if (!socketInRoom(data, parsed.roomId)) return;

        const result = roomService.seek(
          parsed.roomId,
          data.participantId,
          parsed.positionSeconds
        );

        if ("code" in result) {
          emitError(socket, result);
          return;
        }

        broadcastPlayback(io, parsed.roomId, result);
      } catch {
        emitError(socket, { code: "INVALID_PAYLOAD", message: "Invalid seek payload" });
      }
    });

    socket.on("chat:send", (payload, ack) => {
      try {
        const parsed = chatMessageSchema.parse(payload);
        if (!socketInRoom(data, parsed.roomId)) {
          emitError(socket, { code: "NOT_IN_ROOM", message: "Not in room" });
          return;
        }

        const result = roomService.sendChat(
          parsed.roomId,
          data.participantId,
          parsed.text
        );

        if ("code" in result) {
          emitError(socket, result);
          ack?.({ ok: false, error: result });
          return;
        }

        io.to(parsed.roomId).emit("chat:message", {
          message: result.message,
          room: result.room,
        });

        ack?.({ ok: true, message: result.message });
      } catch (err) {
        const message =
          err instanceof ZodError ? formatZodError(err) : "Invalid chat payload";
        emitError(socket, { code: "INVALID_PAYLOAD", message });
        ack?.({ ok: false, error: { code: "INVALID_PAYLOAD", message } });
      }
    });

    socket.on("reaction:send", (payload, ack?: SocketAck) => {
      try {
        const parsed = reactionSchema.parse(payload);
        if (!socketInRoom(data, parsed.roomId)) {
          ack?.({
            ok: false,
            error: { code: "NOT_IN_ROOM", message: "Not in room." },
          });
          return;
        }

        const participant = roomService.getParticipantBySocket(parsed.roomId, socket.id);
        if (!participant || participant.participantId !== data.participantId) {
          ack?.({
            ok: false,
            error: { code: "UNAUTHORIZED", message: "This socket is no longer active in the room." },
          });
          return;
        }

        if (!allowReaction(socket)) {
          ack?.({
            ok: false,
            error: { code: "RATE_LIMITED", message: "Too many reactions. Please slow down." },
          });
          return;
        }

        io.to(parsed.roomId).emit("reaction:received", {
          emoji: parsed.emoji,
          displayName: participant.displayName,
          participantId: data.participantId,
          timestamp: Date.now(),
        });
        ack?.({ ok: true });
      } catch (err) {
        const message = err instanceof ZodError ? formatZodError(err) : "Invalid reaction payload";
        ack?.({
          ok: false,
          error: { code: "INVALID_PAYLOAD", message },
        });
      }
    });

    socket.on("webrtc:offer", (payload) => {
      relaySignaling(io, roomService, socket, data, payload, "webrtc:offer", webrtcOfferSchema);
    });

    socket.on("webrtc:answer", (payload) => {
      relaySignaling(io, roomService, socket, data, payload, "webrtc:answer", webrtcAnswerSchema);
    });

    socket.on("webrtc:ice-candidate", (payload) => {
      relaySignaling(
        io,
        roomService,
        socket,
        data,
        payload,
        "webrtc:ice-candidate",
        webrtcIceCandidateSchema
      );
    });

    socket.on("webrtc:media-state", (payload) => {
      try {
        if (!allowSignaling(socket)) return;

        const parsed = webrtcMediaStateSchema.parse(payload);
        if (!socketInRoom(data, parsed.roomId)) return;

        const room = roomService.getRoom(parsed.roomId);
        const sender = room?.participants.find((p) => p.participantId === data.participantId);
        if (!sender?.connected) return;

        socket.to(parsed.roomId).emit("webrtc:media-state", {
          participantId: data.participantId,
          cameraEnabled: parsed.cameraEnabled,
          micMuted: parsed.micMuted,
        });
      } catch {
        // ignore invalid media state
      }
    });

    socket.on("webrtc:reconnect", (payload) => {
      try {
        if (!allowSignaling(socket)) return;

        const parsed = webrtcReconnectSchema.parse(payload);
        if (!socketInRoom(data, parsed.roomId)) return;

        const room = roomService.getRoom(parsed.roomId);
        const sender = room?.participants.find((p) => p.participantId === data.participantId);
        if (!sender?.connected) return;

        socket.to(parsed.roomId).emit("webrtc:peer-reconnected", {
          participantId: data.participantId,
        });
      } catch {
        // ignore invalid reconnect
      }
    });

    socket.on("disconnect", () => {
      if (!data.roomId || !data.participantId) return;

      const roomId = data.roomId;
      const participantId = data.participantId;
      const currentParticipant = roomService.getParticipantBySocket(roomId, socket.id);
      if (!currentParticipant || currentParticipant.participantId !== participantId) return;

      const roomBefore = roomService.getRoom(roomId);
      const leavingName = roomBefore?.participants.find(
        (p) => p.participantId === participantId
      )?.displayName;

      const result = roomService.disconnectParticipant(roomId, participantId);
      if (!result) return;

      if (result.room) {
        io.to(roomId).emit("room:participant-left", {
          participantId,
          displayName: leavingName,
          room: result.room,
        });

        if (result.hostChanged) {
          io.to(roomId).emit("room:host-changed", {
            hostParticipantId: result.newHostId,
            room: result.room,
          });
        }
      }
    });
  });
}

function broadcastPlayback(io: Server, roomId: string, room: PublicRoom) {
  io.to(roomId).emit("playback:updated", { room });
}

function handlePlayback(
  socket: Socket,
  data: SocketData,
  roomService: RoomService,
  action: () => PublicRoom | { room: PublicRoom; videoId: string } | RoomError,
  io: Server,
  ack?: (response: unknown) => void,
  roomId?: string
) {
  try {
    if (roomId && !socketInRoom(data, roomId)) {
      emitError(socket, { code: "NOT_IN_ROOM", message: "Not in room" });
      ack?.({ ok: false, error: { code: "NOT_IN_ROOM", message: "Not in room" } });
      return;
    }

    const result = action();

    if ("code" in result) {
      emitError(socket, result);
      ack?.({ ok: false, error: result });
      return;
    }

    let publicRoom: PublicRoom;
    let videoId: string | undefined;

    if ("room" in result && "videoId" in result) {
      publicRoom = result.room;
      videoId = result.videoId;
    } else {
      publicRoom = result;
    }

    broadcastPlayback(io, publicRoom.roomId, publicRoom);

    if (videoId) {
      io.to(publicRoom.roomId).emit("playback:video-changed", {
        videoId,
        room: publicRoom,
      });
    }

    ack?.({ ok: true, room: publicRoom });
  } catch (err) {
    const message =
      err instanceof ZodError ? formatZodError(err) : "Invalid playback payload";
    const error = { code: "INVALID_PAYLOAD" as const, message };
    emitError(socket, error);
    ack?.({ ok: false, error });
  }
}
