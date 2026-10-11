import { ICE_SERVERS } from "./config";
import type { MediaManager } from "./media-manager";
import type { SignalingService } from "./signaling-service";
import type { PeerConnectionState } from "./types";

type PeerEntry = {
  pc: RTCPeerConnection;
  makingOffer: boolean;
  ignoreOffer: boolean;
  remoteStream: MediaStream;
  connectionState: PeerConnectionState;
  iceRestartAttempts: number;
};

export type PeerStateUpdate = {
  participantId: string;
  stream: MediaStream | null;
  connectionState: PeerConnectionState;
};

export type PeerConnectionManagerOptions = {
  localParticipantId: string;
  mediaManager: MediaManager;
  signaling: SignalingService;
  onPeerStateChange: (update: PeerStateUpdate) => void;
};

export class PeerConnectionManager {
  private localParticipantId: string;
  private mediaManager: MediaManager;
  private signaling: SignalingService;
  private onPeerStateChange: (update: PeerStateUpdate) => void;
  private peers = new Map<string, PeerEntry>();
  private disposed = false;

  constructor(options: PeerConnectionManagerOptions) {
    this.localParticipantId = options.localParticipantId;
    this.mediaManager = options.mediaManager;
    this.signaling = options.signaling;
    this.onPeerStateChange = options.onPeerStateChange;
  }

  private isPolite(remoteParticipantId: string): boolean {
    return this.localParticipantId < remoteParticipantId;
  }

  private shouldInitiate(remoteParticipantId: string): boolean {
    return this.localParticipantId < remoteParticipantId;
  }

  private createPeerConnection(remoteParticipantId: string): PeerEntry {
    const remoteStream = new MediaStream();
    const entry: PeerEntry = {
      pc: new RTCPeerConnection({ iceServers: ICE_SERVERS }),
      makingOffer: false,
      ignoreOffer: false,
      remoteStream,
      connectionState: "new",
      iceRestartAttempts: 0,
    };

    const { pc } = entry;

    const localStream = this.mediaManager.getLocalStream();
    if (localStream) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }
    } else {
      pc.addTransceiver("video", { direction: "sendrecv" });
      pc.addTransceiver("audio", { direction: "sendrecv" });
    }

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      this.signaling.sendIceCandidate(
        remoteParticipantId,
        event.candidate.candidate,
        event.candidate.sdpMid,
        event.candidate.sdpMLineIndex
      );
    };

    pc.ontrack = (event) => {
      for (const track of event.streams[0]?.getTracks() ?? [event.track]) {
        if (!entry.remoteStream.getTracks().some((t) => t.id === track.id)) {
          entry.remoteStream.addTrack(track);
        }
      }
      this.emitPeerState(remoteParticipantId, entry);
    };

    pc.onconnectionstatechange = () => {
      entry.connectionState = pc.connectionState as PeerConnectionState;
      this.emitPeerState(remoteParticipantId, entry);

      if (pc.connectionState === "failed") {
        this.attemptIceRestart(remoteParticipantId).catch(() => {});
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        this.attemptIceRestart(remoteParticipantId).catch(() => {});
      }
    };

    pc.onnegotiationneeded = () => {
      if (!this.shouldInitiate(remoteParticipantId)) return;
      this.createOffer(remoteParticipantId).catch(() => {});
    };

    this.peers.set(remoteParticipantId, entry);
    return entry;
  }

  private emitPeerState(participantId: string, entry: PeerEntry): void {
    this.onPeerStateChange({
      participantId,
      stream: entry.remoteStream.getTracks().length > 0 ? entry.remoteStream : null,
      connectionState: entry.connectionState,
    });
  }

  private getOrCreatePeer(remoteParticipantId: string): PeerEntry {
    let entry = this.peers.get(remoteParticipantId);
    if (!entry) {
      entry = this.createPeerConnection(remoteParticipantId);
    }
    return entry;
  }

  async connectToPeer(remoteParticipantId: string): Promise<void> {
    if (this.disposed || remoteParticipantId === this.localParticipantId) return;
    if (!this.shouldInitiate(remoteParticipantId)) return;
    if (this.peers.has(remoteParticipantId)) return;

    this.getOrCreatePeer(remoteParticipantId);
    await this.createOffer(remoteParticipantId);
  }

  async connectToPeers(remoteParticipantIds: string[]): Promise<void> {
    await Promise.all(remoteParticipantIds.map((id) => this.connectToPeer(id)));
  }

  private async createOffer(remoteParticipantId: string): Promise<void> {
    const entry = this.getOrCreatePeer(remoteParticipantId);
    const { pc } = entry;

    if (entry.makingOffer) return;

    try {
      entry.makingOffer = true;
      entry.ignoreOffer = false;

      await pc.setLocalDescription();
      const sdp = pc.localDescription?.sdp;
      if (sdp) {
        this.signaling.sendOffer(remoteParticipantId, sdp);
      }
    } finally {
      entry.makingOffer = false;
    }
  }

  async handleOffer(remoteParticipantId: string, sdp: string): Promise<void> {
    if (this.disposed) return;

    const entry = this.getOrCreatePeer(remoteParticipantId);
    const { pc } = entry;
    const polite = this.isPolite(remoteParticipantId);

    const offerCollision =
      entry.makingOffer || pc.signalingState !== "stable";

    entry.ignoreOffer = !polite && offerCollision;
    if (entry.ignoreOffer) return;

    try {
      if (offerCollision) {
        await pc.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit);
      }

      await pc.setRemoteDescription({ type: "offer", sdp });
      await pc.setLocalDescription();
      const answerSdp = pc.localDescription?.sdp;
      if (answerSdp) {
        this.signaling.sendAnswer(remoteParticipantId, answerSdp);
      }
    } catch {
      // negotiation failed — peer may reconnect
    }
  }

  async handleAnswer(remoteParticipantId: string, sdp: string): Promise<void> {
    if (this.disposed) return;

    const entry = this.peers.get(remoteParticipantId);
    if (!entry || entry.ignoreOffer) return;

    try {
      await entry.pc.setRemoteDescription({ type: "answer", sdp });
      entry.iceRestartAttempts = 0;
    } catch {
      // stale answer
    }
  }

  async handleIceCandidate(
    remoteParticipantId: string,
    candidate: string,
    sdpMid?: string | null,
    sdpMLineIndex?: number | null
  ): Promise<void> {
    if (this.disposed) return;

    const entry = this.peers.get(remoteParticipantId);
    if (!entry || entry.ignoreOffer) return;

    try {
      await entry.pc.addIceCandidate({
        candidate,
        sdpMid: sdpMid ?? undefined,
        sdpMLineIndex: sdpMLineIndex ?? undefined,
      });
    } catch {
      // candidate may arrive after connection is established
    }
  }

  private async attemptIceRestart(remoteParticipantId: string): Promise<void> {
    const entry = this.peers.get(remoteParticipantId);
    if (!entry || entry.iceRestartAttempts >= 2) {
      this.removePeer(remoteParticipantId);
      if (this.shouldInitiate(remoteParticipantId)) {
        await this.connectToPeer(remoteParticipantId);
      }
      return;
    }

    entry.iceRestartAttempts += 1;

    try {
      entry.pc.restartIce();
      if (this.shouldInitiate(remoteParticipantId)) {
        await this.createOffer(remoteParticipantId);
      }
    } catch {
      this.removePeer(remoteParticipantId);
      if (this.shouldInitiate(remoteParticipantId)) {
        await this.connectToPeer(remoteParticipantId);
      }
    }
  }

  async handlePeerReconnected(remoteParticipantId: string): Promise<void> {
    this.removePeer(remoteParticipantId);
    if (this.shouldInitiate(remoteParticipantId)) {
      await this.connectToPeer(remoteParticipantId);
    }
  }

  removePeer(remoteParticipantId: string): void {
    const entry = this.peers.get(remoteParticipantId);
    if (!entry) return;

    entry.pc.onicecandidate = null;
    entry.pc.ontrack = null;
    entry.pc.onconnectionstatechange = null;
    entry.pc.oniceconnectionstatechange = null;
    entry.pc.onnegotiationneeded = null;
    entry.pc.close();

    entry.remoteStream.getTracks().forEach((t) => t.stop());
    this.peers.delete(remoteParticipantId);

    this.onPeerStateChange({
      participantId: remoteParticipantId,
      stream: null,
      connectionState: "closed",
    });
  }

  removeAllPeers(): void {
    for (const id of [...this.peers.keys()]) {
      this.removePeer(id);
    }
  }

  refreshLocalTracks(): void {
    const localStream = this.mediaManager.getLocalStream();
    for (const [, entry] of this.peers) {
      if (!localStream) {
        for (const sender of entry.pc.getSenders()) {
          if (sender.track) sender.replaceTrack(null).catch(() => {});
        }
        continue;
      }

      this.mediaManager.replaceTracksInPeer(entry.pc);
    }
  }

  async renegotiateAll(): Promise<void> {
    const peerIds = [...this.peers.keys()].filter((id) => this.shouldInitiate(id));
    await Promise.all(peerIds.map((id) => this.createOffer(id)));
  }

  dispose(): void {
    this.disposed = true;
    this.removeAllPeers();
  }
}
