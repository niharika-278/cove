import type { Participant, Room } from "@cinecouch/shared";
import { DEFAULT_ROOM_THEME, MAX_PARTICIPANTS } from "@cinecouch/shared";

export function createEmptyRoom(roomId: string, now: number = Date.now()): Room {
  return {
    roomId,
    createdAt: now,
    lastActiveAt: now,
    emptySince: null,
    hostParticipantId: null,
    creatorToken: null,
    participants: [],
    chatMessages: [],
    theme: DEFAULT_ROOM_THEME,
    playback: {
      videoId: null,
      status: "paused",
      positionSeconds: 0,
      lastUpdatedAt: now,
    },
  };
}

export function getConnectedParticipants(room: Room): Participant[] {
  return room.participants.filter((p) => p.connected);
}

export function countConnectedParticipants(room: Room): number {
  return getConnectedParticipants(room).length;
}

export function isRoomFull(room: Room, max: number = MAX_PARTICIPANTS): boolean {
  return countConnectedParticipants(room) >= max;
}

export function findParticipantBySessionToken(
  room: Room,
  sessionToken: string
): Participant | undefined {
  return room.participants.find((p) => p.sessionToken === sessionToken);
}

export function findParticipantById(
  room: Room,
  participantId: string
): Participant | undefined {
  return room.participants.find((p) => p.participantId === participantId);
}

export function getOldestConnectedParticipant(room: Room): Participant | undefined {
  return getConnectedParticipants(room).sort((a, b) => a.joinedAt - b.joinedAt)[0];
}

export function transferHost(room: Room): string | null {
  const nextHost = getOldestConnectedParticipant(room);
  room.hostParticipantId = nextHost?.participantId ?? null;

  for (const participant of room.participants) {
    participant.isHost = participant.participantId === room.hostParticipantId;
  }

  return room.hostParticipantId;
}

export function shouldDeleteEmptyRoom(
  room: Room,
  now: number,
  emptyTimeoutMs: number
): boolean {
  if (countConnectedParticipants(room) > 0) return false;
  if (room.emptySince === null) return false;
  return now - room.emptySince >= emptyTimeoutMs;
}

export function markRoomActive(room: Room, now: number = Date.now()): void {
  room.lastActiveAt = now;
  if (countConnectedParticipants(room) > 0) {
    room.emptySince = null;
  }
}

export function markRoomEmpty(room: Room, now: number = Date.now()): void {
  if (countConnectedParticipants(room) === 0 && room.emptySince === null) {
    room.emptySince = now;
  }
}
