"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  REACTION_EMOJIS,
  type PublicRoom,
  type RoomError,
  type RoomTheme,
} from "@cinecouch/shared";
import { fetchRoom } from "@/lib/api/rooms";
import {
  clearRoomSession,
  clearRoomCreatorToken,
  getRoomCreatorToken,
  getRoomInitialTheme,
  getRoomSession,
  clearRoomInitialTheme,
  setRoomSession,
} from "@/lib/room/session";
import {
  disconnectSocket,
  getConnectionState,
  getSocket,
  type ConnectionState,
} from "@/lib/socket/client";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "next/navigation";

export type FloatingReaction = {
  id: string;
  emoji: string;
  displayName: string;
};

export const ROOM_THEMES = [
  { id: "cozy-cabin", label: "Cozy cabin", description: "Warm ivory and sage" },
  { id: "rainy-evening", label: "Rainy evening", description: "Soft blue-green calm" },
  { id: "midnight-cinema", label: "Midnight cinema", description: "Low light, big screen" },
  { id: "sunday-morning", label: "Sunday morning", description: "Golden and unhurried" },
] as const;

const SOCKET_ACK_TIMEOUT_MS = 1500;

type SocketActionResponse = {
  ok: boolean;
  error?: { code: string; message: string };
  room?: PublicRoom;
};

type RoomWithTheme = PublicRoom & { theme?: RoomTheme };

function normalizeTheme(value: unknown): RoomTheme {
  return ROOM_THEMES.some((theme) => theme.id === value) ? (value as RoomTheme) : "cozy-cabin";
}

type RoomContextValue = {
  roomId: string;
  room: PublicRoom | null;
  participantId: string | null;
  joined: boolean;
  joining: boolean;
  loading: boolean;
  error: string | null;
  roomError: RoomError | null;
  connectionState: ConnectionState;
  reactions: FloatingReaction[];
  isHost: boolean;
  theme: RoomTheme;
  join: (displayName: string) => Promise<void>;
  isRoomCreator: boolean;
  leaveRoom: () => void;
  setVideo: (url: string) => Promise<void>;
  play: (positionSeconds: number) => void;
  pause: (positionSeconds: number) => void;
  seek: (positionSeconds: number) => void;
  sendChat: (text: string) => Promise<void>;
  sendReaction: (emoji: string) => Promise<void>;
  setTheme: (theme: RoomTheme) => Promise<void>;
};

const RoomContext = createContext<RoomContextValue | null>(null);

type RoomProviderProps = {
  roomId: string;
  children: ReactNode;
};

export function RoomProvider({ roomId, children }: RoomProviderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<RoomError | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const reactionTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const reactionGenerationRef = useRef(0);
  const reactionSequenceRef = useRef(0);
  const sessionTokenRef = useRef<string | null>(null);
  const participantIdRef = useRef<string | null>(null);
  const reconnectInFlightRef = useRef(false);
  const restoredConnectionIdRef = useRef<string | null>(null);
  const socket = useMemo(() => getSocket(), []);

  const clearReactionTimers = useCallback(() => {
    reactionGenerationRef.current += 1;
    reactionTimersRef.current.forEach((timer) => clearTimeout(timer));
    reactionTimersRef.current.clear();
    setReactions([]);
  }, []);

  const restoreRoomMembership = useCallback(() => {
    if (!socket.connected || reconnectInFlightRef.current) return;

    const session = getRoomSession(roomId);
    const connectionId = socket.id;
    if (!session?.sessionToken || !connectionId || restoredConnectionIdRef.current === connectionId) {
      return;
    }

    reconnectInFlightRef.current = true;
    restoredConnectionIdRef.current = connectionId;

    socket.emit(
      "room:reconnect",
      { roomId, sessionToken: session.sessionToken },
      (response: {
        ok: boolean;
        error?: RoomError;
        participantId?: string;
        room?: PublicRoom;
      }) => {
        if (socket.id !== connectionId) return;
        reconnectInFlightRef.current = false;

        if (response.ok && response.room && response.participantId) {
          sessionTokenRef.current = session.sessionToken;
          setParticipantId(response.participantId);
          setRoom(response.room);
          setJoined(true);
          return;
        }

        restoredConnectionIdRef.current = null;
        if (response.error?.code === "UNAUTHORIZED") {
          clearRoomSession(roomId);
          sessionTokenRef.current = null;
          setParticipantId(null);
          setJoined(false);
          setRoomError(response.error);
        }
      }
    );
  }, [roomId, socket]);

  useEffect(() => {
    participantIdRef.current = participantId;
  }, [participantId]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      try {
        const existing = await fetchRoom(roomId);
        if (!mounted) return;

        if (!existing) {
          setRoomError({
            code: "ROOM_NOT_FOUND",
            message: "This room does not exist or has expired.",
          });
          setLoading(false);
          return;
        }

        setRoom(existing);

        const session = getRoomSession(roomId);
        if (session) {
          sessionTokenRef.current = session.sessionToken;
          setParticipantId(session.participantId);
        }

        setIsRoomCreator(!!getRoomCreatorToken(roomId));
      } catch {
        if (mounted) setError("Failed to load room");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  useEffect(() => {
    const onConnect = () => {
      setConnectionState("connected");
      if (joined) restoreRoomMembership();
    };
    const onDisconnect = () => {
      reconnectInFlightRef.current = false;
      restoredConnectionIdRef.current = null;
      clearReactionTimers();
      setConnectionState("disconnected");
    };
    const onReconnectAttempt = () => setConnectionState("reconnecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    if (!socket.connected) {
      setConnectionState("connecting");
      socket.connect();
    } else {
      setConnectionState("connected");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, [clearReactionTimers, joined, restoreRoomMembership, socket]);

  useEffect(() => {
    const onState = (state: PublicRoom) => setRoom(state);
    const onPlaybackUpdated = ({ room: updated }: { room: PublicRoom }) => setRoom(updated);
    const onVideoChanged = ({ room: updated }: { room: PublicRoom }) => {
      setRoom(updated);
      toast("NEW VIDEO LOADED", "info");
    };
    const onParticipantJoined = ({
      participant,
      room: updated,
    }: {
      participant?: { participantId: string; displayName: string };
      room: PublicRoom;
    }) => {
      setRoom(updated);
      if (participant && participant.participantId !== participantIdRef.current) {
        toast(`${participant.displayName.toUpperCase()} JOINED`, "info");
      }
    };
    const onParticipantLeft = ({
      participantId: leftId,
      displayName,
      room: updated,
    }: {
      participantId: string;
      displayName?: string;
      room: PublicRoom;
    }) => {
      setRoom(updated);
      if (leftId !== participantIdRef.current) {
        toast(`${(displayName ?? "SOMEONE").toUpperCase()} LEFT`, "info");
      }
    };
    const onHostChanged = ({
      hostParticipantId,
      room: updated,
    }: {
      hostParticipantId: string | null;
      room: PublicRoom;
    }) => {
      setRoom(updated);
      const newHost = updated.participants.find((p) => p.participantId === hostParticipantId);
      if (newHost) {
        toast(`${newHost.displayName.toUpperCase()} IS NOW HOST`, "info");
      }
    };
    const onChatMessage = ({ room: updated }: { room: PublicRoom }) => setRoom(updated);
    const onReaction = ({
      emoji,
      displayName,
      participantId,
      timestamp,
    }: {
      emoji: string;
      displayName: string;
      participantId: string;
      timestamp: number;
    }) => {
      const validEmoji = REACTION_EMOJIS.includes(
        emoji as (typeof REACTION_EMOJIS)[number]
      );
      const now = Date.now();
      if (
        typeof emoji !== "string" ||
        typeof participantId !== "string" ||
        typeof displayName !== "string" ||
        !validEmoji ||
        !participantId.trim() ||
        !displayName.trim() ||
        !Number.isFinite(timestamp) ||
        timestamp < now - 60_000 ||
        timestamp > now + 5_000
      ) {
        return;
      }

      const id = `${participantId}-${timestamp}-${reactionSequenceRef.current++}`;
      const generation = reactionGenerationRef.current;
      setReactions((prev) => [...prev.slice(-8), { id, emoji, displayName }]);
      let timer: ReturnType<typeof setTimeout>;
      timer = setTimeout(() => {
        if (
          reactionGenerationRef.current !== generation ||
          reactionTimersRef.current.get(id) !== timer
        ) {
          return;
        }
        setReactions((prev) => prev.filter((r) => r.id !== id));
        reactionTimersRef.current.delete(id);
      }, 2000);
      reactionTimersRef.current.set(id, timer);
    };
    const onThemeUpdated = ({ room: updated, theme }: { room?: RoomWithTheme; theme?: unknown }) => {
      if (updated) {
        setRoom(updated);
      } else if (theme) {
        setRoom((current) => (current ? ({ ...current, theme: normalizeTheme(theme) } as RoomWithTheme) : current));
      }
    };
    const onRoomError = (err: RoomError) => {
      setRoomError(err);
      toast(err.message.toUpperCase(), "error");
    };
    const onRoomExpired = (err: RoomError) => {
      clearReactionTimers();
      setRoomError(err);
      clearRoomSession(roomId);
      toast("ROOM EXPIRED", "error");
    };

    socket.on("room:state", onState);
    socket.on("playback:updated", onPlaybackUpdated);
    socket.on("playback:video-changed", onVideoChanged);
    socket.on("room:participant-joined", onParticipantJoined);
    socket.on("room:participant-left", onParticipantLeft);
    socket.on("room:host-changed", onHostChanged);
    socket.on("chat:message", onChatMessage);
    socket.on("reaction:received", onReaction);
    socket.on("room:theme-updated", onThemeUpdated);
    socket.on("room:error", onRoomError);
    socket.on("room:expired", onRoomExpired);

    return () => {
      socket.off("room:state", onState);
      socket.off("playback:updated", onPlaybackUpdated);
      socket.off("playback:video-changed", onVideoChanged);
      socket.off("room:participant-joined", onParticipantJoined);
      socket.off("room:participant-left", onParticipantLeft);
      socket.off("room:host-changed", onHostChanged);
      socket.off("chat:message", onChatMessage);
      socket.off("reaction:received", onReaction);
      socket.off("room:theme-updated", onThemeUpdated);
      socket.off("room:error", onRoomError);
      socket.off("room:expired", onRoomExpired);
      clearReactionTimers();
    };
  }, [clearReactionTimers, roomId, socket, toast]);

  useEffect(() => {
    if (loading || roomError || joined || connectionState !== "connected") return;
    restoreRoomMembership();
  }, [connectionState, joined, loading, restoreRoomMembership, roomError]);

  const join = useCallback(
    async (displayName: string) => {
      setJoining(true);
      setError(null);
      setRoomError(null);

      const session = getRoomSession(roomId);
      const creatorToken = getRoomCreatorToken(roomId) ?? undefined;

      return new Promise<void>((resolve, reject) => {
        socket.emit(
          "room:join",
          {
            roomId,
            displayName,
            sessionToken: session?.sessionToken,
            creatorToken,
          },
          async (response: {
            ok: boolean;
            error?: RoomError;
            sessionToken?: string;
            participantId?: string;
            room?: PublicRoom;
          }) => {
            if (!response.ok || !response.room || !response.sessionToken || !response.participantId) {
              setJoining(false);
              const msg = response.error?.message ?? "Failed to join room";
              setRoomError(response.error ?? { code: "INVALID_PAYLOAD", message: msg });
              setError(msg);
              reject(new Error(msg));
              return;
            }

            sessionTokenRef.current = response.sessionToken;
            setRoomSession(roomId, {
              sessionToken: response.sessionToken,
              participantId: response.participantId,
              displayName,
            });

            let joinedRoom = response.room;
            const initialTheme = getRoomInitialTheme(roomId);
            if (
              initialTheme &&
              response.room.hostParticipantId === response.participantId
            ) {
              let themeApplied = false;
              try {
                const themeResponse = await new Promise<{
                  ok: boolean;
                  error?: { code: string; message: string };
                  room?: PublicRoom;
                }>((resolve) => {
                  let settled = false;
                  const timeout = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    resolve({
                      ok: false,
                      error: { code: "TIMEOUT", message: "Theme update timed out." },
                    });
                  }, SOCKET_ACK_TIMEOUT_MS);

                  socket.emit(
                    "room:set-theme",
                    { roomId, theme: initialTheme },
                    (result: {
                      ok: boolean;
                      error?: { code: string; message: string };
                      room?: PublicRoom;
                    }) => {
                      if (settled) return;
                      settled = true;
                      clearTimeout(timeout);
                      resolve(result);
                    }
                  );
                });

                if (themeResponse.ok && themeResponse.room) {
                  joinedRoom = themeResponse.room;
                  themeApplied = true;
                }
              } catch {
                // Keep the successful room join usable if the optional initial theme fails.
              } finally {
                clearRoomInitialTheme(roomId);
              }
              if (!themeApplied) toast("ROOM OPENED; THEME COULD NOT BE SAVED", "info");
            }

            setParticipantId(response.participantId);
            setRoom(joinedRoom);
            setJoined(true);
            clearRoomCreatorToken(roomId);
            setIsRoomCreator(false);
            setJoining(false);
            toast("YOU JOINED THE ROOM", "success");
            resolve();
          }
        );
      });
    },
    [roomId, socket, toast]
  );

  const leaveRoom = useCallback(() => {
    if (joined) socket.emit("room:leave", { roomId });
    clearReactionTimers();
    reconnectInFlightRef.current = false;
    restoredConnectionIdRef.current = null;
    clearRoomSession(roomId);
    clearRoomCreatorToken(roomId);
    clearRoomInitialTheme(roomId);
    disconnectSocket();
    router.push("/");
  }, [clearReactionTimers, joined, roomId, router, socket]);

  const setVideo = useCallback(
    (url: string) =>
      new Promise<void>((resolve, reject) => {
        socket.emit("playback:set-video", { roomId, url }, (response: { ok: boolean; error?: RoomError }) => {
          if (!response.ok) {
            const msg = response.error?.message ?? "Failed to set video";
            setError(msg);
            toast(msg.toUpperCase(), "error");
            reject(new Error(msg));
            return;
          }
          resolve();
        });
      }),
    [roomId, socket, toast]
  );

  const play = useCallback(
    (positionSeconds: number) => {
      socket.emit("playback:play", { roomId, positionSeconds });
    },
    [roomId, socket]
  );

  const pause = useCallback(
    (positionSeconds: number) => {
      socket.emit("playback:pause", { roomId, positionSeconds });
    },
    [roomId, socket]
  );

  const seek = useCallback(
    (positionSeconds: number) => {
      socket.emit("playback:seek", { roomId, positionSeconds });
    },
    [roomId, socket]
  );

  const sendChat = useCallback(
    (text: string) =>
      new Promise<void>((resolve, reject) => {
        socket.emit("chat:send", { roomId, text }, (response: { ok: boolean; error?: RoomError }) => {
          if (!response.ok) {
            const msg = response.error?.message ?? "Failed to send message";
            setError(msg);
            reject(new Error(msg));
            return;
          }
          resolve();
        });
      }),
    [roomId, socket]
  );

  const sendReaction = useCallback(
    (emoji: string) => new Promise<void>((resolve, reject) => {
      if (!joined || !socket.connected || connectionState !== "connected") {
        reject(new Error("You are not connected to the room."));
        return;
      }

      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("Reaction delivery timed out."));
      }, SOCKET_ACK_TIMEOUT_MS);

      socket.volatile.emit(
        "reaction:send",
        { roomId, emoji },
        (response: SocketActionResponse) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          if (!response?.ok) {
            reject(new Error(response?.error?.message ?? "Reaction could not be sent."));
            return;
          }
          resolve();
        }
      );
    }),
    [connectionState, joined, roomId, socket]
  );

  const setTheme = useCallback(
    (nextTheme: RoomTheme) => new Promise<void>((resolve, reject) => {
      if (
        !joined ||
        !socket.connected ||
        connectionState !== "connected" ||
        !room ||
        room.hostParticipantId !== participantId
      ) {
        reject(new Error("Only the connected room host can change the theme."));
        return;
      }

      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("Theme update timed out."));
      }, SOCKET_ACK_TIMEOUT_MS);

      socket.emit(
        "room:set-theme",
        { roomId, theme: nextTheme },
        (response: SocketActionResponse) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          if (!response?.ok) {
            reject(new Error(response?.error?.message ?? "Theme could not be updated."));
            return;
          }
          if (response.room) setRoom(response.room);
          resolve();
        }
      );
    }),
    [connectionState, joined, participantId, room, roomId, socket]
  );

  const isHost = Boolean(room && participantId && room.hostParticipantId === participantId);
  const theme = normalizeTheme((room as RoomWithTheme | null)?.theme);

  const value = useMemo(
    () => ({
      roomId,
      room,
      participantId,
      joined,
      joining,
      loading,
      error,
      roomError,
      connectionState: socket.connected ? getConnectionState(socket) : connectionState,
      reactions,
      isHost,
      theme,
      isRoomCreator,
      join,
      leaveRoom,
      setVideo,
      play,
      pause,
      seek,
      sendChat,
      sendReaction,
      setTheme,
    }),
    [
      roomId,
      room,
      participantId,
      joined,
      joining,
      loading,
      error,
      roomError,
      connectionState,
      reactions,
      isHost,
      theme,
      isRoomCreator,
      socket,
      join,
      leaveRoom,
      setVideo,
      play,
      pause,
      seek,
      sendChat,
      sendReaction,
      setTheme,
    ]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
