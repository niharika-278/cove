import { describe, expect, it } from "vitest";
import { REACTION_EMOJIS, ROOM_THEMES } from "./types";
import { reactionSchema, setThemeSchema } from "./validation";

const roomId = "A".repeat(12);

describe("room theme and reaction validation", () => {
  it("accepts every supported room theme", () => {
    for (const theme of ROOM_THEMES) {
      expect(setThemeSchema.safeParse({ roomId, theme }).success).toBe(true);
    }
  });

  it("rejects unsupported room themes", () => {
    expect(setThemeSchema.safeParse({ roomId, theme: "neon" }).success).toBe(false);
  });

  it("accepts only the supported transient reaction emojis", () => {
    for (const emoji of REACTION_EMOJIS) {
      expect(reactionSchema.safeParse({ roomId, emoji }).success).toBe(true);
    }

    expect(reactionSchema.safeParse({ roomId, emoji: "🔥" }).success).toBe(false);
  });
});
