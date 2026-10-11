"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
   const shortcuts = [
     { key: "?", desc: "Show shortcuts" },
     { key: "L", desc: "Copy room link" },
     { key: "T", desc: "Theater mode" },
     { key: "S", desc: "Open share" },
     { key: "/", desc: "Focus chat" },
     { key: "ESC", desc: "Close modals" },
  ];

  return (
    <Modal open={open} onClose={onClose} labelledBy="shortcuts-heading">
       <div className="p-6">
         <h2 id="shortcuts-heading" className="font-brutal text-3xl">Shortcuts</h2>
        <ul className="mt-6 space-y-3">
          {shortcuts.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-4">
              <span className="font-mono text-sm text-muted">{s.desc}</span>
               <kbd className="rounded-lg border border-border bg-background px-2 py-0.5 font-mono text-xs font-bold">
                {s.key}
              </kbd>
            </li>
          ))}
        </ul>
        <Button variant="ghost" className="mt-6 w-full" onClick={onClose}>
           Done
        </Button>
      </div>
    </Modal>
  );
}

export function useRoomShortcuts(handlers: {
  onShare: () => void;
  onToggleTheater: () => void;
  onFocusChat: () => void;
  onCopyLink: () => void;
}) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [theater, setTheater] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const toggleTheater = useCallback(() => {
    setTheater((t) => {
      const next = !t;
      handlersRef.current.onToggleTheater();
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "?" && !typing) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }

      if (typing) return;

      switch (e.key.toLowerCase()) {
        case "l":
          e.preventDefault();
          handlersRef.current.onCopyLink();
          break;
        case "t":
          e.preventDefault();
          toggleTheater();
          break;
        case "s":
          e.preventDefault();
          handlersRef.current.onShare();
          break;
        case "/":
          e.preventDefault();
          handlersRef.current.onFocusChat();
          break;
        case "escape":
          setShowShortcuts(false);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleTheater]);

  return { showShortcuts, setShowShortcuts, theater, toggleTheater, setTheater };
}
