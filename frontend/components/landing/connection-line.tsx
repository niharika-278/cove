"use client";

import { motion } from "framer-motion";

export function ConnectionLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <defs>
        <linearGradient id="conn-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {[
        { x1: "0%", y1: "20%", x2: "12%", y2: "22%" },
        { x1: "0%", y1: "65%", x2: "12%", y2: "68%" },
        { x1: "88%", y1: "25%", x2: "100%", y2: "27%" },
        { x1: "88%", y1: "65%", x2: "100%", y2: "67%" },
      ].map((line, i) => (
        <motion.line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="url(#conn-gradient)"
          strokeWidth="1"
          strokeDasharray="4 6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
        >
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
        </motion.line>
      ))}
    </svg>
  );
}
