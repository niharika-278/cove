"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

type SectionWrapperProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
};

export function SectionWrapper({ children, className = "", id, delay = 0 }: SectionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.7,
        staggerChildren: 0.08,
      },
    },
  };

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function SectionChild({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className={className}>
      {children}
    </motion.div>
  );
}
