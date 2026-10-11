import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  glass?: boolean;
};

export function Card({ className, glass = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-none p-5", glass ? "glass-panel" : "bg-transparent", className)}
      {...props}
    >
      {children}
    </div>
  );
}
