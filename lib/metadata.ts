export function generatePageMetadata(pageName: string, path: string) {
  const siteUrl = "https://codingterrace.com";
  const fullPath = `${siteUrl}${path}`;
  const description = `코딩테라스 ${pageName} 페이지입니다!`;
  return {
    title: `${pageName}`,
    description,
    openGraph: {
      title: `${pageName} 페이지`,
      description,
      url: fullPath,
      images: {
        url: "/icon.png",
        width: 800,
        height: 800,
        alt: "코딩테라스",
      },
      type: "website",
      siteName: "코딩테라스",
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageName} 페이지`,
      description,
      images: {
        url: "/icon.png",
      },
    },
  };
}

export function extractThumbnailFromContent(content: string): string | null {
  const imageRegex = /!\[[^\]]*\]\((.*?)\)/g;
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:[^\/\n\s]*\/\S+\/|(?:v|e(?:mbed)?)\/?(\S+)|.*[?&]v=([^"&?\/\s]{11}))|youtu\.be\/([^"&?\/\s]{11}))/g;
  const images: { url: string; index: number }[] = [];
  const youtubeThumbnails: { url: string; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({ url: match[1], index: match.index });
  }
  while ((match = youtubeRegex.exec(content)) !== null) {
    const matchGroups = [match[1], match[2], match[3]].filter(Boolean);
    const videoId = matchGroups[0];
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    youtubeThumbnails.push({ url: thumbnailUrl, index: match.index });
  }
  const firstImage = images.length > 0 ? images[0] : null;
  const firstYoutubeThumbnail =
    youtubeThumbnails.length > 0 ? youtubeThumbnails[0] : null;

  if (firstImage && firstYoutubeThumbnail) {
    return firstImage.index < firstYoutubeThumbnail.index
      ? firstImage.url
      : firstYoutubeThumbnail.url;
  }
  return firstImage?.url || firstYoutubeThumbnail?.url || null;
}
