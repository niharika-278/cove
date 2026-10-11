"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchRoom } from "@/lib/api/rooms";
import { parseRoomIdFromInput } from "@/lib/room/parse-room-id";
import { BrowserMockup } from "./browser-mockup";

function JoinRoomPanel() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const roomId = parseRoomIdFromInput(input);
    if (!roomId) {
      setError("Enter a room link or room ID.");
      return;
    }
    setChecking(true);
    try {
      if (!(await fetchRoom(roomId))) {
        setError("That room is no longer available.");
        return;
      }
      router.push(`/room/${roomId}`);
    } catch {
      setError("Cove could not reach the room server.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <form onSubmit={handleJoin} className="landing-card mt-5 max-w-lg p-4" aria-label="Join an existing room">
      <label htmlFor="join-room-input" className="landing-section-label">Have an invite?</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="join-room-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste a room link or ID"
          className="landing-input flex-1"
          disabled={checking}
        />
        <button type="submit" disabled={checking || !input.trim()} className="landing-btn-ghost disabled:opacity-40">
          {checking ? "Checking…" : "Join room"}
        </button>
      </div>
      {error && <p className="mt-3 rounded-xl bg-terracotta-soft px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
    </form>
  );
}

export function HeroSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showJoin, setShowJoin] = useState(false);
  const serverError = searchParams.get("error") === "server";

  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative overflow-hidden px-6 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
      <div className="landing-glow -right-24 top-32 h-80 w-80 opacity-70" aria-hidden />
      <div className="landing-glow -left-32 bottom-0 h-96 w-96 opacity-45" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
        <div className="max-w-xl">
          <div className="flex flex-wrap gap-2">
            <span className="landing-tag bg-sage-soft text-accent">Private watch rooms</span>
            <span className="landing-tag">No signup</span>
          </div>
          <h1 id="hero-heading" className="landing-heading mt-7 text-[clamp(4rem,10vw,7.6rem)] text-foreground">
            The internet feels<br /><em className="text-accent">smaller here.</em>
          </h1>
          <p className="landing-body mt-7 max-w-md text-lg">
            Cove is a little place to watch YouTube with your people. Share a link, settle in, and let the room keep everyone in sync.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
            <button type="button" onClick={() => router.push("/room/create")} className="landing-btn-primary">
              Create a room <span aria-hidden>↗</span>
            </button>
            <button type="button" onClick={() => setShowJoin((value) => !value)} className="landing-btn-ghost" aria-expanded={showJoin} aria-controls="join-room-panel">
              {showJoin ? "Hide join" : "Join a room"}
            </button>
          </div>
          {showJoin && <div id="join-room-panel"><JoinRoomPanel /></div>}
          {serverError && <p className="mt-4 rounded-xl bg-terracotta-soft px-4 py-3 text-sm text-danger" role="alert">Cove is having trouble reaching the server. Try again in a moment.</p>}
          <div className="mt-10 flex items-start gap-3 border-t border-border pt-5">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
            <p className="max-w-sm text-sm leading-relaxed text-muted">Ephemeral rooms, link-only access, and a calm space for up to four friends.</p>
          </div>
        </div>
        <div className="relative lg:pt-5">
          <BrowserMockup />
          <div className="absolute -bottom-5 -left-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-lg sm:-left-8" aria-hidden>
            <p className="label text-accent">A room that feels like yours</p>
            <p className="mt-1 text-sm text-muted">synced playback · live chat · video</p>
          </div>
        </div>
      </div>
    </section>
  );
}
