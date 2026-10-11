import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

export function getConnectionState(s: Socket): ConnectionState {
  if (s.connected) return "connected";
  if (s.active) return "reconnecting";
  return "disconnected";
}
