import { z } from "zod";
import { roomIdSchema } from "./validation";

export const MAX_SDP_LENGTH = 16384;
export const MAX_ICE_CANDIDATE_LENGTH = 2048;

export const participantIdSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid participant ID");

const signalingBaseSchema = z
  .object({
    roomId: roomIdSchema,
    targetParticipantId: participantIdSchema,
  })
  .strict();

export const webrtcOfferSchema = signalingBaseSchema
  .extend({
    sdp: z.string().min(1).max(MAX_SDP_LENGTH),
  })
  .strict();

export const webrtcAnswerSchema = signalingBaseSchema
  .extend({
    sdp: z.string().min(1).max(MAX_SDP_LENGTH),
  })
  .strict();

export const webrtcIceCandidateSchema = signalingBaseSchema
  .extend({
    candidate: z.string().min(1).max(MAX_ICE_CANDIDATE_LENGTH),
    sdpMid: z.string().max(64).nullable().optional(),
    sdpMLineIndex: z.number().int().min(0).max(16).nullable().optional(),
  })
  .strict();

export const webrtcMediaStateSchema = z
  .object({
    roomId: roomIdSchema,
    cameraEnabled: z.boolean(),
    micMuted: z.boolean(),
  })
  .strict();

export const webrtcReconnectSchema = z
  .object({
    roomId: roomIdSchema,
  })
  .strict();

export type WebRTCOfferPayload = z.infer<typeof webrtcOfferSchema>;
export type WebRTCAnswerPayload = z.infer<typeof webrtcAnswerSchema>;
export type WebRTCIceCandidatePayload = z.infer<typeof webrtcIceCandidateSchema>;
export type WebRTCMediaStatePayload = z.infer<typeof webrtcMediaStateSchema>;
