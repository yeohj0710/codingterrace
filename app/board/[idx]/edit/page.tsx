"use client";

import PostForm from "@/components/postForm";

export default function EditPostPage({ params }: { params: { idx: string } }) {
  return (
    <PostForm
      mode="edit"
      idx={params.idx}
      category="board"
      basePath={`/board/${params.idx}`}
    />
  );
}
