export type PlaybackStatus = "playing" | "paused";

export const ROOM_THEMES = [
  "cozy-cabin",
  "rainy-evening",
  "midnight-cinema",
  "sunday-morning",
] as const;

export type RoomTheme = (typeof ROOM_THEMES)[number];

export const DEFAULT_ROOM_THEME: RoomTheme = "cozy-cabin";

export const REACTION_EMOJIS = ["❤️", "😂", "😮", "👍"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type Participant = {
  participantId: string;
  sessionToken: string;
  displayName: string;
  avatarSeed: string;
  joinedAt: number;
  isHost: boolean;
  socketId?: string;
  lastSeenAt: number;
  connected: boolean;
};

export type ChatMessage = {
  id: string;
  senderParticipantId: string;
  senderDisplayName: string;
  text: string;
  timestamp: number;
};

export type PlaybackState = {
  videoId: string | null;
  status: PlaybackStatus;
  positionSeconds: number;
  lastUpdatedAt: number;
  updatedByParticipantId?: string;
};

export type Room = {
  roomId: string;
  createdAt: number;
  lastActiveAt: number;
  emptySince: number | null;
  hostParticipantId: string | null;
  /** One-time token issued at room creation; consumed when the creator claims host. */
  creatorToken: string | null;
  participants: Participant[];
  chatMessages: ChatMessage[];
  playback: PlaybackState;
  theme: RoomTheme;
};

export type PublicParticipant = Omit<Participant, "sessionToken" | "socketId">;

export type PublicRoom = {
  roomId: string;
  createdAt: number;
  hostParticipantId: string | null;
  participants: PublicParticipant[];
  chatMessages: ChatMessage[];
  playback: PlaybackState;
  theme: RoomTheme;
};

export type RoomErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_EXPIRED"
  | "ROOM_FULL"
  | "INVALID_NAME"
  | "INVALID_VIDEO"
  | "INVALID_MESSAGE"
  | "NOT_IN_ROOM"
  | "UNAUTHORIZED"
  | "INVALID_PAYLOAD";

export type RoomError = {
  code: RoomErrorCode;
  message: string;
};

export const ROOM_ID_LENGTH = 12;
export const MAX_PARTICIPANTS = 4;
export const MAX_DISPLAY_NAME_LENGTH = 24;
export const MIN_DISPLAY_NAME_LENGTH = 1;
export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const DRIFT_THRESHOLD_SECONDS = 1.25;
export const ROOM_EMPTY_TIMEOUT_MS = 15 * 60 * 1000;

export function toPublicParticipant(p: Participant): PublicParticipant {
  const { sessionToken: _st, socketId: _sid, ...rest } = p;
  return rest;
}

export function toPublicRoom(room: Room): PublicRoom {
  return {
    roomId: room.roomId,
    createdAt: room.createdAt,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map(toPublicParticipant),
    chatMessages: room.chatMessages,
    playback: room.playback,
    theme: room.theme,
  };
}
