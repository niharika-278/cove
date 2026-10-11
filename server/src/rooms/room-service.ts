import {
  extractYouTubeVideoId,
  ROOM_THEMES,
  sanitizeChatText,
  sanitizeDisplayName,
  toPublicRoom,
  type ChatMessage,
  type Participant,
  type PublicRoom,
  type Room,
  type RoomError,
  type RoomTheme,
} from "@cinecouch/shared";
import { customAlphabet, nanoid } from "nanoid";
import { config } from "../config";
import {
  applyPauseAction,
  applyPlayAction,
  applySeekAction,
  applySetVideo,
} from "./playback";
import {
  countConnectedParticipants,
  createEmptyRoom,
  findParticipantById,
  findParticipantBySessionToken,
  getConnectedParticipants,
  isRoomFull,
  markRoomActive,
  markRoomEmpty,
  shouldDeleteEmptyRoom,
  transferHost,
} from "./room-helpers";
import type { RoomStore } from "./room-store";

const roomIdAlphabet = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12
);

function makeError(code: RoomError["code"], message: string): RoomError {
  return { code, message };
}

function generateAvatarSeed(displayName: string): string {
  return displayName.toLowerCase().replace(/\s+/g, "-").slice(0, 32) || nanoid(8);
}

export class RoomService {
  constructor(private readonly store: RoomStore) {}

  createRoom(): { room: Room; creatorToken: string } {
    const now = Date.now();
    const roomId = roomIdAlphabet();
    const creatorToken = nanoid(32);
    const room = createEmptyRoom(roomId, now);
    room.creatorToken = creatorToken;
    this.store.set(room);
    return { room, creatorToken };
  }

  getRoom(roomId: string): Room | undefined {
    return this.store.get(roomId);
  }

  getPublicRoom(roomId: string): PublicRoom | null {
    const room = this.store.get(roomId);
    if (!room) return null;
    return toPublicRoom(room);
  }

  roomExists(roomId: string): boolean {
    return this.store.has(roomId);
  }

  joinRoom(
    roomId: string,
    displayName: string,
    socketId: string,
    sessionToken?: string,
    creatorToken?: string
  ): { room: PublicRoom; participant: Participant; sessionToken: string } | RoomError {
    const room = this.store.get(roomId);
    if (!room) {
      return makeError("ROOM_NOT_FOUND", "This room does not exist or has expired.");
    }

    const now = Date.now();
    const sanitizedName = sanitizeDisplayName(displayName);

    if (!sanitizedName) {
      return makeError("INVALID_NAME", "Please enter a valid display name.");
    }

    if (sessionToken) {
      const existing = findParticipantBySessionToken(room, sessionToken);
      if (existing) {
        existing.connected = true;
        existing.socketId = socketId;
        existing.lastSeenAt = now;
        existing.displayName = sanitizedName;
        markRoomActive(room, now);
        this.store.set(room);
        return {
          room: toPublicRoom(room),
          participant: existing,
          sessionToken: existing.sessionToken,
        };
      }
    }

    if (isRoomFull(room, config.maxParticipants)) {
      return makeError("ROOM_FULL", "This room is full (maximum 4 participants).");
    }

    const participantId = nanoid(16);
    const token = nanoid(32);

    const canClaimHost =
      !!creatorToken &&
      room.creatorToken === creatorToken &&
      room.hostParticipantId === null;

    const participant: Participant = {
      participantId,
      sessionToken: token,
      displayName: sanitizedName,
      avatarSeed: generateAvatarSeed(sanitizedName),
      joinedAt: now,
      isHost: canClaimHost,
      socketId,
      lastSeenAt: now,
      connected: true,
    };

    room.participants.push(participant);

    if (canClaimHost) {
      room.hostParticipantId = participantId;
      room.creatorToken = null;
    }

    markRoomActive(room, now);
    this.store.set(room);

    return {
      room: toPublicRoom(room),
      participant,
      sessionToken: token,
    };
  }

  reconnectRoom(
    roomId: string,
    sessionToken: string,
    socketId: string
  ): { room: PublicRoom; participant: Participant } | RoomError {
    const room = this.store.get(roomId);
    if (!room) {
      return makeError("ROOM_NOT_FOUND", "This room does not exist or has expired.");
    }

    const participant = findParticipantBySessionToken(room, sessionToken);
    if (!participant) {
      return makeError("UNAUTHORIZED", "Could not restore your session. Please join again.");
    }

    const now = Date.now();
    participant.connected = true;
    participant.socketId = socketId;
    participant.lastSeenAt = now;
    markRoomActive(room, now);
    this.store.set(room);

    return { room: toPublicRoom(room), participant };
  }

  leaveRoom(
    roomId: string,
    participantId: string
  ): { room: PublicRoom | null; hostChanged: boolean; newHostId: string | null } | RoomError {
    const room = this.store.get(roomId);
    if (!room) {
      return makeError("ROOM_NOT_FOUND", "Room not found.");
    }

    const participant = findParticipantById(room, participantId);
    if (!participant) {
      return makeError("NOT_IN_ROOM", "You are not in this room.");
    }

    const wasHost = participant.isHost;
    participant.connected = false;
    participant.socketId = undefined;
    participant.lastSeenAt = Date.now();

    let hostChanged = false;
    let newHostId: string | null = room.hostParticipantId;

    if (wasHost && countConnectedParticipants(room) > 0) {
      newHostId = transferHost(room);
      hostChanged = true;
    } else if (countConnectedParticipants(room) === 0) {
      room.hostParticipantId = null;
      newHostId = null;
    }

    if (countConnectedParticipants(room) === 0) {
      markRoomEmpty(room);
    }

    this.store.set(room);

    return {
      room: countConnectedParticipants(room) > 0 ? toPublicRoom(room) : null,
      hostChanged,
      newHostId,
    };
  }

  disconnectParticipant(
    roomId: string,
    participantId: string
  ): { hostChanged: boolean; newHostId: string | null; room: PublicRoom | null } | null {
    const room = this.store.get(roomId);
    if (!room) return null;

    const participant = findParticipantById(room, participantId);
    if (!participant || !participant.connected) return null;

    const wasHost = participant.isHost;
    participant.connected = false;
    participant.socketId = undefined;
    participant.lastSeenAt = Date.now();

    let hostChanged = false;
    let newHostId: string | null = room.hostParticipantId;

    if (wasHost && countConnectedParticipants(room) > 0) {
      newHostId = transferHost(room);
      hostChanged = true;
    } else if (countConnectedParticipants(room) === 0) {
      room.hostParticipantId = null;
      newHostId = null;
      markRoomEmpty(room);
    }

    this.store.set(room);

    return {
      hostChanged,
      newHostId,
      room: countConnectedParticipants(room) > 0 ? toPublicRoom(room) : null,
    };
  }

  setVideo(
    roomId: string,
    participantId: string,
    url: string
  ): { room: PublicRoom; videoId: string } | RoomError {
    const room = this.store.get(roomId);
    if (!room) return makeError("ROOM_NOT_FOUND", "Room not found.");

    const participant = findParticipantById(room, participantId);
    if (!participant?.connected) return makeError("NOT_IN_ROOM", "Not in room.");

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return makeError("INVALID_VIDEO", "Invalid YouTube URL or video ID.");

    const now = Date.now();
    room.playback = applySetVideo(room.playback, videoId, participantId, now);
    markRoomActive(room, now);
    this.store.set(room);

    return { room: toPublicRoom(room), videoId };
  }

  setTheme(roomId: string, participantId: string, theme: RoomTheme): PublicRoom | RoomError {
    const room = this.store.get(roomId);
    if (!room) return makeError("ROOM_NOT_FOUND", "Room not found.");

    const participant = findParticipantById(room, participantId);
    if (!participant?.connected || room.hostParticipantId !== participantId) {
      return makeError("UNAUTHORIZED", "Only the room host can change the theme.");
    }

    if (!ROOM_THEMES.includes(theme)) {
      return makeError("INVALID_PAYLOAD", "Invalid room theme.");
    }

    room.theme = theme;
    markRoomActive(room);
    this.store.set(room);

    return toPublicRoom(room);
  }

  play(
    roomId: string,
    participantId: string,
    positionSeconds: number
  ): PublicRoom | RoomError {
    return this.updatePlayback(roomId, participantId, (room, pid, now) => {
      room.playback = applyPlayAction(room.playback, positionSeconds, pid, now);
    });
  }

  pause(
    roomId: string,
    participantId: string,
    positionSeconds: number
  ): PublicRoom | RoomError {
    return this.updatePlayback(roomId, participantId, (room, pid, now) => {
      room.playback = applyPauseAction(room.playback, positionSeconds, pid, now);
    });
  }

  seek(
    roomId: string,
    participantId: string,
    positionSeconds: number
  ): PublicRoom | RoomError {
    return this.updatePlayback(roomId, participantId, (room, pid, now) => {
      room.playback = applySeekAction(room.playback, positionSeconds, pid, now);
    });
  }

  private updatePlayback(
    roomId: string,
    participantId: string,
    updater: (room: Room, participantId: string, now: number) => void
  ): PublicRoom | RoomError {
    const room = this.store.get(roomId);
    if (!room) return makeError("ROOM_NOT_FOUND", "Room not found.");

    const participant = findParticipantById(room, participantId);
    if (!participant?.connected) return makeError("NOT_IN_ROOM", "Not in room.");

    const now = Date.now();
    updater(room, participantId, now);
    markRoomActive(room, now);
    this.store.set(room);

    return toPublicRoom(room);
  }

  sendChat(
    roomId: string,
    participantId: string,
    text: string
  ): { message: ChatMessage; room: PublicRoom } | RoomError {
    const room = this.store.get(roomId);
    if (!room) return makeError("ROOM_NOT_FOUND", "Room not found.");

    const participant = findParticipantById(room, participantId);
    if (!participant?.connected) return makeError("NOT_IN_ROOM", "Not in room.");

    const sanitized = sanitizeChatText(text);
    if (!sanitized) return makeError("INVALID_MESSAGE", "Message cannot be empty.");

    const now = Date.now();
    const message: ChatMessage = {
      id: nanoid(12),
      senderParticipantId: participantId,
      senderDisplayName: participant.displayName,
      text: sanitized,
      timestamp: now,
    };

    room.chatMessages.push(message);

    if (room.chatMessages.length > config.maxChatMessages) {
      room.chatMessages = room.chatMessages.slice(-config.maxChatMessages);
    }

    markRoomActive(room, now);
    this.store.set(room);

    return { message, room: toPublicRoom(room) };
  }

  cleanupExpiredRooms(now: number = Date.now()): string[] {
    const deleted: string[] = [];

    for (const room of this.store.getAll()) {
      if (shouldDeleteEmptyRoom(room, now, config.roomEmptyTimeoutMs)) {
        this.store.delete(room.roomId);
        deleted.push(room.roomId);
      }
    }

    return deleted;
  }

  getParticipantBySocket(
    roomId: string,
    socketId: string
  ): Participant | undefined {
    const room = this.store.get(roomId);
    if (!room) return undefined;
    return room.participants.find((p) => p.socketId === socketId && p.connected);
  }
}
