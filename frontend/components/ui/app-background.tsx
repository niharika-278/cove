type AppBackgroundProps = {
  children: React.ReactNode;
};

export function AppBackground({ children }: AppBackgroundProps) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_72%_10%,color-mix(in_srgb,var(--cove-sage-soft)_76%,transparent)_0%,transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_42%_at_4%_88%,color-mix(in_srgb,var(--cove-terracotta-soft)_60%,transparent)_0%,transparent_68%)]" />
      </div>
      {children}
    </div>
  );
}
