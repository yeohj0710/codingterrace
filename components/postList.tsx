"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PostPagination from "@/components/postPagination";
import { getPosts } from "@/app/board/actions";
import removeMarkdown from "remove-markdown";

interface Post {
  title: string;
  idx: number;
  category: string;
  nickname: string | null;
  ip: string | null;
  content: string;
  created_at: Date;
  user: {
    idx: number;
    id: string;
    password: string;
    nickname: string;
    created_at: Date;
    updated_at: Date;
  } | null;
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const postsPerPage = 10;
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { posts, totalPosts } = await getPosts(currentPage, postsPerPage);
      setPosts(posts);
      setTotalPages(Math.ceil(totalPosts / postsPerPage));
      setLoading(false);
    };
    fetchPosts();
  }, [currentPage]);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  function extractFirstImageUrl(content: string): string | null {
    const imageRegex = /!\[.*?\]\((.*?)\)/;
    const match = imageRegex.exec(content);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  }
  return (
    <div className="w-full bg-white">
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="h-28 bg-gray-200 rounded-md mb-2"></div>
          ))}
        </div>
      ) : (
        posts.map((post: Post) => {
          const imageUrl = extractFirstImageUrl(post.content);
          const plainTextContent = removeMarkdown(post.content);
          return (
            <Link
              key={post.idx}
              href={`/board/${post.idx}`}
              className="block mb-4 p-4 bg-gray-100 rounded hover:bg-gray-200"
            >
              <div className="flex">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{post.title}</h2>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-1 break-all">
                    {plainTextContent}
                  </p>
                </div>
                {imageUrl && (
                  <div className="ml-4 w-24 h-24 flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt="게시글 이미지"
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-4 text-gray-600 text-xs">
                <div className="flex flex-row gap-1">
                  <span>{post.user?.nickname ?? post.nickname}</span>
                  {!post.user && post.ip ? (
                    <span className="text-gray-400">({post.ip})</span>
                  ) : null}
                </div>
                <span>
                  {new Date(post.created_at).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Seoul",
                  })}
                </span>
              </div>
            </Link>
          );
        })
      )}
      <PostPagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginate={paginate}
      />
    </div>
  );
}
