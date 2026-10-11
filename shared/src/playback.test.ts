import { describe, expect, it } from "vitest";
import { getEffectivePlaybackPosition, shouldCorrectDrift } from "./playback";
import type { PlaybackState } from "./types";
import { extractYouTubeVideoId } from "./youtube";

describe("getEffectivePlaybackPosition", () => {
  const base: PlaybackState = {
    videoId: "abc",
    status: "paused",
    positionSeconds: 100,
    lastUpdatedAt: 1000,
  };

  it("returns stored position when paused", () => {
    expect(getEffectivePlaybackPosition(base, 5000)).toBe(100);
  });

  it("advances position when playing", () => {
    const playing: PlaybackState = { ...base, status: "playing" };
    expect(getEffectivePlaybackPosition(playing, 6000)).toBe(105);
  });

  it("clamps negative stored position", () => {
    expect(getEffectivePlaybackPosition({ ...base, positionSeconds: -5 }, 1000)).toBe(0);
  });
});

describe("shouldCorrectDrift", () => {
  it("detects significant drift", () => {
    expect(shouldCorrectDrift(100, 103)).toBe(true);
    expect(shouldCorrectDrift(100, 100.5)).toBe(false);
  });
});

describe("extractYouTubeVideoId", () => {
  it("parses common URL formats", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects invalid input", () => {
    expect(extractYouTubeVideoId("not-a-url")).toBeNull();
    expect(extractYouTubeVideoId("")).toBeNull();
  });
});
