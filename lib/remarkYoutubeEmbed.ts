import { visit } from "unist-util-visit";

export function remarkYoutubeEmbed() {
  const isMobileChrome = () => {
    const userAgent = navigator.userAgent;
    return /Mobi|Android/i.test(userAgent) && /Chrome/i.test(userAgent);
  };
  return (tree: any) => {
    visit(tree, "link", (node, index, parent) => {
      const url = node.url;
      const youtubeRegex =
        /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (youtubeRegex.test(url)) {
        const videoIdMatch = url.match(
          /(?:youtube\.com\/.*(?:\?|&)v=|youtu\.be\/|m\.youtube\.com\/.*(?:\?|&)v=)([^"&?\/\s]{11})/
        );
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId && typeof index === "number") {
          if (isMobileChrome()) {
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            parent.children[index] = {
              type: "html",
              value: `<a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">
                        <img src="${thumbnailUrl}" alt="YouTube Thumbnail" style="width:100%; max-width:640px; cursor:pointer; border: 1px solid #ddd; border-radius: 4px;" />
                      </a>`,
            };
          } else {
            const iframe = {
              type: "html",
              value: `<iframe width="95%" height="${
                95 * 0.5625
              }%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" sandbox="allow-same-origin allow-scripts allow-popups" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="aspect-ratio: 16 / 9;" loading="lazy"></iframe>`,
            };
            parent.children[index] = iframe;
          }
        }
      }
    });
  };
}
