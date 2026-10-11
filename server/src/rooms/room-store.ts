import type { Room } from "@cinecouch/shared";

export interface RoomStore {
  get(roomId: string): Room | undefined;
  set(room: Room): void;
  delete(roomId: string): boolean;
  has(roomId: string): boolean;
  getAll(): Room[];
  size(): number;
}

export class InMemoryRoomStore implements RoomStore {
  private rooms = new Map<string, Room>();

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  set(room: Room): void {
    this.rooms.set(room.roomId, room);
  }

  delete(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  has(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  getAll(): Room[] {
    return Array.from(this.rooms.values());
  }

  size(): number {
    return this.rooms.size;
  }
}
