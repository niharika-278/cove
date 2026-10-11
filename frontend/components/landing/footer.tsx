import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-6">
          <Logo size="sm" showText={false} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
            A quiet place to watch together
          </span>
        </div>
        <p className="font-mono text-[10px] text-muted">
          © {new Date().getFullYear()} Cove
        </p>
      </div>
    </footer>
  );
}
