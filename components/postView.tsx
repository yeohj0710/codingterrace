"use client";

import { useEffect, useState } from "react";
import { getIsOwner } from "@/lib/auth";
import { getSafeEmbedSrc } from "@/lib/contentSecurity";
import { customSchema } from "@/lib/customSchema";
import { deletePost, getPost } from "@/lib/post";
import { remarkYoutubeEmbed } from "@/lib/remarkYoutubeEmbed";
import { categoryToName } from "@/lib/utils";
import CommentSection from "./commentSection";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/atom-one-dark.css";

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

      if (Number.isNaN(postIdx)) {
        window.alert("The requested post does not exist.");
        window.location.href = basePath;
        return;
      }

      const fetchedPost = await getPost(postIdx, category);

      if (!fetchedPost) {
        window.alert("The requested post does not exist.");
        window.location.href = basePath;
        return;
      }

      setPost(fetchedPost);
      setIsOwner(
        fetchedPost.user?.idx ? await getIsOwner(fetchedPost.user.idx) : false
      );
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
    try {
      setIsDeleting(true);

      if (post.hasPassword) {
        const password = window.prompt("Enter the post password.");

        if (!password) {
          setIsDeleting(false);
          return;
        }

        await deletePost(post.idx, password);
      } else {
        const confirmed = window.confirm("Delete this post?");

        if (!confirmed) {
          setIsDeleting(false);
          return;
        }

        await deletePost(post.idx);
      }

      window.alert("The post was deleted.");
      window.location.href = basePath;
    } catch (error: any) {
      window.alert(error?.message || "Failed to delete the post.");
      setIsDeleting(false);
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
                    alt={`${post.user.nickname} profile image`}
                    className="w-7 h-7 rounded-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span>{post.user?.nickname ?? post.nickname}</span>
              </div>
              {!post.user && post.ip ? (
                <span className="text-gray-400">({post.ip})</span>
              ) : null}
            </div>
            <span className="text-sm text-gray-600">
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
              remarkPlugins={[remarkGfm, remarkBreaks, remarkYoutubeEmbed]}
              rehypePlugins={[
                rehypeRaw,
                [rehypeSanitize, customSchema],
                rehypeHighlight,
              ]}
              components={{
                a: ({ node, href, children, ...props }) => {
                  const isExternal =
                    typeof href === "string" &&
                    /^https?:\/\//i.test(href);

                  return (
                    <a
                      {...props}
                      href={href}
                      target={isExternal ? "_blank" : props.target}
                      rel={
                        isExternal ? "noopener noreferrer nofollow" : props.rel
                      }
                    >
                      {children}
                    </a>
                  );
                },
                img: ({ node, ...props }) => (
                  <img
                    {...props}
                    className="max-w-full h-auto mx-auto cursor-pointer mt-4 -mb-2"
                    alt={props.alt}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onClick={() => handleImageClick(props.src!)}
                  />
                ),
                iframe: ({ node, src, title, allow, ...props }) => {
                  const safeSrc = getSafeEmbedSrc(src);

                  if (!safeSrc) {
                    return null;
                  }

                  return (
                    <iframe
                      {...props}
                      src={safeSrc}
                      allow={allow}
                      className="mx-auto block mt-4 -mb-2"
                      title={title || "Embedded video"}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      sandbox="allow-same-origin allow-scripts allow-popups"
                    />
                  );
                },
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
                  alt="Post image"
                  className="max-h-full max-w-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
          {(isOwner || post.hasPassword) && (
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
                Edit
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
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
        <CommentSection postIdx={post.idx} />
      </div>
    </div>
  );
}
