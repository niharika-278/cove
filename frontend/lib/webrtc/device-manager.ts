import type { MediaDeviceOption } from "./types";

export class DeviceManager {
  private deviceChangeListeners = new Set<() => void>();

  constructor() {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener("devicechange", this.handleDeviceChange);
    }
  }

  private handleDeviceChange = () => {
    for (const listener of this.deviceChangeListeners) {
      listener();
    }
  };

  onDeviceChange(listener: () => void): () => void {
    this.deviceChangeListeners.add(listener);
    return () => this.deviceChangeListeners.delete(listener);
  }

  async enumerateDevices(): Promise<{
    cameras: MediaDeviceOption[];
    microphones: MediaDeviceOption[];
  }> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return { cameras: [], microphones: [] };
    }

    const devices = await navigator.mediaDevices.enumerateDevices();

    const cameras = devices
      .filter((d) => d.kind === "videoinput")
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${i + 1}`,
      }));

    const microphones = devices
      .filter((d) => d.kind === "audioinput")
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone ${i + 1}`,
      }));

    return { cameras, microphones };
  }

  dispose(): void {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener("devicechange", this.handleDeviceChange);
    }
    this.deviceChangeListeners.clear();
  }
}
