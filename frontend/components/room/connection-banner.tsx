"use client";

import { useRoom } from "@/lib/room/room-context";

export function ConnectionBanner() {
  const { connectionState } = useRoom();

  if (connectionState === "connected") return null;

  const message = {
    connecting: "CONNECTING TO ROOM…",
    reconnecting: "CONNECTION LOST — RECONNECTING…",
    disconnected: "DISCONNECTED — CHECK YOUR NETWORK",
  }[connectionState];

  const style =
       connectionState === "disconnected"
       ? "bg-terracotta-soft border-terracotta/30 text-danger"
       : "bg-sage-soft border-border text-accent";

  return (
    <div
      className={`border-b px-4 py-2 text-center text-xs font-semibold tracking-wide ${style}`}
      role="status"
    >
      {message}
    </div>
  );
}
