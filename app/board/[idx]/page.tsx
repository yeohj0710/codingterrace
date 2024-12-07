import OpenExternalInKakao from "@/components/openExternalInKakao";
import PostView from "@/components/postView";
import { getPost } from "@/lib/post";
import { stripMarkdown } from "@/lib/utils";

async function fetchPostData(idx: string) {
  const post = await getPost(Number(idx), "board");
  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }
  return post;
}

function extractThumbnailFromContent(content: string): string | null {
  const imageRegex = /!\[[^\]]*\]\((.*?)\)/g;
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/.*(?:\?|&)v=|youtu\.be\/)([^"&?\/\s]{11})/g;
  const images: { url: string; index: number }[] = [];
  const youtubeThumbnails: { url: string; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({ url: match[1], index: match.index });
  }
  while ((match = youtubeRegex.exec(content)) !== null) {
    const thumbnailUrl = `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
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

export async function generateMetadata({
  params,
}: {
  params: { idx: string };
}) {
  const { idx } = params;
  const post = await fetchPostData(idx);
  const thumbnail = extractThumbnailFromContent(post.content)
    ? { url: extractThumbnailFromContent(post.content)! }
    : {
        url: "/icon.png",
        width: 800,
        height: 800,
        alt: "코딩테라스",
      };
  return {
    title: post.title + " | 코딩테라스",
    description: stripMarkdown(post.content).slice(0, 150),
    openGraph: {
      title: post.title,
      description: stripMarkdown(post.content).slice(0, 150),
      url: `https://codingterrace.com/board/${idx}`,
      images: thumbnail,
      type: "article",
      siteName: "코딩테라스",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: stripMarkdown(post.content).slice(0, 150),
      images: thumbnail,
    },
  };
}

export default function BoardPostPage({ params }: { params: { idx: string } }) {
  const path = `/board/${params.idx}`;
  return (
    <>
      <OpenExternalInKakao path={path} />
      <PostView idx={params.idx} category="board" basePath="/board" />
    </>
  );
}
