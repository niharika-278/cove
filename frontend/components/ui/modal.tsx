"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
};

export function Modal({ open, onClose, children, className, labelledBy }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      className={cn(
        "fixed inset-0 z-50 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-3xl border border-border p-0 text-foreground shadow-[0_24px_80px_rgba(69,55,38,0.18)]",
        "glass-panel",
        className
      )}
    >
      {children}
    </dialog>
  );
}
