"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { escapeHtml, MAX_CHAT_MESSAGE_LENGTH } from "@cinecouch/shared";
import { useRoom } from "@/lib/room/room-context";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ChatPanelHandle = {
  focusInput: () => void;
};

type ChatPanelProps = {
  onNewMessage?: () => void;
  isActive?: boolean;
};

export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(function ChatPanel(
  { onNewMessage, isActive = true },
  ref
) {
  const { room, sendChat, error } = useRoom();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCount = useRef(0);

  useImperativeHandle(ref, () => ({
    focusInput: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    const count = room?.chatMessages.length ?? 0;
    if (count > prevCount.current) {
      if (isActive) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        onNewMessage?.();
      }
    }
    prevCount.current = count;
  }, [room?.chatMessages.length, isActive, onNewMessage]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    setShowScrollBtn(!atBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendChat(text);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="panel-brutal flex min-h-[320px] flex-1 flex-col lg:min-h-0 lg:h-[calc(100dvh-13rem)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <div><p className="label text-muted">Room notes</p><h2 className="font-brutal mt-1 text-2xl text-foreground">Chat</h2></div>
        <span className="rounded-full bg-sage-soft px-2.5 py-1 text-xs font-semibold text-accent">{room?.chatMessages.length ?? 0}</span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {room?.chatMessages.length === 0 ? (
             <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 text-center">
               <span className="font-brutal text-3xl text-accent/40">✦</span>
               <p className="text-sm font-semibold text-muted">
                 Start the conversation
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {room?.chatMessages.map((msg) => (
                <li
                  key={msg.id}
                   className="rounded-xl border border-border-subtle bg-background px-3 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                     <span className="truncate text-sm font-semibold text-foreground">
                      {msg.senderDisplayName}
                    </span>
                     <time className="shrink-0 text-[10px] font-medium uppercase text-muted-faint">
                      {formatRelativeTime(msg.timestamp)}
                    </time>
                  </div>
                  <p
                     className="mt-1.5 break-words text-sm leading-relaxed text-foreground/95"
                    dangerouslySetInnerHTML={{ __html: escapeHtml(msg.text) }}
                  />
                </li>
              ))}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        {showScrollBtn && (
          <button
            type="button"
            onClick={scrollToBottom}
             className="absolute bottom-3 right-4 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-sage-soft"
          >
            ↓ NEW
          </button>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-border p-3 sm:p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHAT_MESSAGE_LENGTH))}
             placeholder="Say something…"
            aria-label="Chat message"
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
             className=""
          />
          <Button type="submit" size="sm" variant="primary" disabled={!text.trim() || sending}>
            SEND
          </Button>
        </div>
        {error && <p className="mt-2 font-mono text-xs font-bold text-muted">{error}</p>}
      </form>
    </div>
  );
});
