"use client";

import { useState } from "react";
import { MAX_DISPLAY_NAME_LENGTH } from "@cinecouch/shared";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

type JoinRoomModalProps = {
  open: boolean;
  onJoin: (displayName: string) => Promise<void>;
  error?: string | null;
  loading?: boolean;
  mode?: "create" | "join";
};

export function JoinRoomModal({
  open,
  onJoin,
  error,
  loading,
  mode = "join",
}: JoinRoomModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    try {
      await onJoin(name.trim());
    } catch {
      // The room context exposes the join error for the inline message below.
    }
  };

  const previewSeed = name.trim().toLowerCase().replace(/\s+/g, "-") || "guest";

  return (
    <Modal open={open} labelledBy="join-heading">
      <div className="p-8">
        <div className="mb-7 border-b border-border pb-7 text-center">
          <Logo size="sm" className="mx-auto mb-6 justify-center" />
          <h2 id="join-heading" className="font-brutal text-4xl">{mode === "create" ? "Your room is ready." : "There’s a seat for you."}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {mode === "create"
              ? "Pick a name, settle in, and invite your people."
              : "What should your friends call you?"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
          <div className="rounded-full border border-border bg-sage-soft p-3">
            <Avatar seed={previewSeed} name={name || "Guest"} size="lg" />
          </div>

          <div className="w-full">
            <label htmlFor="displayName" className="label mb-2 block text-muted">
              Your name
            </label>
            <Input
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_DISPLAY_NAME_LENGTH))}
              placeholder="e.g. Maya"
              autoFocus
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              autoComplete="nickname"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "join-error" : undefined}
            />
          </div>

          {error && (
            <p
              id="join-error"
              className="w-full rounded-xl border border-terracotta/30 bg-terracotta-soft px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={!name.trim() || loading}>
            {loading ? "Coming in…" : mode === "create" ? "Enter your room" : "Join the room"}
          </Button>
          <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">Back to Cove</Link>
        </form>
      </div>
    </Modal>
  );
}
