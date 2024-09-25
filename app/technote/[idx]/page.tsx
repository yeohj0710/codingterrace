import PostView from "@/components/postView";

export default function TechnotePostPage({
  params,
}: {
  params: { idx: string };
}) {
  return <PostView idx={params.idx} category="technote" basePath="/technote" />;
}
