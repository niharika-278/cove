"use client";

import { motion } from "framer-motion";

const participants = [
  { name: "ALEX", color: "#888", x: "-15%", y: "12%", phase: 0 },
  { name: "SAM", color: "#aaa", x: "-18%", y: "58%", phase: 1.2 },
  { name: "JORDAN", color: "#666", x: "108%", y: "18%", phase: 0.6 },
  { name: "RILEY", color: "#bbb", x: "110%", y: "60%", phase: 1.8 },
];

export function MockupParticipants() {
  return (
    <>
      {participants.map((p, i) => (
        <div
          key={p.name}
          className="absolute hidden lg:block"
          style={{ left: p.x, top: p.y }}
        >
          <motion.div
            initial={{ opacity: 0, x: i < 2 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.15, duration: 0.6 }}
            className="animate-float-y"
            style={{ animationDelay: `${p.phase}s`, animationDuration: "3.5s" }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0e0e10]/80 px-3 py-2 backdrop-blur-xl" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: p.color }}>
                {p.name[0]}
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] font-semibold text-white/60">{p.name}</span>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-foreground" />
                  <span className="font-mono text-[7px] text-foreground/70">CONNECTED</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </>
  );
}
