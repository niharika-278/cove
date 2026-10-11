"use client";

import { motion } from "framer-motion";
import { SectionWrapper, SectionChild } from "./section-wrapper";
import { Shield } from "lucide-react";

const facts = [
  { label: "No signup", desc: "Accounts don't exist. There's nothing to hack." },
  { label: "Ephemeral rooms", desc: "Rooms live in memory. Gone when you leave." },
  { label: "Link-only access", desc: "No link? No entry. That's the only gate." },
  { label: "P2P video", desc: "WebRTC connects you directly. No middleman server." },
];

export function PrivacySection() {
  return (
    <SectionWrapper className="px-6 py-28 sm:px-8 sm:py-36 lg:py-44">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <SectionChild>
            <p className="landing-section-label flex items-center justify-center gap-2">
              <Shield size={12} className="text-white/25" />
              ARCHITECTURE
            </p>
          </SectionChild>
          <SectionChild>
            <h2 className="landing-heading mt-4 text-[clamp(2.2rem,5vw,3.5rem)]">
              DESIGNED
              <br />
              TO FORGET
            </h2>
          </SectionChild>
          <SectionChild>
            <p className="landing-body mx-auto mt-5 max-w-lg">
              Cove doesn't want your data. No accounts to breach, no passwords to leak, no profiles to scrape. When you leave, the room is gone.
            </p>
          </SectionChild>
        </div>

        <SectionChild>
          <div className="landing-grid-bg mx-auto mt-16 max-w-3xl">
            <div className="landing-card relative overflow-hidden p-8 sm:p-10" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.45), 0 0 120px rgba(255,255,255,0.02)" }}>
              <div className="landing-glow absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-white/[0.03]" aria-hidden />

              <div className="relative mx-auto flex max-w-xs flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.15] bg-white/[0.06]">
                  <Shield size={20} className="text-foreground" />
                </div>
                <span className="mt-2 font-mono text-[9px] font-bold text-foreground/60">RELAY NODE</span>

                <div className="mt-6 flex items-center gap-6">
                  {["Alex", "Sam", "Jordan", "Riley"].map((name, i) => {
                    const colors = ["#888", "#aaa", "#666", "#bbb"];
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 250, damping: 18 }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: colors[i] }}
                          aria-label={name}
                        >
                          {name[0]}
                        </motion.div>
                        <div className="h-4 w-px bg-gradient-to-b from-foreground/30 to-transparent" aria-hidden />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative mt-10 grid gap-3 sm:grid-cols-2">
                {facts.map((fact, i) => (
                  <motion.div
                    key={fact.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-foreground" />
                      <span className="font-brutal text-[11px] text-foreground/80">{fact.label}</span>
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-white/35">{fact.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </SectionChild>
      </div>
    </SectionWrapper>
  );
}
