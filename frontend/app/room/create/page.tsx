"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEFAULT_ROOM_THEME, type RoomTheme } from "@cinecouch/shared";
import { createRoom } from "@/lib/api/rooms";
import {
  setRoomCreatorToken,
  setRoomInitialTheme,
} from "@/lib/room/session";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ROOM_THEME_OPTIONS,
  ThemePreview,
} from "@/components/room/theme-options";

export default function CreateRoomPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<RoomTheme>(DEFAULT_ROOM_THEME);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;

    setCreating(true);
    setError(null);
    try {
      const { roomId, creatorToken } = await createRoom();
      setRoomCreatorToken(roomId, creatorToken);
      setRoomInitialTheme(roomId, theme);
      router.replace(`/room/${roomId}`);
    } catch {
      setCreating(false);
      setError("We couldn’t make a room right now. Please try again.");
    }
  };

  return (
    <main data-theme={theme} className="min-h-screen bg-background px-5 py-6 text-foreground sm:px-8 sm:py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" aria-label="Back to Cove" className="transition-opacity hover:opacity-75">
          <Logo size="sm" />
        </Link>
        <Link href="/" className="text-sm font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline">
          Back home
        </Link>
      </div>

      <div className="mx-auto mt-14 max-w-3xl sm:mt-20">
        <div className="max-w-xl">
          <p className="label text-accent">Make a little room</p>
          <h1 className="font-brutal mt-4 text-[clamp(3.25rem,8vw,6.5rem)]">Choose the mood.</h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Pick a starting point for your watch party. You can change the room mood later if you&apos;re the host.
          </p>
        </div>

        <form onSubmit={handleCreate} className="mt-10">
          <fieldset disabled={creating}>
            <legend className="sr-only">Room mood</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Choose a room mood">
              {ROOM_THEME_OPTIONS.map((option) => {
                const selected = option.id === theme;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTheme(option.id)}
                    className={`group rounded-2xl border bg-surface p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md ${selected ? "border-accent ring-2 ring-accent/25" : "border-border"}`}
                  >
                    <ThemePreview theme={option.id} />
                    <span className="mt-3 flex items-start justify-between gap-3 px-1">
                      <span>
                        <span className="block text-base font-semibold">{option.label}</span>
                        <span className="mt-1 block text-sm text-muted">{option.description}</span>
                      </span>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${selected ? "border-accent bg-accent text-on-accent" : "border-border text-transparent"}`} aria-hidden="true">✓</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error && <p className="mt-4 rounded-xl border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-danger" role="alert">{error}</p>}

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button type="submit" size="lg" disabled={creating}>
              {creating ? "Making your room…" : "Start room"}
            </Button>
            <p className="max-w-xs text-sm leading-relaxed text-muted">No signup. Your room link is ready in a moment.</p>
          </div>
        </form>
      </div>
    </main>
  );
}
