export type YouTubeOEmbed = {
  title: string;
  author_name: string;
  thumbnail_url: string;
};

export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeOEmbed | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
