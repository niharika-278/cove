import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-accent text-on-accent border border-accent hover:bg-accent-hover shadow-[0_8px_20px_rgba(76,98,78,0.16)]",
  secondary: "bg-surface text-foreground border border-border hover:border-accent hover:bg-sage-soft",
  ghost: "text-muted hover:text-foreground hover:bg-sage-soft border border-transparent",
  danger: "text-danger border border-terracotta/40 bg-terracotta-soft hover:bg-terracotta-soft/70",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2 text-sm",
  lg: "px-8 py-3 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-mono font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
