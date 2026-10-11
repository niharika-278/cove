"use client";

import { ROOM_THEMES, type RoomTheme } from "@cinecouch/shared";
import { cn } from "@/lib/utils";

export type RoomThemeOption = {
  id: RoomTheme;
  label: string;
  description: string;
};

export const ROOM_THEME_OPTIONS: readonly RoomThemeOption[] = [
  { id: "cozy-cabin", label: "Cozy cabin", description: "Warm ivory and sage" },
  { id: "rainy-evening", label: "Rainy evening", description: "Blue-gray and quiet" },
  { id: "midnight-cinema", label: "Midnight cinema", description: "Brown-black and amber" },
  { id: "sunday-morning", label: "Sunday morning", description: "Butter and soft gold" },
];

export function isRoomTheme(value: string | null): value is RoomTheme {
  return value !== null && (ROOM_THEMES as readonly string[]).includes(value);
}

type ThemePreviewProps = {
  theme: RoomTheme;
  className?: string;
  compact?: boolean;
};

export function ThemePreview({ theme, className, compact = false }: ThemePreviewProps) {
  return (
    <div
      className={cn(
        "theme-preview overflow-hidden rounded-xl border border-black/10 p-2",
        compact ? "h-16 w-20" : "h-24 w-full",
        className
      )}
      data-preview-theme={theme}
      aria-hidden="true"
    >
      <div className="flex h-full gap-1.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="theme-preview-screen min-h-0 flex-1 rounded-md opacity-90" />
          <div className="theme-preview-copy h-1.5 w-2/3 rounded-full opacity-80" />
        </div>
        <div className="theme-preview-panel flex w-1/3 flex-col gap-1 rounded-md border p-1.5">
          <span className="theme-preview-copy h-1.5 w-3/4 rounded-full" />
          <span className="theme-preview-copy h-1.5 w-full rounded-full opacity-70" />
          <span className="theme-preview-copy h-1.5 w-2/3 rounded-full opacity-50" />
        </div>
      </div>
    </div>
  );
}
