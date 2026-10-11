import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type RoomLoaderProps = {
  label?: string;
  steps?: string[];
  className?: string;
};

export function RoomLoader({ label = "Opening your room", className }: RoomLoaderProps) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center px-6", className)}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface px-8 py-12 text-center shadow-[0_24px_70px_rgba(69,55,38,0.1)]" role="status" aria-live="polite">
        <Logo size="md" className="justify-center" />
        <div className="mx-auto my-9 flex h-16 w-16 items-center justify-center rounded-full bg-sage-soft text-2xl text-accent" aria-hidden="true"><span className="animate-pulse-dot">✦</span></div>
        <h1 className="font-brutal text-3xl">{label}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">Making a little space for everyone.<br />We&apos;ll be with you in a moment.</p>
        <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-sage-soft"><div className="h-full w-1/2 animate-pulse-dot rounded-full bg-accent" /></div>
      </div>
    </div>
  );
}
