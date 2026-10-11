"use client";

import { motion } from "framer-motion";
import { SectionWrapper, SectionChild } from "./section-wrapper";
import { Play } from "lucide-react";

export function WatchTogetherSection() {
  return (
    <SectionWrapper className="px-6 py-28 sm:px-8 sm:py-36 lg:py-44">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <SectionChild>
            <p className="landing-section-label flex items-center justify-center gap-2">
              <Play size={12} className="text-white/25" />
              STEP 03
            </p>
          </SectionChild>
          <SectionChild>
            <h2 className="landing-heading mt-4 text-[clamp(2.2rem,5vw,3.5rem)]">
              PLAY. PAUSE. SEEK.
              <br />
              PERFECTLY SYNCED.
            </h2>
          </SectionChild>
          <SectionChild>
            <p className="landing-body mx-auto mt-5 max-w-lg">
              Everyone controls playback. Hit play and everyone plays. Pause and everyone pauses. Seek and everyone seeks. Instantly.
            </p>
          </SectionChild>
        </div>

        <SectionChild>
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="landing-card overflow-hidden p-5 sm:p-8" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                    <Play size={12} className="text-white/50" />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-white/50">NOW PLAYING</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1">
                  <div className="animate-glow-pulse h-1.5 w-1.5 rounded-full bg-foreground" style={{ animationDuration: "2s" }} />
                  <span className="font-mono text-[9px] font-bold text-foreground/70">SYNCED</span>
                </div>
              </div>

              <div className="relative aspect-video overflow-hidden rounded-xl border border-white/[0.06] bg-[#050507]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" fillOpacity="0.5">
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-[3px] bg-white/[0.06]">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: "38%" }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#999] to-[#777]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/30">12:34 / 32:15</span>
                <div className="flex items-center gap-4">
                  {["Alex", "Sam", "Jordan", "Riley"].map((name, i) => {
                    const colors = ["#888", "#aaa", "#666", "#bbb"];
                    return (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                        className="flex items-center gap-1.5"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ backgroundColor: colors[i] }}>
                          {name[0]}
                        </div>
                        <div className="h-[3px] w-3 rounded-full bg-foreground/50" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </SectionChild>

        <SectionChild>
          <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-2">
            {["Synced play/pause", "Synced seeking", "Everyone controls", "Instant updates"].map((t) => (
              <span key={t} className="landing-tag">{t}</span>
            ))}
          </div>
        </SectionChild>
      </div>
    </SectionWrapper>
  );
}
