"use client";

import { useEffect, useState } from "react";
import { fetchYouTubeMeta } from "@/lib/youtube/oembed";
import { useRoom } from "@/lib/room/room-context";

export function NowPlayingBar() {
  const { room } = useRoom();
  const videoId = room?.playback.videoId;
  const [title, setTitle] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) {
      setTitle(null);
      setAuthor(null);
      return;
    }

    let cancelled = false;
    fetchYouTubeMeta(videoId).then((meta) => {
      if (cancelled || !meta) return;
      setTitle(meta.title);
      setAuthor(meta.author_name);
    });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  if (!videoId) return null;

  const playing = room?.playback.status === "playing";
  const status = playing ? "PLAYING" : "PAUSED";

  return (
    <div className="panel-brutal flex items-stretch overflow-hidden">
      <div
        className={`flex w-2 shrink-0 ${playing ? "bg-accent" : "bg-muted-faint"}`}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <div className="min-w-0">
           <p className="label text-muted-faint">Now {status.toLowerCase()}</p>
           <p className="truncate text-base font-semibold text-foreground sm:text-lg">
            {title ?? "LOADING TITLE…"}
          </p>
          {author && (
            <p className="truncate font-mono text-xs font-bold uppercase text-muted">{author}</p>
          )}
        </div>
        <span
           className={`tag-brutal shrink-0 ${playing ? "border-accent/40 text-accent" : "text-muted"}`}
        >
          {playing ? "● LIVE" : "■ PAUSED"}
        </span>
      </div>
    </div>
  );
}
