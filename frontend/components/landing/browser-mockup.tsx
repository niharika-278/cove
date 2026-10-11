"use client";

import { useState } from "react";

const people = [
  { name: "Maya", initials: "M", color: "#c58469", host: true },
  { name: "Theo", initials: "T", color: "#829b82", host: false },
  { name: "Jules", initials: "J", color: "#b89a67", host: false },
];

export function BrowserMockup() {
  const [active, setActive] = useState<"chat" | "people">("chat");

  return (
    <div className="landing-card overflow-hidden p-2 sm:p-3" aria-label="Preview of a Cove watch room">
      <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-sage-soft/45 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden><span className="h-2 w-2 rounded-full bg-terracotta" /><span className="h-2 w-2 rounded-full bg-[#c7ab6d]" /><span className="h-2 w-2 rounded-full bg-accent" /></div>
        <div className="flex-1 rounded-lg bg-surface px-3 py-1.5 text-center text-xs text-muted">cove / room / sunday-film</div>
      </div>
      <div className="mt-2 grid overflow-hidden rounded-xl border border-border bg-sage-soft/25 md:grid-cols-[1fr_190px]">
        <div className="p-3 sm:p-5">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-[#2f423b]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(226,233,223,0.3),transparent_40%),linear-gradient(145deg,#496451,#21312c)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[#f7f2e8]">
              <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xl">▶</span>
              <span className="label text-white/70">synced playback</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-[#192520]/85 px-3 py-2 text-xs text-white/80 backdrop-blur-sm">
              <div className="mb-2 h-1 rounded-full bg-white/20"><div className="h-full w-2/5 rounded-full bg-[#c7d4bd]" /></div>
              <div className="flex justify-between"><span>12:34</span><span>● live · synced</span></div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-2.5">
            <div className="min-w-0"><p className="label text-accent">Now playing</p><p className="truncate text-sm font-semibold">A Sunday kind of feeling</p></div>
            <span className="rounded-full bg-sage-soft px-2.5 py-1 text-xs font-semibold text-accent">01:42:18</span>
          </div>
        </div>
        <aside className="hidden border-l border-border bg-surface/80 md:block">
          <div className="flex border-b border-border p-2">
            {(["people", "chat"] as const).map((tab) => <button key={tab} type="button" onClick={() => setActive(tab)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize ${active === tab ? "bg-sage-soft text-accent" : "text-muted"}`}>{tab}</button>)}
          </div>
          {active === "people" ? <ul className="space-y-2 p-3">{people.map((person) => <li key={person.name} className="flex items-center gap-2 text-xs"><span className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: person.color }}>{person.initials}</span><span className="flex-1">{person.name}</span>{person.host && <span className="text-[9px] font-bold text-accent">HOST</span>}</li>)}</ul> : <div className="space-y-3 p-3 text-xs"><p><strong className="text-accent">Theo</strong><br />this is exactly the vibe</p><p><strong className="text-accent">Jules</strong><br />🍿 ready when you are</p><p><strong className="text-accent">Maya</strong><br />pressing play!</p></div>}
        </aside>
      </div>
      <div className="flex items-center justify-between px-2 pt-3 text-xs text-muted"><span>3 friends here</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> room is live</span></div>
    </div>
  );
}
