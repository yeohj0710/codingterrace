"use client";

import { useEffect, useState } from "react";
import { categoryToName } from "@/lib/utils";
import { customSchema } from "@/lib/customSchema";
import { getIsOwner } from "@/lib/auth";
import { deletePost, getPost } from "@/lib/post";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/atom-one-dark.css";
import CommentSection from "./commentSection";

interface PostViewProps {
  idx: string;
  category: string;
  basePath: string;
}

export default function PostView({ idx, category, basePath }: PostViewProps) {
  const [post, setPost] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      const postIdx = Number(idx);
      if (isNaN(postIdx)) {
        window.alert("존재하지 않는 게시물입니다.");
        window.location.href = basePath;
        return;
      }
      const fetchedPost = await getPost(postIdx, category);
      if (!fetchedPost) {
        window.alert("존재하지 않는 게시물입니다.");
        window.location.href = basePath;
        return;
      }
      setPost(fetchedPost);
      const ownerStatus = await getIsOwner(fetchedPost.user?.idx!);
      setIsOwner(ownerStatus);
    };
    fetchData();
  }, [idx, category, basePath]);
  if (!post) {
    return null;
  }
  const handleImageClick = (src: string) => {
    setSelectedImage(src);
  };
  const handleEdit = async () => {
    window.location.href = `${basePath}/${post.idx}/edit`;
  };
  const handleDelete = async () => {
    if (post.password !== null && post.password !== "") {
      const password = window.prompt("게시글 비밀번호를 입력해 주세요.");
      if (password === post.password) {
        setIsDeleting(true);
        await deletePost(post.idx);
        window.alert("게시글이 삭제되었습니다.");
        window.location.href = basePath;
      } else {
        window.alert("비밀번호가 올바르지 않습니다.");
      }
    } else {
      const confirmed = window.confirm("정말로 이 게시물을 삭제할까요?");
      if (confirmed) {
        setIsDeleting(true);
        await deletePost(post.idx);
        window.alert("게시글이 삭제되었습니다.");
        window.location.href = basePath;
      }
    }
  };
  return (
    <div className="flex flex-col items-center px-5 pt-0 pb-20">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 pt-8">
        <span className="text-xl font-bold text-gray-800 mt-4">
          {categoryToName(post.category)}
        </span>
        <hr className="border-gray-300 my-4" />
        <div className="bg-white shadow-md rounded-lg px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600 hidden sm:block">
              {categoryToName(post.category)}
            </span>
            <div className="flex flex-row gap-1 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                {post.user?.avatar && (
                  <img
                    src={post.user.avatar.replace("/public", "/avatar")}
                    alt={`${post.user.nickname}의 프로필 이미지`}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                )}
                <span>{post.user?.nickname ?? post.nickname}</span>
              </div>
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
              rehypePlugins={[
                rehypeRaw,
                [rehypeSanitize, customSchema],
                rehypeHighlight,
              ]}
              components={{
                img: ({ node, ...props }) => (
                  <img
                    {...props}
                    className="max-w-full h-auto mx-auto cursor-pointer"
                    alt={props.alt}
                    onClick={() => handleImageClick(props.src!)}
                  />
                ),
              }}
              className="break-all"
            >
              {post.content}
            </ReactMarkdown>
            {selectedImage && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
                onClick={() => setSelectedImage(null)}
              >
                <button
                  className="absolute top-5 right-5 text-white text-3xl z-50"
                  onClick={() => setSelectedImage(null)}
                >
                  &times;
                </button>
                <img
                  src={selectedImage}
                  alt="Modal Image"
                  className="max-h-full max-w-full"
                />
              </div>
            )}
          </div>
          {(isOwner || (post.password !== null && post.password !== "")) && (
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={handleEdit}
                disabled={isDeleting}
                className={`px-4 py-1.5 rounded-md ${
                  isDeleting
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-50"
                    : "bg-green-400 text-white hover:bg-green-500"
                }`}
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`px-4 py-1.5 rounded-md ${
                  isDeleting
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-50"
                    : "bg-red-400 text-white hover:bg-red-500"
                }`}
              >
                {isDeleting ? "삭제 중" : "삭제"}
              </button>
            </div>
          )}
        </div>
        <CommentSection postIdx={post.idx} />
      </div>
    </div>
  );
}
