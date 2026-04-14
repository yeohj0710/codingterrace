export function getSafeEmbedSrc(src: string | undefined) {
  if (!src) {
    return null;
  }

  try {
    const parsed = new URL(src);
    const isYouTubeEmbed =
      (parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com" ||
        parsed.hostname === "www.youtube-nocookie.com" ||
        parsed.hostname === "youtube-nocookie.com") &&
      parsed.pathname.startsWith("/embed/");

    if (!isYouTubeEmbed) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
