import { API_URL } from "../config";
import type { PublicRoom } from "@cinecouch/shared";

export type CreateRoomResponse = {
  roomId: string;
  creatorToken: string;
};

export async function createRoom(): Promise<CreateRoomResponse> {
  const res = await fetch(`${API_URL}/api/rooms`, { method: "POST" });
  if (!res.ok) {
    throw new Error("Failed to create room");
  }
  return res.json();
}

export async function fetchRoom(roomId: string): Promise<PublicRoom | null> {
  const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch room");
  return res.json();
}
