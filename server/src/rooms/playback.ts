import {
  clampPlaybackPosition,
  type PlaybackState,
  type PlaybackStatus,
} from "@cinecouch/shared";

export function createInitialPlayback(now: number = Date.now()): PlaybackState {
  return {
    videoId: null,
    status: "paused",
    positionSeconds: 0,
    lastUpdatedAt: now,
  };
}

export function applyPlayAction(
  playback: PlaybackState,
  positionSeconds: number,
  participantId: string,
  now: number = Date.now()
): PlaybackState {
  return {
    ...playback,
    status: "playing",
    positionSeconds: clampPlaybackPosition(positionSeconds),
    lastUpdatedAt: now,
    updatedByParticipantId: participantId,
  };
}

export function applyPauseAction(
  playback: PlaybackState,
  positionSeconds: number,
  participantId: string,
  now: number = Date.now()
): PlaybackState {
  return {
    ...playback,
    status: "paused",
    positionSeconds: clampPlaybackPosition(positionSeconds),
    lastUpdatedAt: now,
    updatedByParticipantId: participantId,
  };
}

export function applySeekAction(
  playback: PlaybackState,
  positionSeconds: number,
  participantId: string,
  now: number = Date.now()
): PlaybackState {
  const status: PlaybackStatus = playback.status;
  return {
    ...playback,
    status,
    positionSeconds: clampPlaybackPosition(positionSeconds),
    lastUpdatedAt: now,
    updatedByParticipantId: participantId,
  };
}

export function applySetVideo(
  playback: PlaybackState,
  videoId: string,
  participantId: string,
  now: number = Date.now()
): PlaybackState {
  return {
    videoId,
    status: "paused",
    positionSeconds: 0,
    lastUpdatedAt: now,
    updatedByParticipantId: participantId,
  };
}
