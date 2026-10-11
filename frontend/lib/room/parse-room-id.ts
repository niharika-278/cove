import { roomIdSchema } from "@cinecouch/shared";

/**
 * Normalize a pasted room link or raw room id into a validated room id.
 * Returns null if the input cannot be parsed as a valid CineCouch room id.
 */
export function parseRoomIdFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let candidate = trimmed;

  try {
    if (trimmed.includes("://") || trimmed.startsWith("/room/")) {
      const url = trimmed.startsWith("/")
        ? new URL(trimmed, "https://cinecouch.local")
        : new URL(trimmed);
      const match = url.pathname.match(/\/room\/([^/?#]+)/);
      if (match?.[1]) {
        candidate = decodeURIComponent(match[1]);
      }
    }
  } catch {
    return null;
  }

  const parsed = roomIdSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
