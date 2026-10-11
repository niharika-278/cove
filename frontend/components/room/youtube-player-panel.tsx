"use client";

import { useState } from "react";
import Image from "next/image";
import { extractYouTubeVideoId } from "@cinecouch/shared";
import { useRoom } from "@/lib/room/room-context";
import { useYouTubePlayer } from "@/lib/youtube/use-youtube-player";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NowPlayingBar } from "./now-playing-bar";
import { VideoDock } from "./video-dock";

type YouTubePlayerPanelProps = {
  theater?: boolean;
};

function PlayerEmptyState() {
  return (
    <div className="player-empty pointer-events-none absolute inset-0 flex flex-col justify-between">
      <div className="film-grain absolute inset-0 opacity-[0.22]" aria-hidden />

      <Image
        src="/bg-mountain.jpg"
        alt=""
        fill
        className="object-cover object-[center_40%] opacity-[0.12]"
        sizes="(max-width: 1200px) 100vw, 70vw"
        aria-hidden
      />

       <div className="relative z-[1] flex items-center justify-between px-5 py-4 sm:px-7 sm:py-5">
         <span className="label text-white/50">Your screen</span>
         <span className="text-[10px] font-semibold tracking-[0.14em] text-white/50">
           READY WHEN YOU ARE
        </span>
      </div>

      <div className="relative z-[1] px-5 pb-6 sm:px-8 sm:pb-9">
         <p className="label text-white/60">A quiet screen, waiting</p>
        <div className="player-empty-rule mt-4" />
         <p className="font-brutal mt-5 text-[clamp(1.75rem,4vw,2.75rem)] leading-[0.92] tracking-[-0.02em] text-white/90">
           Bring a<br />
           favorite
        </p>
         <p className="mt-4 max-w-xs text-[11px] font-medium leading-relaxed tracking-[0.03em] text-white/60">
           Paste a YouTube link above and everyone will stay in step.
        </p>
      </div>
    </div>
  );
}

export function YouTubePlayerPanel({ theater = false }: YouTubePlayerPanelProps) {
  const { room, setVideo, play, pause, seek } = useRoom();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const videoId = room?.playback.videoId ?? null;
  const playback = room?.playback ?? null;

  const { containerId, ready, playerError } = useYouTubePlayer({
    videoId,
    playback,
    onPlay: play,
    onPause: pause,
    onSeek: seek,
  });

  const handleSetVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    if (!extractYouTubeVideoId(url)) {
      setUrlError("INVALID URL");
      return;
    }

    setLoading(true);
    try {
      await setVideo(url);
      setUrl("");
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (extractYouTubeVideoId(text)) {
        setUrl(text);
        toast("URL PASTED FROM CLIPBOARD", "info");
      } else {
        toast("CLIPBOARD IS NOT A YOUTUBE URL", "error");
      }
    } catch {
      toast("CLIPBOARD ACCESS DENIED", "error");
    }
  };

  return (
     <div className={`flex h-full flex-col gap-3 ${theater ? "gap-0" : ""}`}>
      <NowPlayingBar />

       <div className={`hero-glass flex flex-1 flex-col gap-4 p-4 sm:p-5 ${theater ? "!border-0 !bg-transparent !shadow-none" : ""}`}>
        <form onSubmit={handleSetVideo} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
             placeholder="Paste a YouTube link"
            aria-label="YouTube video URL"
             className="flex-1"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePaste}
               className="shrink-0"
              title="Paste from clipboard"
            >
               Paste
            </Button>
            <Button
              type="submit"
              disabled={loading || !url.trim()}
              variant="secondary"
              className="shrink-0"
            >
               {loading ? "Loading…" : "Load video"}
            </Button>
          </div>
        </form>
        {urlError && (
           <p className="rounded-xl border border-terracotta/30 bg-terracotta-soft px-3 py-2 text-xs font-semibold text-danger" role="alert">
            {urlError}
          </p>
        )}

        <div
           className={`player-stage w-full ${theater ? "aspect-video max-h-[80vh]" : "aspect-video"}`}
        >
          <div id={containerId} className="absolute inset-0 z-[3] h-full w-full" />

          {!videoId && <PlayerEmptyState />}
        </div>

        {videoId && (
           <div className="flex items-center justify-between border-t border-border pt-3 text-[10px] font-semibold uppercase tracking-[0.1em]">
            <span className="text-muted">
               {ready ? "Ready" : "Loading"}
              {ready && playback?.status === "playing" && (
                 <span className="ml-2 text-accent">· Synced</span>
              )}
            </span>
            {playerError && <span className="text-muted">{playerError}</span>}
          </div>
        )}

        <VideoDock />
      </div>
    </div>
  );
}
