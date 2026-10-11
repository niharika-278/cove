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
import type { PublicParticipant } from "@cinecouch/shared";
import { useRoom } from "@/lib/room/room-context";
import { getSocket } from "@/lib/socket/client";
import { DeviceManager } from "./device-manager";
import { MediaManager } from "./media-manager";
import { PeerConnectionManager } from "./peer-connection-manager";
import { SignalingService } from "./signaling-service";
import type {
  MediaDeviceOption,
  PeerConnectionState,
  RemotePeerState,
  WebRTCError,
} from "./types";

type WebRTCContextValue = {
  localStream: MediaStream | null;
  remotePeers: Map<string, RemotePeerState>;
  cameraEnabled: boolean;
  micMuted: boolean;
  cameras: MediaDeviceOption[];
  microphones: MediaDeviceOption[];
  selectedCameraId: string | null;
  selectedMicrophoneId: string | null;
  mediaError: WebRTCError | null;
  toggleCamera: () => Promise<void>;
  toggleMic: () => Promise<void>;
  selectCamera: (deviceId: string) => Promise<void>;
  selectMicrophone: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
};

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

type WebRTCProviderProps = {
  children: ReactNode;
};

function createDefaultRemotePeer(participantId: string): RemotePeerState {
  return {
    participantId,
    stream: null,
    cameraEnabled: false,
    micMuted: true,
    connectionState: "new",
  };
}

export function WebRTCProvider({ children }: WebRTCProviderProps) {
  const { roomId, room, participantId, joined, connectionState, roomError } = useRoom();
  const socket = useMemo(() => getSocket(), []);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micMuted, setMicMuted] = useState(true);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceOption[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceOption[]>([]);
  const [mediaError, setMediaError] = useState<WebRTCError | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeerState>>(
    () => new Map()
  );

  const deviceManagerRef = useRef<DeviceManager | null>(null);
  const mediaManagerRef = useRef<MediaManager | null>(null);
  const signalingRef = useRef<SignalingService | null>(null);
  const peerManagerRef = useRef<PeerConnectionManager | null>(null);
  const initializedRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const hadLocalStreamRef = useRef(false);
  const roomRef = useRef(room);
  const participantIdRef = useRef(participantId);
  roomRef.current = room;
  participantIdRef.current = participantId;

  const disposeWebRTC = useCallback(() => {
    signalingRef.current?.stop();
    peerManagerRef.current?.dispose();
    mediaManagerRef.current?.dispose();
    deviceManagerRef.current?.dispose();
    signalingRef.current = null;
    peerManagerRef.current = null;
    mediaManagerRef.current = null;
    deviceManagerRef.current = null;
    initializedRef.current = false;
    wasConnectedRef.current = false;
    hadLocalStreamRef.current = false;
  }, []);

  const updateRemotePeer = useCallback(
    (participantId: string, patch: Partial<RemotePeerState>) => {
      setRemotePeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(participantId) ?? createDefaultRemotePeer(participantId);
        next.set(participantId, { ...existing, ...patch });
        return next;
      });
    },
    []
  );

  const removeRemotePeer = useCallback((participantId: string) => {
    setRemotePeers((prev) => {
      const next = new Map(prev);
      next.delete(participantId);
      return next;
    });
  }, []);

  const syncRemotePeerList = useCallback(
    (participants: PublicParticipant[]) => {
      const connectedIds = new Set(
        participants.filter((p) => p.connected).map((p) => p.participantId)
      );

      setRemotePeers((prev) => {
        const next = new Map<string, RemotePeerState>();

        for (const p of participants) {
          if (p.participantId === participantId || !p.connected) continue;
          const existing = prev.get(p.participantId) ?? createDefaultRemotePeer(p.participantId);
          next.set(p.participantId, existing);
        }

        for (const id of prev.keys()) {
          if (!connectedIds.has(id)) {
            peerManagerRef.current?.removePeer(id);
          }
        }

        return next;
      });
    },
    [participantId]
  );

  const connectToAllPeers = useCallback(() => {
    const currentRoom = roomRef.current;
    const currentParticipantId = participantIdRef.current;
    if (!currentRoom || !currentParticipantId || !peerManagerRef.current) return;

    const remoteIds = currentRoom.participants
      .filter((p) => p.connected && p.participantId !== currentParticipantId)
      .map((p) => p.participantId);

    peerManagerRef.current.connectToPeers(remoteIds).catch(() => {});
  }, []);

  const broadcastMediaState = useCallback(() => {
    const media = mediaManagerRef.current;
    const signaling = signalingRef.current;
    if (!media || !signaling) return;

    const state = media.getState();
    signaling.broadcastMediaState(state.cameraEnabled, state.micMuted);
  }, []);

  const refreshDevices = useCallback(async () => {
    const dm = deviceManagerRef.current;
    if (!dm) return;

    const { cameras: cams, microphones: mics } = await dm.enumerateDevices();
    setCameras(cams);
    setMicrophones(mics);
  }, []);

  useEffect(() => {
    if (!joined || !participantId || initializedRef.current) return;

    const deviceManager = new DeviceManager();
    const mediaManager = new MediaManager();
    const signaling = new SignalingService(socket, roomId);
    const peerManager = new PeerConnectionManager({
      localParticipantId: participantId,
      mediaManager,
      signaling,
      onPeerStateChange: ({ participantId: peerId, stream, connectionState: connState }) => {
        updateRemotePeer(peerId, { stream, connectionState: connState });
      },
    });

    deviceManagerRef.current = deviceManager;
    mediaManagerRef.current = mediaManager;
    signalingRef.current = signaling;
    peerManagerRef.current = peerManager;
    initializedRef.current = true;

    const unsubMedia = mediaManager.onStateChange((state, stream) => {
      const isFirstStream = stream !== null && !hadLocalStreamRef.current;
      hadLocalStreamRef.current = stream !== null;

      setLocalStream(stream);
      setCameraEnabled(state.cameraEnabled);
      setMicMuted(state.micMuted);
      setSelectedCameraId(state.selectedCameraId);
      setSelectedMicrophoneId(state.selectedMicrophoneId);
      setMediaError(mediaManager.getLastError());

      peerManager.refreshLocalTracks();
      if (isFirstStream) {
        peerManager.renegotiateAll().catch(() => {});
      }
      broadcastMediaState();
    });

    const unsubDevices = deviceManager.onDeviceChange(() => {
      refreshDevices().catch(() => {});
    });

    signaling.start({
      onOffer: (fromId, sdp) => {
        peerManager.handleOffer(fromId, sdp).catch(() => {});
      },
      onAnswer: (fromId, sdp) => {
        peerManager.handleAnswer(fromId, sdp).catch(() => {});
      },
      onIceCandidate: (fromId, candidate, sdpMid, sdpMLineIndex) => {
        peerManager
          .handleIceCandidate(fromId, candidate, sdpMid, sdpMLineIndex)
          .catch(() => {});
      },
      onMediaState: (peerId, camEnabled, muted) => {
        updateRemotePeer(peerId, { cameraEnabled: camEnabled, micMuted: muted });
      },
      onPeerReconnected: (peerId) => {
        peerManager.handlePeerReconnected(peerId).catch(() => {});
      },
    });

    refreshDevices().catch(() => {});
    connectToAllPeers();
    broadcastMediaState();

    return () => {
      unsubMedia();
      unsubDevices();
      disposeWebRTC();
    };
  }, [
    joined,
    participantId,
    roomId,
    socket,
    updateRemotePeer,
    broadcastMediaState,
    refreshDevices,
    connectToAllPeers,
    disposeWebRTC,
  ]);

  useEffect(() => {
    const onPageHide = () => disposeWebRTC();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [disposeWebRTC]);

  useEffect(() => {
    if (roomError?.code === "ROOM_EXPIRED") {
      disposeWebRTC();
    }
  }, [roomError, disposeWebRTC]);

  useEffect(() => {
    if (!room || !joined) return;
    syncRemotePeerList(room.participants);
  }, [room, joined, syncRemotePeerList]);

  useEffect(() => {
    if (!joined || !participantId) return;

    const onParticipantJoined = ({
      participant,
    }: {
      participant?: { participantId: string };
    }) => {
      if (!participant || participant.participantId === participantId) return;
      updateRemotePeer(participant.participantId, createDefaultRemotePeer(participant.participantId));
      peerManagerRef.current?.connectToPeer(participant.participantId).catch(() => {});
    };

    const onParticipantLeft = ({
      participantId: leftId,
    }: {
      participantId: string;
    }) => {
      peerManagerRef.current?.removePeer(leftId);
      removeRemotePeer(leftId);
    };

    socket.on("room:participant-joined", onParticipantJoined);
    socket.on("room:participant-left", onParticipantLeft);

    return () => {
      socket.off("room:participant-joined", onParticipantJoined);
      socket.off("room:participant-left", onParticipantLeft);
    };
  }, [joined, participantId, socket, updateRemotePeer, removeRemotePeer]);

  useEffect(() => {
    if (!joined) return;

    if (connectionState === "connected") {
      if (wasConnectedRef.current) {
        signalingRef.current?.notifyReconnect();
        connectToAllPeers();
      }
      wasConnectedRef.current = true;
    }
  }, [joined, connectionState, connectToAllPeers]);

  const toggleCamera = useCallback(async () => {
    const media = mediaManagerRef.current;
    if (!media) return;

    if (media.getState().cameraEnabled) {
      media.disableCamera();
    } else {
      const ok = await media.enableCamera();
      if (!ok) {
        setMediaError(media.getLastError());
      }
    }
  }, []);

  const toggleMic = useCallback(async () => {
    const media = mediaManagerRef.current;
    if (!media) return;

    if (media.getState().micMuted) {
      const ok = await media.unmuteMic();
      if (!ok) {
        setMediaError(media.getLastError());
      }
    } else {
      media.muteMic();
    }
  }, []);

  const selectCamera = useCallback(async (deviceId: string) => {
    const media = mediaManagerRef.current;
    if (!media) return;

    const ok = await media.setCamera(deviceId);
    if (!ok) {
      setMediaError(media.getLastError());
    }
    peerManagerRef.current?.refreshLocalTracks();
  }, []);

  const selectMicrophone = useCallback(async (deviceId: string) => {
    const media = mediaManagerRef.current;
    if (!media) return;

    const ok = await media.setMicrophone(deviceId);
    if (!ok) {
      setMediaError(media.getLastError());
    }
    peerManagerRef.current?.refreshLocalTracks();
  }, []);

  const value = useMemo(
    () => ({
      localStream,
      remotePeers,
      cameraEnabled,
      micMuted,
      cameras,
      microphones,
      selectedCameraId,
      selectedMicrophoneId,
      mediaError,
      toggleCamera,
      toggleMic,
      selectCamera,
      selectMicrophone,
      refreshDevices,
    }),
    [
      localStream,
      remotePeers,
      cameraEnabled,
      micMuted,
      cameras,
      microphones,
      selectedCameraId,
      selectedMicrophoneId,
      mediaError,
      toggleCamera,
      toggleMic,
      selectCamera,
      selectMicrophone,
      refreshDevices,
    ]
  );

  return <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>;
}

export function useWebRTC(): WebRTCContextValue {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error("useWebRTC must be used within WebRTCProvider");
  return ctx;
}

export type { PeerConnectionState, RemotePeerState };
