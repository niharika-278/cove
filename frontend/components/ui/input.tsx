import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border bg-surface px-3 py-2.5 font-mono text-sm font-medium text-foreground",
        "placeholder:text-muted-faint placeholder:text-sm",
        "focus:border-accent focus:outline-none focus:ring-4 focus:ring-sage-soft",
        "transition-colors duration-150",
        className
      )}
      {...props}
    />
  );
});
