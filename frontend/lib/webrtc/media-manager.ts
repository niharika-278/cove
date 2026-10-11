import { AUDIO_CONSTRAINTS, VIDEO_CONSTRAINTS } from "./config";
import type { WebRTCError } from "./types";

export type MediaState = {
  cameraEnabled: boolean;
  micMuted: boolean;
  selectedCameraId: string | null;
  selectedMicrophoneId: string | null;
};

export type MediaStateListener = (state: MediaState, stream: MediaStream | null) => void;

export class MediaManager {
  private stream: MediaStream | null = null;
  private state: MediaState = {
    cameraEnabled: false,
    micMuted: true,
    selectedCameraId: null,
    selectedMicrophoneId: null,
  };
  private listeners = new Set<MediaStateListener>();
  private lastError: WebRTCError | null = null;

  getLocalStream(): MediaStream | null {
    return this.stream;
  }

  getState(): MediaState {
    return { ...this.state };
  }

  getLastError(): WebRTCError | null {
    return this.lastError;
  }

  onStateChange(listener: MediaStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState(), this.stream);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state, this.stream);
    }
  }

  private mapMediaError(err: unknown): WebRTCError {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        code: "PERMISSION_DENIED",
        message: "Camera or microphone permission was denied.",
      };
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return {
        code: "DEVICE_NOT_FOUND",
        message: "No camera or microphone was found.",
      };
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return {
        code: "DEVICE_IN_USE",
        message: "Camera or microphone is already in use.",
      };
    }
    return {
      code: "NOT_SUPPORTED",
      message: "Media devices are not supported in this browser.",
    };
  }

  private buildConstraints(): MediaStreamConstraints {
    const video: MediaTrackConstraints | boolean = this.state.cameraEnabled
      ? {
          ...VIDEO_CONSTRAINTS,
          ...(this.state.selectedCameraId
            ? { deviceId: { exact: this.state.selectedCameraId } }
            : {}),
        }
      : false;

    const audio: MediaTrackConstraints | boolean = {
      ...AUDIO_CONSTRAINTS,
      ...(this.state.selectedMicrophoneId
        ? { deviceId: { exact: this.state.selectedMicrophoneId } }
        : {}),
    };

    return { video, audio };
  }

  async acquireMedia(): Promise<MediaStream | null> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.lastError = {
        code: "NOT_SUPPORTED",
        message: "Media devices are not supported in this browser.",
      };
      return null;
    }

    try {
      const constraints = this.buildConstraints();
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
      }

      this.stream = newStream;
      this.applyTrackEnabledState();
      this.lastError = null;
      this.notify();
      return this.stream;
    } catch (err) {
      this.lastError = this.mapMediaError(err);
      return null;
    }
  }

  private applyTrackEnabledState(): void {
    if (!this.stream) return;

    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = this.state.cameraEnabled;
    }

    const audioTrack = this.stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !this.state.micMuted;
    }
  }

  async enableCamera(): Promise<boolean> {
    this.state = { ...this.state, cameraEnabled: true };

    if (!this.stream) {
      const stream = await this.acquireMedia();
      return stream !== null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = true;
      this.notify();
      return true;
    }

    const stream = await this.acquireMedia();
    return stream !== null;
  }

  disableCamera(): void {
    this.state = { ...this.state, cameraEnabled: false };

    const videoTrack = this.stream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = false;
    }

    this.notify();
  }

  async unmuteMic(): Promise<boolean> {
    this.state = { ...this.state, micMuted: false };

    if (!this.stream) {
      const stream = await this.acquireMedia();
      return stream !== null;
    }

    const audioTrack = this.stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
      this.notify();
      return true;
    }

    const stream = await this.acquireMedia();
    return stream !== null;
  }

  muteMic(): void {
    this.state = { ...this.state, micMuted: true };

    const audioTrack = this.stream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = false;
    }

    this.notify();
  }

  async setCamera(deviceId: string): Promise<boolean> {
    this.state = { ...this.state, selectedCameraId: deviceId };

    if (!this.stream && !this.state.cameraEnabled) {
      this.notify();
      return true;
    }

    const stream = await this.acquireMedia();
    return stream !== null;
  }

  async setMicrophone(deviceId: string): Promise<boolean> {
    this.state = { ...this.state, selectedMicrophoneId: deviceId };

    if (!this.stream) {
      this.notify();
      return true;
    }

    const stream = await this.acquireMedia();
    return stream !== null;
  }

  replaceTracksInPeer(pc: RTCPeerConnection): void {
    if (!this.stream) return;

    const videoTrack = this.stream.getVideoTracks()[0];
    const audioTrack = this.stream.getAudioTracks()[0];
    const transceivers = pc.getTransceivers();

    const videoTransceiver =
      transceivers.find((t) => t.sender.track?.kind === "video") ??
      transceivers.find((t) => !t.sender.track && t !== transceivers.find((x) => x.sender.track?.kind === "audio"));

    const audioTransceiver =
      transceivers.find((t) => t.sender.track?.kind === "audio") ??
      transceivers.find((t) => !t.sender.track && t !== videoTransceiver);

    if (videoTransceiver && videoTrack) {
      videoTransceiver.sender.replaceTrack(videoTrack).catch(() => {});
    }
    if (audioTransceiver && audioTrack) {
      audioTransceiver.sender.replaceTrack(audioTrack).catch(() => {});
    }
  }

  dispose(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.listeners.clear();
  }
}
