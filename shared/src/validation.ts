import { z } from "zod";
import {
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  REACTION_EMOJIS,
  ROOM_ID_LENGTH,
  ROOM_THEMES,
} from "./types";

/** Room IDs are 12-char alphanumeric strings from nanoid customAlphabet. */
export const roomIdSchema = z
  .string()
  .length(ROOM_ID_LENGTH, `Room ID must be ${ROOM_ID_LENGTH} characters`)
  .regex(/^[0-9A-Za-z]+$/, "Invalid room ID format");

export const displayNameSchema = z
  .string()
  .trim()
  .min(MIN_DISPLAY_NAME_LENGTH, "Display name is required")
  .max(MAX_DISPLAY_NAME_LENGTH, `Name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters`)
  .regex(/^[\p{L}\p{N}\p{M}\s._-]+$/u, "Name contains invalid characters");

export const joinRoomSchema = z.object({
  roomId: roomIdSchema,
  displayName: displayNameSchema,
  sessionToken: z.string().min(1).max(64).optional(),
  creatorToken: z.string().min(1).max(64).optional(),
});

export const reconnectRoomSchema = z.object({
  roomId: roomIdSchema,
  sessionToken: z.string().min(1).max(64),
});

export const setVideoSchema = z.object({
  roomId: roomIdSchema,
  url: z.string().min(1).max(500),
});

export const setThemeSchema = z.object({
  roomId: roomIdSchema,
  theme: z.enum(ROOM_THEMES),
});

export const playbackActionSchema = z.object({
  roomId: roomIdSchema,
  positionSeconds: z.number().min(0).max(86400),
});

export const playbackSeekSchema = playbackActionSchema.extend({
  positionSeconds: z.number().min(0).max(86400),
});

export const chatMessageSchema = z.object({
  roomId: roomIdSchema,
  text: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(MAX_CHAT_MESSAGE_LENGTH, `Message must be at most ${MAX_CHAT_MESSAGE_LENGTH} characters`),
});

export const leaveRoomSchema = z.object({
  roomId: roomIdSchema,
});

export const reactionSchema = z.object({
  roomId: roomIdSchema,
  emoji: z.enum(REACTION_EMOJIS),
});
