"use client";

import { useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PeerConnectionState } from "@/lib/webrtc/webrtc-context";

type VideoTileProps = {
  displayName: string;
  avatarSeed: string;
  isHost: boolean;
  isLocal: boolean;
  stream: MediaStream | null;
  cameraEnabled: boolean;
  micMuted: boolean;
  connectionState: PeerConnectionState;
  className?: string;
};

const connectionColors: Record<PeerConnectionState, string> = {
  new: "bg-muted-faint",
  connecting: "bg-muted animate-pulse-dot",
  connected: "bg-foreground",
  disconnected: "bg-muted",
  failed: "bg-muted",
  closed: "bg-muted-faint",
};

export function VideoTile({
  displayName,
  avatarSeed,
  isHost,
  isLocal,
  stream,
  cameraEnabled,
  micMuted,
  connectionState,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasLiveVideo =
    stream &&
    cameraEnabled &&
    stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");

  const hasLiveAudio =
    stream &&
    !micMuted &&
    stream.getAudioTracks().some((t) => t.enabled && t.readyState === "live");

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (hasLiveVideo) {
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream, hasLiveVideo]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || isLocal) return;

    if (hasLiveAudio && stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream, hasLiveAudio, isLocal]);

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background",
        className
      )}
    >
       <div className="relative aspect-video w-full bg-[#22312d]">
        {hasLiveVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              isLocal && "scale-x-[-1]"
            )}
          />
        ) : (
             <div className="absolute inset-0 flex items-center justify-center bg-sage-soft/50">
            <Avatar seed={avatarSeed} name={displayName} size="lg" />
          </div>
        )}

        {!isLocal && <audio ref={audioRef} autoPlay playsInline className="hidden" />}

        <div className="absolute left-2 top-2 flex items-center gap-1.5">
           <span
             className={cn("h-2 w-2 rounded-full border border-surface", connectionColors[connectionState])}
            title={connectionState}
          />
          {isHost && <Badge variant="host">HOST</Badge>}
        </div>

        <div className="absolute right-2 top-2 flex gap-1">
          {micMuted && (
             <span className="label rounded-full border border-border bg-surface/90 px-1.5 py-0.5 text-muted">
              MUTED
            </span>
          )}
          {!cameraEnabled && (
             <span className="label rounded-full border border-border bg-surface/90 px-1.5 py-0.5 text-muted">
              CAM OFF
            </span>
          )}
        </div>
      </div>

       <div className="flex items-center gap-2 border-t border-border px-2 py-1.5">
         <span className="truncate text-xs font-semibold">
          {isLocal ? "ME" : displayName}
        </span>
      </div>
    </div>
  );
}
