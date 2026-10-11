"use client";

import { useState } from "react";
import { useRoom } from "@/lib/room/room-context";
import { copyToClipboard, getRoomUrl } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

type ShareModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ShareModal({ open, onClose }: ShareModalProps) {
  const { roomId } = useRoom();
  const { toast } = useToast();
  const url = getRoomUrl(roomId);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) toast("LINK COPIED", "success");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Cove room", url });
        return;
      } catch {
        // cancelled
      }
    }
    handleCopy();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="share-heading">
       <div className="p-6">
         <h2 id="share-heading" className="font-brutal text-3xl">Bring your people</h2>
         <p className="mt-2 text-sm leading-relaxed text-muted">Send this link to invite up to three friends into your room.</p>

        <div className="mt-6">
           <label className="label mb-2 block text-muted-faint">Room link</label>
          <Input value={url} readOnly onFocus={(e) => e.target.select()} />
        </div>

         <p className="mt-3 text-xs text-muted-faint">Room ID: {roomId}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={handleCopy}>
             Copy link
          </Button>
          <Button variant="secondary" className="flex-1" onClick={handleNativeShare}>
             Share
          </Button>
        </div>

        <Button variant="ghost" className="mt-3 w-full" onClick={onClose}>
           Done
        </Button>
      </div>
    </Modal>
  );
}

export function useShareModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    show: () => setOpen(true),
    close: () => setOpen(false),
    ShareModal: (props: Omit<ShareModalProps, "open" | "onClose">) => (
      <ShareModal open={open} onClose={() => setOpen(false)} {...props} />
    ),
  };
}
