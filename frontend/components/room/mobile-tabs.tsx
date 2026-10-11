"use client";

type MobileTab = "video" | "chat" | "people";

type MobileTabsProps = {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
  unreadChat?: number;
};

export function MobileTabs({ active, onChange, unreadChat = 0 }: MobileTabsProps) {
  const tabs: { id: MobileTab; label: string; badge?: number }[] = [
    { id: "video", label: "VIDEO" },
    { id: "chat", label: "CHAT", badge: unreadChat },
    { id: "people", label: "PEOPLE" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 shadow-[0_-10px_30px_rgba(69,55,38,0.08)] backdrop-blur-md lg:hidden" aria-label="Room sections">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
             className={`relative flex min-h-14 flex-1 flex-col items-center justify-center border-r border-border py-2 text-xs font-semibold last:border-r-0 ${
              active === tab.id
                 ? "bg-sage-soft text-accent"
                 : "bg-transparent text-muted"
            }`}
          >
            {tab.label}
            {tab.badge && tab.badge > 0 && active !== "chat" ? (
               <span className="absolute right-1/4 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 font-mono text-[9px] font-bold text-white">
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  );
}

export type { MobileTab };
