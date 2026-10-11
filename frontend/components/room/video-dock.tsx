"use client";

import { useMemo } from "react";
import { useRoom } from "@/lib/room/room-context";
import { useWebRTC } from "@/lib/webrtc/webrtc-context";
import { VideoTile } from "./video-tile";
import { WebcamControls } from "./webcam-controls";

const gridClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

export function VideoDock() {
  const { room, participantId, joined } = useRoom();
  const { localStream, remotePeers, cameraEnabled, micMuted } = useWebRTC();

  const tiles = useMemo(() => {
    if (!room || !participantId) return [];

    const connected = room.participants.filter((p) => p.connected);
    const local = connected.find((p) => p.participantId === participantId);
    const remotes = connected.filter((p) => p.participantId !== participantId);

    const result = [];

    if (local) {
      result.push({
        key: local.participantId,
        participant: local,
        isLocal: true,
        stream: localStream,
        cameraEnabled,
        micMuted,
        connectionState: "connected" as const,
      });
    }

    for (const p of remotes) {
      const peer = remotePeers.get(p.participantId);
      result.push({
        key: p.participantId,
        participant: p,
        isLocal: false,
        stream: peer?.stream ?? null,
        cameraEnabled: peer?.cameraEnabled ?? false,
        micMuted: peer?.micMuted ?? true,
        connectionState: peer?.connectionState ?? "connecting",
      });
    }

    return result;
  }, [room, participantId, localStream, remotePeers, cameraEnabled, micMuted]);

  if (!joined || !room || tiles.length === 0) return null;

  const count = Math.min(tiles.length, 4);
  const gridClass = gridClasses[count] ?? gridClasses[4];

  return (
    <div className="panel-brutal-inset mt-3 flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div><p className="label text-muted">Faces in the room</p><h2 className="font-brutal mt-1 text-xl text-foreground">Video</h2></div>
        <span className="rounded-full bg-sage-soft px-2.5 py-1 text-xs font-semibold text-accent">{tiles.length}/4</span>
      </div>

      <div className={`grid gap-2 ${gridClass}`}>
        {tiles.map((tile) => (
          <VideoTile
            key={tile.key}
            displayName={tile.participant.displayName}
            avatarSeed={tile.participant.avatarSeed}
            isHost={tile.participant.isHost}
            isLocal={tile.isLocal}
            stream={tile.stream}
            cameraEnabled={tile.cameraEnabled}
            micMuted={tile.micMuted}
            connectionState={tile.connectionState}
          />
        ))}
      </div>

      <WebcamControls />
    </div>
  );
}
