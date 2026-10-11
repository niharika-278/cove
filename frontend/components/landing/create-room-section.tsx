"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SectionWrapper, SectionChild } from "./section-wrapper";
import { Link2 } from "lucide-react";

export function CreateRoomSection() {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
   const fullUrl = "cove.app/room/sunday-film";
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!isInView || started) return;
    setStarted(true);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(fullUrl.slice(0, i + 1));
      i++;
      if (i >= fullUrl.length) clearInterval(interval);
    }, 65);
    return () => clearInterval(interval);
  }, [isInView, started, fullUrl]);

  return (
    <SectionWrapper id="create" className="px-6 py-28 sm:px-8 sm:py-36 lg:py-44">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionChild>
            <p className="landing-section-label flex items-center gap-2">
              <Link2 size={12} className="text-white/25" />
              STEP 01
            </p>
          </SectionChild>
          <SectionChild>
            <h2 className="landing-heading mt-4 text-[clamp(2.2rem,5vw,3.5rem)]">
              IT STARTS
              <br />
              WITH A LINK
            </h2>
          </SectionChild>
          <SectionChild>
            <p className="landing-body mt-5 max-w-sm">
              No signup. No login. No waiting. Create a room and you get a link. That's it. Share it with up to three friends.
            </p>
          </SectionChild>
          <SectionChild>
            <div className="mt-6 flex flex-wrap gap-2">
              {["No signup", "No login", "Instant rooms", "Up to 4 people"].map((t) => (
                <span key={t} className="landing-tag">{t}</span>
              ))}
            </div>
          </SectionChild>
        </div>

        <SectionChild>
          <div ref={ref} className="landing-card relative overflow-hidden p-6 sm:p-8" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.45), 0 0 100px rgba(255,255,255,0.02)" }}>
            <div className="landing-glow absolute -right-20 -top-20 h-48 w-48 bg-white/[0.02]" aria-hidden />
            <p className="landing-section-label mb-2">ROOM URL</p>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40" aria-hidden>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <span className="font-mono text-sm font-medium text-white/70">
                {displayed}
                {started && <span className="animate-typing-cursor ml-px text-white/40" aria-hidden>|</span>}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-7 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3">
                <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                <span className="font-mono text-[9px] font-semibold text-foreground/70">ROOM ACTIVE</span>
              </div>
              <span className="font-mono text-[9px] text-white/25">1/4 JOINED</span>
            </div>
          </div>
        </SectionChild>
      </div>
    </SectionWrapper>
  );
}
