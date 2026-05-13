const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

export function getVideoEmbedUrl(rawUrl: string | null | undefined): string | null {
  const videoId = getYoutubeVideoId(rawUrl);
  if (videoId) {
    return youtubeEmbedUrl(videoId);
  }

  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);

    if (url.pathname.includes("/embed/")) {
      return url.toString();
    }

    return null;
  } catch {
    return null;
  }
}

export function getYoutubeThumbnailUrl(rawUrl: string | null | undefined): string | null {
  const videoId = getYoutubeVideoId(rawUrl);
  return videoId ? `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : null;
}

function getYoutubeVideoId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be") {
      return firstPathPart(url);
    }

    if (YOUTUBE_HOSTS.has(host)) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/").filter(Boolean)[1] ?? null;
      }

      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function firstPathPart(url: URL): string | null {
  return url.pathname.split("/").filter(Boolean)[0] ?? null;
}

function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
}
