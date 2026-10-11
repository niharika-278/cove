"use client";

import { Navbar } from "./navbar";
import { HeroSection } from "./hero-section";
import { Footer } from "./footer";

export function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <a href="#hero-heading" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-sage-soft focus:px-4 focus:py-2 focus:text-foreground">
        Skip to content
      </a>
      <Navbar />
      <main><HeroSection /></main>
      <Footer />
    </div>
  );
}
