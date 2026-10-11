export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export type RemotePeerState = {
  participantId: string;
  stream: MediaStream | null;
  cameraEnabled: boolean;
  micMuted: boolean;
  connectionState: PeerConnectionState;
};

export type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

export type WebRTCErrorCode =
  | "PERMISSION_DENIED"
  | "DEVICE_NOT_FOUND"
  | "DEVICE_IN_USE"
  | "NOT_SUPPORTED";

export type WebRTCError = {
  code: WebRTCErrorCode;
  message: string;
};

export type SignalingHandlers = {
  onOffer: (fromParticipantId: string, sdp: string) => void;
  onAnswer: (fromParticipantId: string, sdp: string) => void;
  onIceCandidate: (
    fromParticipantId: string,
    candidate: string,
    sdpMid?: string | null,
    sdpMLineIndex?: number | null
  ) => void;
  onMediaState: (
    participantId: string,
    cameraEnabled: boolean,
    micMuted: boolean
  ) => void;
  onPeerReconnected: (participantId: string) => void;
};
