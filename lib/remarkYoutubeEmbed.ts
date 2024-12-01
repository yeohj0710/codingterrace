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
        /(?:https?:\/\/)?(?:www\.|m\.)?(youtube\.com\/.*(?:\?|&)v=|youtu\.be\/)([^"&?\/\s]{11})/;
      const videoIdMatch = youtubeRegex.exec(url);
      if (videoIdMatch && typeof index === "number") {
        const videoId = videoIdMatch[2];
        const youtubeLink = `https://www.youtube.com/watch?v=${videoId}`;
        if (isMobileChrome()) {
          parent.children[index] = {
            type: "html",
            value: `<div style="position: relative; width: 100%; max-width: 640px; aspect-ratio: 16 / 9;">
                      <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        sandbox="allow-same-origin allow-scripts allow-popups" 
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen 
                        style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;" 
                      ></iframe>
                      <a href="${youtubeLink}" target="_blank" rel="noopener noreferrer"
                         style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block; z-index: 1;"
                         title="YouTube로 이동">
                      </a>
                    </div>`,
          };
        } else {
          parent.children[index] = {
            type: "html",
            value: `<iframe 
                      src="https://www.youtube.com/embed/${videoId}" 
                      frameborder="0" 
                      sandbox="allow-same-origin allow-scripts allow-popups" 
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen 
                      style="width: 100%; max-width: 640px; aspect-ratio: 16 / 9;" 
                      loading="lazy">
                    </iframe>`,
          };
        }
      }
    });
  };
}
