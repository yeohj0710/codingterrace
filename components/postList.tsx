"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PostPagination from "@/components/postPagination";
import removeMarkdown from "remove-markdown";
import { formatDistanceToNowStrict } from "date-fns";
import { ko } from "date-fns/locale";
import { getPosts } from "@/lib/post";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { postCache } from "@/lib/cache";

interface Post {
  title: string;
  idx: number;
  category: string;
  nickname: string | null;
  ip: string | null;
  content: string;
  created_at: Date;
  _count: {
    comment: number;
  };
  user: {
    idx: number;
    id: string;
    password: string;
    nickname: string;
    created_at: Date;
    updated_at: Date;
  } | null;
}

interface PostListProps {
  category: string;
  basePath: string;
  postsPerPage: number;
  refreshKey: number;
  setIsRefreshing: (isRefreshing: boolean) => void;
}

export default function PostList({
  category,
  basePath,
  postsPerPage,
  refreshKey,
  setIsRefreshing,
}: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const cacheKey = `${category}_${currentPage}`;
    const fetchData = async () => {
      setLoading(true);
      setIsRefreshing(true);
      const { posts, totalPosts } = await getPosts(
        category,
        currentPage,
        postsPerPage
      );
      const calculatedTotalPages = Math.ceil(totalPosts / postsPerPage);
      postCache[cacheKey] = { posts, totalPages: calculatedTotalPages };
      setPosts(posts);
      setTotalPages(calculatedTotalPages);
      setLoading(false);
      setIsRefreshing(false);
    };
    if (postCache[cacheKey] && refreshKey === 0) {
      setPosts(postCache[cacheKey].posts);
      setTotalPages(postCache[cacheKey].totalPages);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [category, currentPage, refreshKey]);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  function extractFirstImageUrl(content: string): string | null {
    const imageRegex = /!\[.*?\]\((.*?)\)/;
    const match = imageRegex.exec(content);
    if (match && match[1]) {
      const imageUrl = match[1];
      return imageUrl.replace("/public", "/avatar");
    }
    return null;
  }
  return (
    <div className="w-full bg-white">
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[
            ...Array(
              currentPage === totalPages
                ? posts.length % postsPerPage
                : postsPerPage
            ),
          ].map((_, index) => (
            <div key={index} className="h-28 bg-gray-200 rounded-md mb-2"></div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          게시글이 없습니다.
        </div>
      ) : (
        posts.map((post: Post) => {
          const imageUrl = extractFirstImageUrl(post.content);
          const plainTextContent = removeMarkdown(
            post.content.replace(/!\[.*?\]\(.*?\)/g, "")
          );
          return (
            <Link
              key={post.idx}
              href={`${basePath}/${post.idx}`}
              className="block mb-4 p-4 bg-gray-100 rounded hover:bg-gray-200"
            >
              <div className="flex">
                <div className="flex-1 flex flex-col min-h-24">
                  <h2 className="text-lg font-semibold line-clamp-1 break-al">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-1 break-all">
                    {plainTextContent}
                  </p>
                  <div className="flex flex-row items-center gap-1 mt-auto text-xs text-gray-500 flex-nowrap">
                    <span className="truncate max-w-[50%]">
                      {post.user?.nickname ?? post.nickname}
                    </span>
                    {!post.user && post.ip ? (
                      <span className="text-gray-400 flex-shrink-0">
                        ({post.ip})
                      </span>
                    ) : null}
                    <span className="mx-1 border-l border-gray-400 flex-shrink-0 h-4"></span>
                    <span className="sm:hidden flex-shrink-0">
                      {formatDistanceToNowStrict(new Date(post.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                    <span className="hidden sm:inline flex-shrink-0">
                      {new Date(post.created_at).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Seoul",
                      })}
                    </span>
                    <span className="mx-1 border-l border-gray-400 flex-shrink-0 h-4" />
                    <div className="flex items-center [color:rgb(35,181,180)] flex-shrink-0">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span className="ml-1">{post._count.comment}</span>
                    </div>
                  </div>
                </div>
                {imageUrl && (
                  <div className="ml-4 w-24 h-24 flex-shrink-0 flex items-end">
                    <img
                      src={imageUrl}
                      alt="게시글 이미지"
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                )}
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
