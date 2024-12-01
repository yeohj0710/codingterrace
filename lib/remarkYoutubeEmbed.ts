import { visit } from "unist-util-visit";

export function remarkYoutubeEmbed() {
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
          const iframe = {
            type: "html",
            value: `<iframe width="95%" height="${
              95 * 0.5625
            }%" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" sandbox="allow-same-origin allow-scripts allow-popups" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="aspect-ratio: 16 / 9;" loading="lazy"></iframe>`,
          };
          parent.children[index] = iframe;
        }
      }
    });
  };
}
