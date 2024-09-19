"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PostPagination from "@/components/postPagination";
import { getPosts } from "@/app/board/actions";

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
  return (
    <div className="w-full bg-white">
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="h-28 bg-gray-200 rounded-md mb-2"></div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        posts.map((post: Post) => (
          <Link
            key={post.idx}
            href={`/board/${post.idx}`}
            className="block mb-4 p-4 bg-gray-100 rounded hover:bg-gray-200"
          >
            <h2 className="text-lg font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-600 mt-2 sm:hidden">
              {post.content.length > 20
                ? `${post.content.slice(0, 20)} ...`
                : post.content}
            </p>
            <p className="text-sm text-gray-600 mt-2 hidden sm:block">
              {post.content.length > 30
                ? `${post.content.slice(0, 30)} ...`
                : post.content}
            </p>
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
        ))
      ) : (
        <span className="text-sm text-gray-500">게시글이 없습니다.</span>
      )}
      <PostPagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginate={paginate}
      />
    </div>
  );
}
