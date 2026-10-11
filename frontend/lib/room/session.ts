import { ROOM_THEMES, type RoomTheme } from "@cinecouch/shared";

const SESSION_PREFIX = "cinecouch:session:";
const CREATOR_PREFIX = "cinecouch:creator:";
const INITIAL_THEME_PREFIX = "cinecouch:initial-theme:";

export type RoomSession = {
  sessionToken: string;
  participantId: string;
  displayName: string;
};

export function getRoomSession(roomId: string): RoomSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${roomId}`);
    if (!raw) return null;
    return JSON.parse(raw) as RoomSession;
  } catch {
    return null;
  }
}

export function setRoomSession(roomId: string, session: RoomSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${SESSION_PREFIX}${roomId}`, JSON.stringify(session));
}

export function clearRoomSession(roomId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${SESSION_PREFIX}${roomId}`);
}

/** Stored when the user creates a room; used once to claim initial host on first join. */
export function getRoomCreatorToken(roomId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(`${CREATOR_PREFIX}${roomId}`);
}

export function setRoomCreatorToken(roomId: string, creatorToken: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${CREATOR_PREFIX}${roomId}`, creatorToken);
}

export function clearRoomCreatorToken(roomId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${CREATOR_PREFIX}${roomId}`);
}

/** Stores the creator's room-mood intent until the first join can apply it. */
export function setRoomInitialTheme(roomId: string, theme: RoomTheme): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${INITIAL_THEME_PREFIX}${roomId}`, theme);
}

export function getRoomInitialTheme(roomId: string): RoomTheme | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(`${INITIAL_THEME_PREFIX}${roomId}`);
  return value && (ROOM_THEMES as readonly string[]).includes(value)
    ? (value as RoomTheme)
    : null;
}

export function clearRoomInitialTheme(roomId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${INITIAL_THEME_PREFIX}${roomId}`);
}
