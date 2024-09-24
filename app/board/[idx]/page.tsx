"use client";

import { useEffect, useState } from "react";
import { getPost, getIsOwner, deletePost, Redirect } from "./actions";
import { categoryToName } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";
import { customSchema } from "@/lib/customSchema";

export default function Post({ params }: { params: { idx: string } }) {
  const [post, setPost] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const idx = Number(params.idx);
      if (isNaN(idx)) {
        window.alert("존재하지 않는 게시물입니다.");
        Redirect();
        return;
      }
      const fetchedPost = await getPost(idx);
      if (!fetchedPost) {
        window.alert("존재하지 않는 게시물입니다.");
        Redirect();
        return;
      }
      setPost(fetchedPost);
      const ownerStatus = await getIsOwner(fetchedPost.user?.idx!);
      setIsOwner(ownerStatus);
    };
    fetchData();
  }, [params.idx]);

  const handleDelete = async () => {
    if (post.password !== null && post.password !== "") {
      const password = window.prompt("게시글 비밀번호를 입력해 주세요.");
      if (password === post.password) {
        setIsDeleting(true);
        await deletePost(post.idx);
        window.alert("게시글이 삭제되었습니다.");
        Redirect();
      } else {
        window.alert("비밀번호가 올바르지 않습니다.");
      }
    } else {
      const confirmed = window.confirm("정말로 이 게시물을 삭제할까요?");
      if (confirmed) {
        setIsDeleting(true);
        await deletePost(post.idx);
        window.alert("게시글이 삭제되었습니다.");
        Redirect();
      }
    }
  };

  if (!post) {
    return null;
  }

  return (
    <div className="flex flex-col items-center p-5">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 pt-8">
        <span className="text-xl font-bold text-gray-800 mt-4">자유게시판</span>
        <hr className="border-gray-300 my-4" />
        <div className="bg-white shadow-md rounded-lg px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 hidden sm:block">
              {categoryToName(post.category)}
            </span>
            <div className="flex flex-row gap-1 text-sm text-gray-500">
              <span>{post.user?.nickname ?? post.nickname}</span>
              {!post.user && post.ip ? (
                <span className="text-gray-400">({post.ip})</span>
              ) : null}
            </div>
            <span className="text-sm text-gray-600">
              작성일:{" "}
              {new Date(post.created_at).toLocaleString("ko-KR", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Seoul",
              })}
            </span>
          </div>
          <hr className="border-gray-300 my-4" />
          <div className="prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[[rehypeSanitize, customSchema]]}
              components={{
                img: ({ node, ...props }) => (
                  <img {...props} className="w-full" alt={props.alt} />
                ),
              }}
              className="break-all"
            >
              {post.content}
            </ReactMarkdown>
          </div>
          {(isOwner || (post.password !== null && post.password !== "")) && (
            <div className="flex justify-end mt-4">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`px-4 py-1.5 rounded-md ${
                  isDeleting
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-50"
                    : "bg-green-400 text-white hover:bg-green-500"
                }`}
              >
                {isDeleting ? "삭제 중" : "삭제"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
