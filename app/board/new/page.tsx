"use client";

import PostForm from "@/components/postForm";

export default function AddPostPage() {
  return <PostForm mode="add" category="board" basePath="/board" />;
}
