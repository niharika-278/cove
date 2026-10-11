"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SectionWrapper, SectionChild } from "./section-wrapper";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/room/create");
  }, [router]);

  return (
    <SectionWrapper id="cta" className="px-6 py-28 sm:px-8 sm:py-36 lg:py-44">
      <div className="mx-auto max-w-3xl text-center">
        <SectionChild>
          <div className="landing-glow animate-glow-pulse absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 bg-white/[0.012] opacity-60" aria-hidden />
        </SectionChild>

        <SectionChild>
          <h2 className="landing-heading text-[clamp(2.5rem,6vw,4.5rem)]">
            YOUR SCREENING
            <br />
            ROOM AWAITS
          </h2>
        </SectionChild>

        <SectionChild>
          <p className="landing-body mx-auto mt-5 max-w-md">
            No signup, no login, no tracking. Just a link and a room. Create one now and invite your friends.
          </p>
        </SectionChild>

        <SectionChild>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="landing-btn-primary"
              onClick={() => router.push("/room/create")}
              aria-label="Create a new room"
            >
              CREATE ROOM
              <ArrowRight size={14} className="opacity-40" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="landing-btn-ghost"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Join an existing room — scroll to top"
            >
              JOIN ROOM
            </motion.button>
          </div>
        </SectionChild>

        <SectionChild>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-white/[0.06] pt-8">
            {["No signup", "Ephemeral", "P2P video", "4 max"].map((t) => (
              <span key={t} className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/25">{t}</span>
            ))}
          </div>
        </SectionChild>
      </div>
    </SectionWrapper>
  );
}
