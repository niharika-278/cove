"use client";

import { Logo } from "@/components/ui/logo";

export function Navbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="absolute left-0 right-0 top-0 z-50 border-b border-border-subtle bg-surface/70 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
        <a href="/" className="transition-opacity hover:opacity-70">
          <Logo size="sm" showText variant="hero" />
        </a>
        <div className="flex items-center gap-6">
          <a
            href="#create"
            className="hidden font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted transition-colors hover:text-foreground sm:inline"
          >
            How it works
          </a>
          <a
            href="/room/create"
            className="landing-btn-primary !gap-2 !px-4 !py-2 !text-[0.7rem]"
          >
            Launch Room
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
}
