"use client";

import { useRoom } from "@/lib/room/room-context";
import { copyToClipboard, getRoomUrl } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemePicker } from "./theme-picker";
import { ReactionBar } from "./reaction-bar";

type RoomHeaderProps = {
  onShare: () => void;
  onShowShortcuts: () => void;
  theater: boolean;
  onToggleTheater: () => void;
};

export function RoomHeader({
  onShare,
  onShowShortcuts,
  theater,
  onToggleTheater,
}: RoomHeaderProps) {
  const { roomId, room, connectionState, leaveRoom } = useRoom();
  const { toast } = useToast();

  const handleCopy = async () => {
    const ok = await copyToClipboard(getRoomUrl(roomId));
    if (ok) toast("LINK COPIED", "success");
  };

  const connectionLabel = {
    connected: "LIVE",
    connecting: "CONNECTING",
    reconnecting: "RECONNECTING",
    disconnected: "OFFLINE",
  }[connectionState];

  const connectionColor = {
    connected: "bg-foreground",
    connecting: "bg-muted animate-pulse-dot",
    reconnecting: "bg-muted animate-pulse-dot",
    disconnected: "bg-muted",
  }[connectionState];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md sm:px-5">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <a href="/" className="transition-opacity hover:opacity-70">
            <Logo size="sm" />
          </a>
           <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="flex items-center gap-2">
             <span className="label text-muted-faint">ROOM</span>
             <span className="tag-brutal font-mono text-foreground">{roomId}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="label hidden items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1.5 text-muted sm:flex">
             <span className={`h-2 w-2 rounded-full ${connectionColor}`} />
            {connectionLabel}
            {room && (
              <span className="text-muted-faint">· {room.participants.length}/4</span>
            )}
          </div>

           <ReactionBar />
            <ThemePicker />

           <Button variant="ghost" size="sm" onClick={onToggleTheater} aria-pressed={theater}>
             {theater ? "Exit theater" : "Theater"}
           </Button>

          <Button variant="secondary" size="sm" onClick={onShare}>
             Share
          </Button>

          <Button variant="ghost" size="sm" onClick={handleCopy} className="hidden sm:inline-flex">
             Copy
          </Button>

          <Button variant="ghost" size="sm" onClick={onShowShortcuts} aria-label="Keyboard shortcuts">
             ?
          </Button>

          <Button variant="ghost" size="sm" onClick={leaveRoom}>
             Leave
          </Button>
        </div>
      </div>
    </header>
  );
}
