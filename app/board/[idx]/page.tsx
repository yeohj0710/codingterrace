import PostView from "@/components/postView";

export default function BoardPostPage({ params }: { params: { idx: string } }) {
  return <PostView idx={params.idx} category="board" basePath="/board" />;
}
