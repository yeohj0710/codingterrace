"use client";

import PostForm from "@/components/postForm";

export default function EditPostPage({ params }: { params: { idx: string } }) {
  return (
    <PostForm
      mode="edit"
      idx={params.idx}
      category="technote"
      basePath={`/technote/${params.idx}`}
    />
  );
}
