import type { PlaybackState } from "./types";

export function getEffectivePlaybackPosition(
  playback: PlaybackState,
  now: number = Date.now()
): number {
  if (!playback.videoId) return 0;

  const base = Math.max(0, playback.positionSeconds);

  if (playback.status === "paused") {
    return base;
  }

  const elapsedMs = Math.max(0, now - playback.lastUpdatedAt);
  return base + elapsedMs / 1000;
}

export function clampPlaybackPosition(seconds: number, maxDuration?: number): number {
  const clamped = Math.max(0, seconds);
  if (maxDuration !== undefined && maxDuration > 0) {
    return Math.min(clamped, maxDuration);
  }
  return clamped;
}

export function shouldCorrectDrift(
  localSeconds: number,
  targetSeconds: number,
  threshold: number = 1.25
): boolean {
  return Math.abs(localSeconds - targetSeconds) > threshold;
}
