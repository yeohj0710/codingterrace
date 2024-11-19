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
  const imageRegex = /!\[[^\]]*\]\((.*?)\)/;
  const match = imageRegex.exec(content);
  return match ? match[1] : null;
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
    title: post.title,
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
  return <PostView idx={params.idx} category="board" basePath="/board" />;
}
