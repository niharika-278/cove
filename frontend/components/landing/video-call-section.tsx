"use client";

import { motion } from "framer-motion";
import { SectionWrapper, SectionChild } from "./section-wrapper";
import { Video } from "lucide-react";

const webcamTiles = [
  { name: "ALEX", color: "#888", live: true },
  { name: "SAM", color: "#aaa", live: true },
  { name: "JORDAN", color: "#666", live: true },
  { name: "RILEY", color: "#bbb", live: false },
];

export function VideoCallSection() {
  return (
    <SectionWrapper className="px-6 py-28 sm:px-8 sm:py-36 lg:py-44">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionChild>
            <p className="landing-section-label flex items-center gap-2">
              <Video size={12} className="text-white/25" />
              VIDEO · STEP 05
            </p>
          </SectionChild>
          <SectionChild>
            <h2 className="landing-heading mt-4 text-[clamp(2.2rem,5vw,3.5rem)]">
              SEE EACH
              <br />
              OTHER.
            </h2>
          </SectionChild>
          <SectionChild>
            <p className="landing-body mt-5 max-w-sm">
              Peer-to-peer WebRTC video calling. See your friends, hear their reactions. Camera off? Your avatar still shows.
            </p>
          </SectionChild>
          <SectionChild>
            <div className="mt-6 flex flex-wrap gap-2">
              {["WebRTC P2P", "Camera toggle", "Mute control", "Avatar fallback"].map((t) => (
                <span key={t} className="landing-tag">{t}</span>
              ))}
            </div>
          </SectionChild>
        </div>

        <SectionChild>
          <div className="mx-auto max-w-sm lg:max-w-none">
            <div className="landing-card overflow-hidden p-5 sm:p-6" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                <span className="font-brutal text-sm text-white/50">WEBCAMS</span>
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 font-mono text-[9px] font-bold text-white/25">4/4</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {webcamTiles.map((tile, i) => (
                  <motion.div
                    key={tile.name}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 250, damping: 20 }}
                    className="relative aspect-video overflow-hidden rounded-xl border border-white/[0.06] bg-[#08080a]"
                  >
                    {tile.live ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/30 to-black/60" />
                    ) : (
                      <div className="absolute inset-0 bg-[#060608]" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ backgroundColor: tile.color }}>
                        {tile.name[0]}
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
                      <span className="rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-[7px] font-semibold text-white/45 backdrop-blur-sm">{tile.name}</span>
                      {tile.live ? (
                        <div className="flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
                          <div className="animate-glow-pulse h-1 w-1 rounded-full bg-foreground" style={{ animationDuration: "2.5s" }} />
                          <span className="font-mono text-[7px] font-semibold text-foreground/60">LIVE</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
                          <Video size={7} className="text-white/25" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-3 border-t border-white/[0.06] pt-3" aria-hidden>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]" aria-label="Camera toggle">
                  <Video size={11} className="text-white/35" />
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]" aria-label="Microphone toggle">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/35">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]" aria-label="Screen share">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/35">
                    <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
                    <path d="M13 3h8v8" />
                    <path d="M21 3 9 15" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </SectionChild>
      </div>
    </SectionWrapper>
  );
}
