import type { Socket } from "socket.io-client";
import type { SignalingHandlers } from "./types";

export class SignalingService {
  private socket: Socket;
  private roomId: string;
  private handlers: SignalingHandlers | null = null;
  private boundHandlers: {
    offer: (payload: {
      fromParticipantId: string;
      sdp: string;
      roomId: string;
      targetParticipantId: string;
    }) => void;
    answer: (payload: {
      fromParticipantId: string;
      sdp: string;
    }) => void;
    ice: (payload: {
      fromParticipantId: string;
      candidate: string;
      sdpMid?: string | null;
      sdpMLineIndex?: number | null;
    }) => void;
    mediaState: (payload: {
      participantId: string;
      cameraEnabled: boolean;
      micMuted: boolean;
    }) => void;
    peerReconnected: (payload: { participantId: string }) => void;
  };

  constructor(socket: Socket, roomId: string) {
    this.socket = socket;
    this.roomId = roomId;

    this.boundHandlers = {
      offer: (payload) => {
        this.handlers?.onOffer(payload.fromParticipantId, payload.sdp);
      },
      answer: (payload) => {
        this.handlers?.onAnswer(payload.fromParticipantId, payload.sdp);
      },
      ice: (payload) => {
        this.handlers?.onIceCandidate(
          payload.fromParticipantId,
          payload.candidate,
          payload.sdpMid,
          payload.sdpMLineIndex
        );
      },
      mediaState: (payload) => {
        this.handlers?.onMediaState(
          payload.participantId,
          payload.cameraEnabled,
          payload.micMuted
        );
      },
      peerReconnected: (payload) => {
        this.handlers?.onPeerReconnected(payload.participantId);
      },
    };
  }

  start(handlers: SignalingHandlers): void {
    this.handlers = handlers;
    this.socket.on("webrtc:offer", this.boundHandlers.offer);
    this.socket.on("webrtc:answer", this.boundHandlers.answer);
    this.socket.on("webrtc:ice-candidate", this.boundHandlers.ice);
    this.socket.on("webrtc:media-state", this.boundHandlers.mediaState);
    this.socket.on("webrtc:peer-reconnected", this.boundHandlers.peerReconnected);
  }

  stop(): void {
    this.socket.off("webrtc:offer", this.boundHandlers.offer);
    this.socket.off("webrtc:answer", this.boundHandlers.answer);
    this.socket.off("webrtc:ice-candidate", this.boundHandlers.ice);
    this.socket.off("webrtc:media-state", this.boundHandlers.mediaState);
    this.socket.off("webrtc:peer-reconnected", this.boundHandlers.peerReconnected);
    this.handlers = null;
  }

  sendOffer(targetParticipantId: string, sdp: string): void {
    this.socket.emit("webrtc:offer", {
      roomId: this.roomId,
      targetParticipantId,
      sdp,
    });
  }

  sendAnswer(targetParticipantId: string, sdp: string): void {
    this.socket.emit("webrtc:answer", {
      roomId: this.roomId,
      targetParticipantId,
      sdp,
    });
  }

  sendIceCandidate(
    targetParticipantId: string,
    candidate: string,
    sdpMid?: string | null,
    sdpMLineIndex?: number | null
  ): void {
    this.socket.emit("webrtc:ice-candidate", {
      roomId: this.roomId,
      targetParticipantId,
      candidate,
      sdpMid,
      sdpMLineIndex,
    });
  }

  broadcastMediaState(cameraEnabled: boolean, micMuted: boolean): void {
    this.socket.emit("webrtc:media-state", {
      roomId: this.roomId,
      cameraEnabled,
      micMuted,
    });
  }

  notifyReconnect(): void {
    this.socket.emit("webrtc:reconnect", { roomId: this.roomId });
  }
}
