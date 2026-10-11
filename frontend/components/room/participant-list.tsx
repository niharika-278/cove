"use client";

import { useRoom } from "@/lib/room/room-context";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ParticipantList() {
  const { room, participantId } = useRoom();

  if (!room) return null;

  return (
    <div className="panel-brutal-inset p-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div><p className="label text-muted">In the room</p><h2 className="font-brutal mt-1 text-2xl text-foreground">Together</h2></div>
        <span className="tag-brutal text-muted">{room.participants.length}/4</span>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {room.participants.map((p) => (
          <li
            key={p.participantId}
            className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-2.5"
          >
            <Avatar seed={p.avatarSeed} name={p.displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                  {p.displayName}
                </span>
                {p.participantId === participantId && (
                  <span className="label text-muted-faint">YOU</span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {p.isHost && <Badge variant="host">HOST</Badge>}
                {!p.connected && <span className="label text-muted-faint">RECONNECTING</span>}
              </div>
            </div>
               <span
               className={`h-2.5 w-2.5 shrink-0 rounded-full border border-surface ${p.connected ? "bg-accent" : "bg-muted-faint animate-pulse-dot"}`}
              aria-label={p.connected ? "Online" : "Reconnecting"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
