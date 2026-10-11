"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRoom } from "@/lib/room/room-context";
import { copyToClipboard, getRoomUrl } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { JoinRoomModal } from "./join-room-modal";
import { RoomHeader } from "./room-header";
import { YouTubePlayerPanel } from "./youtube-player-panel";
import { ParticipantList } from "./participant-list";
import { ChatPanel, type ChatPanelHandle } from "./chat-panel";
import { ConnectionBanner } from "./connection-banner";
import { ShareModal } from "./share-modal";
import { ReactionOverlay } from "./reaction-bar";
import { ShortcutsModal, useRoomShortcuts } from "./room-shortcuts";
import { MobileTabs, type MobileTab } from "./mobile-tabs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { RoomLoader } from "@/components/ui/room-loader";
import Link from "next/link";

export function RoomShell() {
  const { loading, joined, joining, join, roomError, error, roomId, isRoomCreator, theme } = useRoom();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("video");
  const [unreadChat, setUnreadChat] = useState(0);
  const chatRef = useRef<ChatPanelHandle>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
  }, []);

  const copyLink = useCallback(async () => {
    const ok = await copyToClipboard(getRoomUrl(roomId));
    if (ok) toast("LINK COPIED", "success");
  }, [roomId, toast]);

  const { showShortcuts, setShowShortcuts, theater, toggleTheater } = useRoomShortcuts({
    onShare: () => setShareOpen(true),
    onToggleTheater: () => {},
    onFocusChat: () => {
      setMobileTab("chat");
      setUnreadChat(0);
       if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
       focusTimerRef.current = setTimeout(() => {
         chatRef.current?.focusInput();
         focusTimerRef.current = null;
       }, 50);
    },
    onCopyLink: copyLink,
  });

  const handleMobileTab = (tab: MobileTab) => {
    setMobileTab(tab);
    if (tab === "chat") setUnreadChat(0);
  };

  if (loading) return <div data-theme={theme}><RoomLoader label="Opening your room" /></div>;

  if (roomError?.code === "ROOM_NOT_FOUND" || roomError?.code === "ROOM_EXPIRED") {
    return (
      <div data-theme={theme} className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="panel-brutal max-w-sm p-8 text-center">
          <Logo size="md" className="mx-auto mb-6 justify-center" />
          <h1 className="font-brutal text-4xl">
            {roomError.code === "ROOM_EXPIRED" ? "EXPIRED" : "NOT FOUND"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">{roomError.message}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/room/create">
              <Button size="md">CREATE ROOM</Button>
            </Link>
            <Link href="/">
              <Button size="md" variant="secondary">
                HOME
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (roomError?.code === "ROOM_FULL" && !joined) {
    return (
      <div data-theme={theme} className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="panel-brutal max-w-sm p-8 text-center">
          <Logo size="md" className="mx-auto mb-6 justify-center" />
          <h1 className="font-brutal text-4xl">FULL</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
             This room is cozy and already has four people in it.
          </p>
          <Link href="/" className="mt-8 inline-block">
            <Button size="md" variant="secondary">
              BACK HOME
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div data-theme={theme} className={`flex min-h-screen flex-col bg-background text-foreground ${theater ? "!bg-[#202726]" : ""}`}>
      <RoomHeader
        onShare={() => setShareOpen(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
        theater={theater}
        onToggleTheater={toggleTheater}
      />
      <ConnectionBanner />
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-2"><ReactionOverlay /></div>

      <main
        className={`mx-auto flex w-full flex-1 flex-col gap-0 p-0 lg:flex-row ${
          theater ? "max-w-none" : "max-w-[1600px]"
        } pb-20 lg:pb-0 lg:min-h-0`}
      >
        <section
          className={`min-w-0 flex-1 lg:overflow-hidden ${
            mobileTab !== "video" ? "hidden lg:block" : ""
          }`}
        >
          <div className="h-full border-b border-border p-3 sm:p-4 lg:border-b-0 lg:border-r">
            <YouTubePlayerPanel theater={theater} />
          </div>
        </section>

        {!theater && (
          <aside
            className={`flex w-full flex-col lg:w-[min(420px,38vw)] lg:min-w-[360px] lg:max-w-[440px] ${
              mobileTab === "video" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div
              className={`shrink-0 border-b border-border p-3 sm:p-4 ${
                mobileTab === "chat" ? "hidden lg:block" : ""
              }`}
            >
              <ParticipantList />
            </div>

            <div
              className={`min-h-0 flex-1 p-3 sm:p-4 ${
                mobileTab === "people" ? "hidden lg:block" : "flex flex-col"
              } ${mobileTab === "chat" ? "h-[calc(100dvh-8rem)] lg:h-auto" : ""}`}
            >
              <ChatPanel
                ref={chatRef}
                isActive={mobileTab === "chat" || mobileTab === "video"}
                onNewMessage={() => setUnreadChat((n) => n + 1)}
              />
            </div>
          </aside>
        )}
      </main>

      {!theater && (
        <MobileTabs active={mobileTab} onChange={handleMobileTab} unreadChat={unreadChat} />
      )}

      <JoinRoomModal
        open={!joined && roomError?.code !== "ROOM_FULL"}
        onJoin={join}
        error={roomError?.message ?? error}
        loading={joining}
        mode={isRoomCreator ? "create" : "join"}
      />

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
