"use client";

import { motion } from "framer-motion";
import { SectionWrapper, SectionChild } from "./section-wrapper";
import { Users } from "lucide-react";

const avatars = [
  { name: "ALEX", color: "#888", host: true, delay: 0 },
  { name: "SAM", color: "#aaa", host: false, delay: 0.3 },
  { name: "JORDAN", color: "#666", host: false, delay: 0.6 },
  { name: "RILEY", color: "#bbb", host: false, delay: 0.9 },
];

export function FriendsJoinSection() {
  return (
    <SectionWrapper className="px-6 py-28 sm:px-8 sm:py-36 lg:py-44">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="order-2 lg:order-1">
          <SectionChild>
            <div className="mx-auto max-w-sm lg:max-w-none">
              <div className="landing-card p-5 sm:p-6" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.45), 0 0 80px rgba(255,255,255,0.02)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-brutal text-sm text-white/50">HERE</span>
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[10px] font-bold text-white/35">4/4</span>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {avatars.map((p) => (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: p.delay, duration: 0.5 }}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: p.color }}>
                        {p.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-white/55">{p.name}</span>
                          {p.host && <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[7px] font-black text-black">HOST</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        <motion.span
                          initial={{ opacity: 0, x: 8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: p.delay + 0.2 }}
                          className="font-mono text-[8px] font-semibold text-foreground/60"
                        >
                          JOINED
                        </motion.span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <Users size={12} className="text-white/25" />
                  <span className="font-mono text-[9px] text-white/30">Everyone connected · Ready to watch</span>
                </motion.div>
              </div>
            </div>
          </SectionChild>
        </div>

        <div className="order-1 lg:order-2">
          <SectionChild>
            <p className="landing-section-label flex items-center gap-2">
              <Users size={12} className="text-white/25" />
              STEP 02
            </p>
          </SectionChild>
          <SectionChild>
            <h2 className="landing-heading mt-4 text-[clamp(2.2rem,5vw,3.5rem)]">
              THEY CLICK.
              <br />
              THEY'RE IN.
            </h2>
          </SectionChild>
          <SectionChild>
            <p className="landing-body mt-5 max-w-sm">
              Your friends open the link. No account needed. They pick a name, and they're in the room. As simple as opening a URL.
            </p>
          </SectionChild>
          <SectionChild>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Link-only access", "Pick a name", "Instant connect", "4 people max"].map((t) => (
                <span key={t} className="landing-tag">{t}</span>
              ))}
            </div>
          </SectionChild>
        </div>
      </div>
    </SectionWrapper>
  );
}
