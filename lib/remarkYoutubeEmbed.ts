import { visit } from "unist-util-visit";

const youtubeRegex =
  /(?:https?:\/\/)?(?:www\.|m\.)?(youtube\.com\/.*(?:\?|&)v=|youtu\.be\/)([^"&?\/\s]{11})/;

export function remarkYoutubeEmbed() {
  return (tree: any) => {
    visit(tree, "link", (node, index, parent) => {
      const url = node.url;
      const videoIdMatch = youtubeRegex.exec(url);

      if (!videoIdMatch || typeof index !== "number" || !parent) {
        return;
      }

      const videoId = videoIdMatch[2];
      parent.children[index] = {
        type: "html",
        value: `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="YouTube video player" frameborder="0" sandbox="allow-same-origin allow-scripts allow-popups" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`,
      };
    });
  };
}
