"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomTheme } from "@cinecouch/shared";
import { useRoom } from "@/lib/room/room-context";
import {
  ROOM_THEME_OPTIONS,
  ThemePreview,
} from "./theme-options";

export function ThemePicker() {
  const { theme, isHost, connectionState, setTheme } = useRoom();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RoomTheme>(theme);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canEdit = isHost && connectionState === "connected";
  const active = ROOM_THEME_OPTIONS.find((option) => option.id === theme) ?? ROOM_THEME_OPTIONS[0];

  useEffect(() => {
    if (!open) setDraft(theme);
  }, [theme, open]);

  const restoreTriggerFocus = useCallback(() => {
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const closePicker = useCallback(() => {
    setOpen(false);
    setError(null);
    if (dialogRef.current?.open) dialogRef.current.close();
    restoreTriggerFocus();
  }, [restoreTriggerFocus]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => dialog.querySelector<HTMLElement>("[data-theme-option]")?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleApply = async () => {
    if (!canEdit || pending) return;
    setPending(true);
    setError(null);
    try {
      await setTheme(draft);
      closePicker();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn’t update the room mood. Try again.");
    } finally {
      setPending(false);
    }
  };

  const gateMessage = !isHost
    ? "Only the host can change the room mood."
    : "Connect to the room before changing the mood.";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={!canEdit}
        onClick={() => {
          setDraft(theme);
          setError(null);
          setOpen(true);
        }}
        className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:border-accent hover:bg-sage-soft disabled:cursor-not-allowed disabled:opacity-65"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={canEdit ? "Change room mood" : gateMessage}
      >
        <span className="h-4 w-4 rounded-full border border-border bg-accent" aria-hidden="true" />
        <span className="hidden sm:inline">{active.label}</span>
        <span className="sr-only">Room mood</span>
      </button>

      {open && (
        <dialog
          ref={dialogRef}
          aria-labelledby="theme-picker-heading"
          onCancel={(event) => {
            event.preventDefault();
            closePicker();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closePicker();
          }}
          className="fixed inset-0 z-50 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%_-_1rem)] max-w-xl overflow-y-auto rounded-3xl border border-border bg-surface p-0 text-foreground shadow-[0_24px_80px_rgba(69,55,38,0.2)]"
        >
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label text-accent">Room mood</p>
                <h2 id="theme-picker-heading" className="font-brutal mt-2 text-3xl">Set the feeling.</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">Choose a look for everyone in the room. Nothing changes until you apply it.</p>
              </div>
              <button type="button" onClick={closePicker} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-xl text-muted hover:bg-background hover:text-foreground" aria-label="Close room mood picker">×</button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Room moods">
              {ROOM_THEME_OPTIONS.map((option) => {
                const selected = draft === option.id;
                const current = theme === option.id;
                return (
                  <button
                    key={option.id}
                    data-theme-option
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDraft(option.id)}
                    className={`rounded-2xl border p-2.5 text-left transition hover:border-accent ${selected ? "border-accent bg-sage-soft/60 ring-2 ring-accent/20" : "border-border bg-background"}`}
                  >
                    <ThemePreview theme={option.id} />
                    <span className="mt-2 flex items-start justify-between gap-2 px-1">
                      <span><span className="block text-sm font-semibold">{option.label}</span><span className="mt-0.5 block text-xs text-muted">{option.description}</span></span>
                      {current && <span className="shrink-0 rounded-full bg-sage-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">Current</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-4 rounded-xl border border-terracotta/30 bg-terracotta-soft px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
            {!canEdit && <p className="mt-4 text-xs text-muted">{gateMessage}</p>}

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={closePicker} disabled={pending} className="min-h-11 rounded-full px-5 text-sm font-semibold text-muted hover:bg-background hover:text-foreground">Cancel</button>
              <button type="button" onClick={handleApply} disabled={!canEdit || pending} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Applying…" : "Apply mood"}</button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
