import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "default" | "hero";
};

const sizes = {
  sm: { px: 30, text: "text-3xl" },
  md: { px: 36, text: "text-4xl" },
  lg: { px: 48, text: "text-5xl" },
};

export function Logo({ className, size = "md", showText = true, variant = "default" }: LogoProps) {
  const dimensions = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width={dimensions.px} height={dimensions.px} viewBox="0 0 40 40" fill="none" className="shrink-0 text-accent" aria-hidden="true">
        <path d="M6 32V19a14 14 0 0 1 28 0v13H6Z" fill="currentColor" opacity=".16" />
        <path d="M8 28V19a12 12 0 0 1 24 0v9M5 32c5-5 10-5 15 0 5-5 10-5 15 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m17 15 9 5-9 5V15Z" fill="currentColor" />
      </svg>
      {showText && <span className={cn("font-brutal leading-none text-foreground", dimensions.text)}>Cove<span className="text-terracotta">.</span></span>}
      {variant === "hero" && <span className="sr-only">Watch together</span>}
    </div>
  );
}
