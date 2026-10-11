const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

const URL_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:[^&]+&)*v=|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
];

export function isValidYouTubeVideoId(videoId: string): boolean {
  return YOUTUBE_VIDEO_ID_REGEX.test(videoId);
}

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isValidYouTubeVideoId(trimmed)) {
    return trimmed;
  }

  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1] && isValidYouTubeVideoId(match[1])) {
      return match[1];
    }
  }

  try {
    const url = new URL(trimmed);
    const v = url.searchParams.get("v");
    if (v && isValidYouTubeVideoId(v)) {
      return v;
    }
  } catch {
    // not a URL
  }

  return null;
}

export function toYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
