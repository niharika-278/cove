"use client";

import { useWebRTC } from "@/lib/webrtc/webrtc-context";
import { Button } from "@/components/ui/button";

export function WebcamControls() {
  const {
    cameraEnabled,
    micMuted,
    cameras,
    microphones,
    selectedCameraId,
    selectedMicrophoneId,
    mediaError,
    toggleCamera,
    toggleMic,
    selectCamera,
    selectMicrophone,
  } = useWebRTC();

  return (
      <div className="flex flex-col gap-2 border-t border-border pt-3">
      {mediaError && (
          <p className="rounded-xl border border-terracotta/30 bg-terracotta-soft px-2 py-1.5 text-xs text-danger">
          {mediaError.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant={cameraEnabled ? "secondary" : "ghost"}
          size="sm"
          onClick={() => toggleCamera()}
          aria-pressed={cameraEnabled}
        >
           {cameraEnabled ? "Camera on" : "Camera off"}
        </Button>

        <Button
          variant={!micMuted ? "secondary" : "ghost"}
          size="sm"
          onClick={() => toggleMic()}
          aria-pressed={!micMuted}
        >
           {micMuted ? "Muted" : "Mic on"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
           <span className="label text-muted-faint">Camera</span>
          <select
            value={selectedCameraId ?? ""}
            onChange={(e) => selectCamera(e.target.value)}
            disabled={cameras.length === 0}
             className="w-full rounded-xl border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
          >
            {cameras.length === 0 ? (
                   <option value="">No cameras</option>
            ) : (
              cameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="flex min-w-0 flex-1 flex-col gap-1">
           <span className="label text-muted-faint">Microphone</span>
          <select
            value={selectedMicrophoneId ?? ""}
            onChange={(e) => selectMicrophone(e.target.value)}
            disabled={microphones.length === 0}
             className="w-full rounded-xl border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
          >
            {microphones.length === 0 ? (
                   <option value="">No microphones</option>
            ) : (
              microphones.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label}
                </option>
              ))
            )}
          </select>
        </label>
      </div>
    </div>
  );
}
