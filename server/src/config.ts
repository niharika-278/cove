import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

function parseClientOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: parseInt(process.env.PORT ?? "4001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  /** Comma-separated in production to allow Vercel preview URLs, e.g. https://app.vercel.app,https://*.vercel.app is NOT supported — list explicit origins. */
  clientOrigins: parseClientOrigins(
    process.env.CLIENT_ORIGIN ?? "http://localhost:3000"
  ),
  roomEmptyTimeoutMs: parseInt(
    process.env.ROOM_EMPTY_TIMEOUT_MS ?? String(15 * 60 * 1000),
    10
  ),
  roomCleanupIntervalMs: parseInt(
    process.env.ROOM_CLEANUP_INTERVAL_MS ?? "60000",
    10
  ),
  maxParticipants: parseInt(process.env.MAX_PARTICIPANTS_PER_ROOM ?? "4", 10),
  maxChatMessages: parseInt(process.env.MAX_CHAT_MESSAGES ?? "200", 10),
  isDev: (process.env.NODE_ENV ?? "development") !== "production",
};
