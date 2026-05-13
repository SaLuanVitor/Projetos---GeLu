import { describe, expect, it } from "vitest";
import { getVideoEmbedUrl, getYoutubeThumbnailUrl } from "@/utils/video-embed";

describe("getVideoEmbedUrl", () => {
  it("converts YouTube watch URLs", () => {
    expect(getVideoEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
  });

  it("converts short YouTube URLs", () => {
    expect(getVideoEmbedUrl("https://youtu.be/abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
  });

  it("converts YouTube shorts URLs", () => {
    expect(getVideoEmbedUrl("https://www.youtube.com/shorts/abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
  });

  it("keeps embed-friendly URLs and rejects regular external links", () => {
    expect(getVideoEmbedUrl("https://video.example.com/embed/recipe")).toBe(
      "https://video.example.com/embed/recipe"
    );
    expect(getVideoEmbedUrl("https://example.com/watch/recipe")).toBeNull();
  });
});

describe("getYoutubeThumbnailUrl", () => {
  it("creates thumbnails for YouTube watch, short and shorts URLs", () => {
    expect(getYoutubeThumbnailUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://img.youtube.com/vi/abc123/hqdefault.jpg"
    );
    expect(getYoutubeThumbnailUrl("https://youtu.be/abc123")).toBe(
      "https://img.youtube.com/vi/abc123/hqdefault.jpg"
    );
    expect(getYoutubeThumbnailUrl("https://www.youtube.com/shorts/abc123")).toBe(
      "https://img.youtube.com/vi/abc123/hqdefault.jpg"
    );
  });

  it("returns null for non-YouTube URLs", () => {
    expect(getYoutubeThumbnailUrl("https://example.com/watch/recipe")).toBeNull();
  });
});
