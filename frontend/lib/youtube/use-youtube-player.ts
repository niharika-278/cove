"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DRIFT_THRESHOLD_SECONDS,
  getEffectivePlaybackPosition,
  shouldCorrectDrift,
  type PlaybackState,
} from "@cinecouch/shared";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          height?: string;
          width?: string;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  destroy: () => void;
};

type UseYouTubePlayerOptions = {
  videoId: string | null;
  playback: PlaybackState | null;
  onPlay: (positionSeconds: number) => void;
  onPause: (positionSeconds: number) => void;
  onSeek: (positionSeconds: number) => void;
};

let apiLoading: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoading) return apiLoading;

  apiLoading = new Promise((resolve) => {
    const finish = () => {
      if (window.YT?.Player) resolve();
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      finish();
    };

    finish();

    const poll = setInterval(() => {
      if (window.YT?.Player) {
        clearInterval(poll);
        resolve();
      }
    }, 100);

    setTimeout(() => clearInterval(poll), 15000);
  });

  return apiLoading;
}

function waitForElement(id: string, maxMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const started = Date.now();
    const poll = setInterval(() => {
      if (document.getElementById(id)) {
        clearInterval(poll);
        resolve();
      } else if (Date.now() - started > maxMs) {
        clearInterval(poll);
        reject(new Error("Player container not found"));
      }
    }, 50);
  });
}

export function useYouTubePlayer({
  videoId,
  playback,
  onPlay,
  onPause,
  onSeek,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).slice(2)}`);
  const syncingRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef = useRef(onSeek);
  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;
  onSeekRef.current = onSeek;

  const withSyncGuard = useCallback(async (fn: () => void | Promise<void>) => {
    syncingRef.current = true;
    try {
      await fn();
    } finally {
      setTimeout(() => {
        syncingRef.current = false;
      }, 300);
    }
  }, []);

  const applyPlaybackState = useCallback(
    async (state: PlaybackState) => {
      const player = playerRef.current;
      if (!player || !state.videoId) return;

      const target = getEffectivePlaybackPosition(state);
      const local = player.getCurrentTime();

      if (shouldCorrectDrift(local, target, DRIFT_THRESHOLD_SECONDS)) {
        await withSyncGuard(() => {
          player.seekTo(target, true);
        });
      }

      const ytPlaying = window.YT?.PlayerState.PLAYING ?? 1;
      const isPlaying = player.getPlayerState() === ytPlaying;

      if (state.status === "playing" && !isPlaying) {
        await withSyncGuard(() => player.playVideo());
      } else if (state.status === "paused" && isPlaying) {
        await withSyncGuard(() => player.pauseVideo());
      }
    },
    [withSyncGuard]
  );

  // Initialize player once the container div is in the DOM
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await waitForElement(containerId.current);
        await loadYouTubeApi();
        if (cancelled || !window.YT) return;

        if (playerRef.current) return;

        playerRef.current = new window.YT.Player(containerId.current, {
          height: "100%",
          width: "100%",
          playerVars: {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!cancelled) setReady(true);
            },
            onStateChange: (event) => {
              if (syncingRef.current || !playerRef.current) return;

              const YT = window.YT!;
              const time = playerRef.current.getCurrentTime();

              if (event.data === YT.PlayerState.PLAYING) {
                onPlayRef.current(time);
              } else if (event.data === YT.PlayerState.PAUSED) {
                onPauseRef.current(time);
              } else if (event.data === YT.PlayerState.BUFFERING) {
                onSeekRef.current(time);
              }
            },
            onError: (event) => {
              const messages: Record<number, string> = {
                2: "Invalid video ID",
                5: "Playback error",
                100: "Video not found",
                101: "Embedding disabled",
                150: "Embedding disabled",
              };
              if (!cancelled) {
                setPlayerError(messages[event.data] ?? "Playback error");
              }
            },
          },
        });
      } catch {
        if (!cancelled) setPlayerError("Failed to load YouTube player");
      }
    }

    init();

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setReady(false);
    };
  }, []);

  // Load video when videoId changes and player is ready
  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player || !videoId) return;

    if (lastVideoIdRef.current !== videoId) {
      lastVideoIdRef.current = videoId;
      const startAt = playback ? getEffectivePlaybackPosition(playback) : 0;

      setPlayerError(null);
      withSyncGuard(() => {
        player.cueVideoById(videoId, startAt);
        if (playback?.status === "paused") {
          setTimeout(() => player.pauseVideo(), 100);
        }
      });
    }
  }, [videoId, ready, playback, withSyncGuard]);

  useEffect(() => {
    if (!ready || !playback?.videoId) return;
    applyPlaybackState(playback);
  }, [playback, ready, applyPlaybackState]);

  useEffect(() => {
    if (!ready || !playback) return;

    const interval = setInterval(() => {
      if (!playback || playback.status !== "playing") return;
      applyPlaybackState(playback);
    }, 5000);

    return () => clearInterval(interval);
  }, [ready, playback, applyPlaybackState]);

  const seek = useCallback(
    (seconds: number) => {
      if (syncingRef.current || !playerRef.current) return;
      onSeek(seconds);
    },
    [onSeek]
  );

  return {
    containerId: containerId.current,
    ready,
    playerError,
    seek,
    getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
  };
}
