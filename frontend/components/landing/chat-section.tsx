"use client";

import { motion } from "framer-motion";
import { SectionWrapper, SectionChild } from "./section-wrapper";
import { MessageCircle } from "lucide-react";

const chatMessages = [
  { name: "SAM", color: "#aaa", msg: "this scene is insane", time: "2M AGO" },
  { name: "JORDAN", color: "#666", msg: "wait for it...", time: "1M AGO" },
  { name: "ALEX", color: "#888", msg: "the cinematography though", time: "NOW" },
];

const reactions = ["🔥", "😂", "❤️", "👏", "😮", "💀"];

export function ChatSection() {
  return (
    <SectionWrapper className="px-6 py-28 sm:px-8 sm:py-36 lg:py-44">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="order-2 lg:order-1">
          <SectionChild>
            <div className="mx-auto max-w-sm lg:max-w-none">
              <div className="landing-card overflow-hidden" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}>
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={14} className="text-white/30" />
                    <span className="font-brutal text-sm text-white/50">CHAT</span>
                  </div>
                  <span className="rounded-full bg-white/[0.05] px-2 py-0.5 font-mono text-[9px] font-bold text-white/25">3 MSGS</span>
                </div>

                <div className="flex flex-col gap-2 p-4">
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.2, duration: 0.4 }}
                      className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ backgroundColor: msg.color }}>
                            {msg.name[0]}
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-white/55">{msg.name}</span>
                        </div>
                        <span className="font-mono text-[8px] text-white/20">{msg.time}</span>
                      </div>
                      <p className="mt-1.5 pl-7 font-mono text-[11px] text-white/45">{msg.msg}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-4 py-2.5" aria-label="Reactions" role="group">
                  {reactions.map((emoji, i) => {
                    const labels = ["Fire reaction", "Laughing reaction", "Heart reaction", "Clapping reaction", "Surprised reaction", "Skull reaction"];
                    return (
                      <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.2, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        aria-label={labels[i]}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm transition-colors hover:border-white/15 hover:bg-white/[0.06]"
                      >
                        {emoji}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="border-t border-white/[0.06] p-3" aria-hidden>
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <span className="font-mono text-[10px] text-white/20">TYPE MESSAGE</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionChild>
        </div>

        <div className="order-1 lg:order-2">
          <SectionChild>
            <p className="landing-section-label flex items-center gap-2">
              <MessageCircle size={12} className="text-white/25" />
              LIVE CHAT · STEP 04
            </p>
          </SectionChild>
          <SectionChild>
            <h2 className="landing-heading mt-4 text-[clamp(2.2rem,5vw,3.5rem)]">
              TALK.
              <br />
              REACT.
              <br />
              TOGETHER.
            </h2>
          </SectionChild>
          <SectionChild>
            <p className="landing-body mt-5 max-w-sm">
              Chat in real-time while you watch. Send reactions that float across everyone's screen. It feels like sitting on the same couch.
            </p>
          </SectionChild>
          <SectionChild>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Real-time chat", "Floating reactions", "6 reaction emojis", "Timestamps"].map((t) => (
                <span key={t} className="landing-tag">{t}</span>
              ))}
            </div>
          </SectionChild>
        </div>
      </div>
    </SectionWrapper>
  );
}
