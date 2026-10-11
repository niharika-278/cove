"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Heart, Laugh, Sparkles, ThumbsUp, type LucideIcon } from "lucide-react";
import { useRoom } from "@/lib/room/room-context";

const REACTIONS = [
  { emoji: "❤️", label: "Heart", Icon: Heart },
  { emoji: "😂", label: "Laugh", Icon: Laugh },
  { emoji: "😮", label: "Surprised", Icon: CircleAlert },
  { emoji: "👍", label: "Thumbs-up", Icon: ThumbsUp },
] as const;

const reactionByEmoji = new Map<string, (typeof REACTIONS)[number]>(
  REACTIONS.map((reaction) => [reaction.emoji, reaction])
);

export function ReactionBar() {
  const { sendReaction, joined, connectionState } = useRoom();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        pickerRef.current?.querySelector<HTMLButtonElement>("[aria-expanded]")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onReactionClick = async (emoji: string, label: string) => {
    setSending(emoji);
    setStatus(null);
    try {
      await sendReaction(emoji);
      setStatus(`${label} sent.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Reaction could not be sent.");
    } finally {
      setSending(null);
    }
  };

  const disabled = !joined || connectionState !== "connected" || sending !== null;

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:border-accent hover:bg-sage-soft"
        aria-label="Send a reaction"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Sparkles size={17} strokeWidth={1.8} aria-hidden />
        <span className="hidden sm:inline">React</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-[min(14rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-2 shadow-[0_16px_40px_rgba(69,55,38,0.16)]"
          role="dialog"
          aria-label="Reactions"
        >
          {REACTIONS.map(({ emoji, label, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => void onReactionClick(emoji, label)}
              disabled={disabled}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-transparent bg-background text-xl transition hover:border-accent hover:bg-sage-soft disabled:opacity-40"
              aria-label={`React: ${label}`}
              title={label}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden />
            </button>
          ))}
          <p className="col-span-2 min-h-5 px-1 text-center text-[11px] text-muted" aria-live="polite">
            {status ?? "Choose a reaction"}
          </p>
        </div>
      )}
    </div>
  );
}

export function ReactionOverlay() {
  const { reactions } = useRoom();

  return (
    <div
      className="pointer-events-none flex min-h-9 w-full flex-wrap justify-end gap-1.5 overflow-hidden py-1"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
      aria-label="Recent reactions"
    >
      {reactions.slice(-4).map((reaction) => {
        const item = reactionByEmoji.get(reaction.emoji);
        const Icon: LucideIcon = item?.Icon ?? Sparkles;
        return (
          <div
            key={reaction.id}
            className="flex min-w-0 max-w-[min(12rem,100%)] items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground shadow-sm"
          >
            <Icon size={15} strokeWidth={1.8} aria-hidden />
            <span className="max-w-20 truncate">{reaction.displayName}</span>
            <span className="sr-only">reacted {item?.label ?? ""}</span>
          </div>
        );
      })}
    </div>
  );
}
