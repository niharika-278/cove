"use client";

import { getAvatarColor, getInitials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type AvatarProps = {
  seed: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-sm",
};

export function Avatar({ seed, name, size = "md", className }: AvatarProps) {
  const color = getAvatarColor(seed);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-mono font-bold text-white",
        "border-2 border-surface",
        sizes[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
