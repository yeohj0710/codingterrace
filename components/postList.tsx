"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PostPagination from "@/components/postPagination";
import removeMarkdown from "remove-markdown";
import { formatDistanceToNowStrict } from "date-fns";
import { ko } from "date-fns/locale";
import { getPosts, searchPosts } from "@/lib/post";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { postCache } from "@/lib/cache";

interface Post {
  idx: number;
  category: string;
  title: string;
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
    avatar: string | null;
    created_at: Date;
    updated_at: Date;
  } | null;
}

interface PostListProps {
  category?: string;
  query?: string;
  basePath?: string;
  postsPerPage: number;
  refreshKey: number;
  setIsRefreshing: (isRefreshing: boolean) => void;
  onPostCountChange?: (count: number) => void;
}

export default function PostList({
  category,
  query,
  basePath,
  postsPerPage,
  refreshKey,
  setIsRefreshing,
  onPostCountChange,
}: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setIsRefreshing(true);
      let result;
      if (query) {
        const cacheKey = `search_${query}_${currentPage}`;
        if (postCache[cacheKey] && refreshKey === 0) {
          setPosts(postCache[cacheKey].posts);
          setTotalPages(postCache[cacheKey].totalPages);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
        result = await searchPosts(query, currentPage, postsPerPage);
        postCache[cacheKey] = {
          posts: result.posts,
          totalPages: Math.ceil(result.totalPosts / postsPerPage),
        };
      } else if (category) {
        const cacheKey = `${category}_${currentPage}`;
        if (postCache[cacheKey] && refreshKey === 0) {
          setPosts(postCache[cacheKey].posts);
          setTotalPages(postCache[cacheKey].totalPages);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
        result = await getPosts(category, currentPage, postsPerPage);
        postCache[cacheKey] = {
          posts: result.posts,
          totalPages: Math.ceil(result.totalPosts / postsPerPage),
        };
      } else {
        setPosts([]);
        setTotalPages(0);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      setPosts(result.posts);
      setTotalPages(Math.ceil(result.totalPosts / postsPerPage));
      if (onPostCountChange) {
        onPostCountChange(result.totalPosts);
      }
      setLoading(false);
      setIsRefreshing(false);
    };
    fetchData();
  }, [category, query, currentPage, refreshKey, postsPerPage, setIsRefreshing]);
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  function extractFirstThumbnail(content: string): string | null {
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    const youtubeRegex =
      /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:[^\/\n\s]*\/\S+\/|(?:v|e(?:mbed)?)\/?(\S+)|.*[?&]v=([^"&?\/\s]{11}))|youtu\.be\/([^"&?\/\s]{11}))/g;
    const images: { url: string; index: number }[] = [];
    const youtubeThumbnails: { url: string; index: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = imageRegex.exec(content)) !== null) {
      images.push({
        url: match[1].replace("/public", "/avatar"),
        index: match.index,
      });
    }
    while ((match = youtubeRegex.exec(content)) !== null) {
      const matchGroups = [match[1], match[2], match[3]].filter(Boolean);
      const videoId = matchGroups[0];
      if (videoId) {
        youtubeThumbnails.push({
          url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          index: match.index,
        });
      }
    }
    const firstImage = images.length > 0 ? images[0] : null;
    const firstYoutubeThumbnail =
      youtubeThumbnails.length > 0 ? youtubeThumbnails[0] : null;
    if (firstImage && firstYoutubeThumbnail) {
      return firstImage.index < firstYoutubeThumbnail.index
        ? firstImage.url
        : firstYoutubeThumbnail.url;
    }
    return firstImage?.url || firstYoutubeThumbnail?.url || null;
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
          {query ? "검색 결과가 없습니다." : "게시글이 없습니다."}
        </div>
      ) : (
        posts.map((post: Post) => {
          const imageUrl = extractFirstThumbnail(post.content);
          const plainTextContent = removeMarkdown(
            post.content.replace(/!\[.*?\]\(.*?\)/g, "")
          );
          const postLink = query
            ? `/${post.category}/${post.idx}`
            : `${basePath}/${post.idx}`;
          return (
            <Link
              key={post.idx}
              href={postLink}
              className="block mb-4 p-4 bg-gray-100 rounded hover:bg-gray-200"
            >
              <div className="flex">
                <div className="flex flex-col flex-1 min-h-24">
                  <h2 className="text-lg font-semibold line-clamp-1 break-all">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-1 break-all">
                    {plainTextContent}
                  </p>
                  <div className="flex flex-row items-center gap-2 mt-auto text-xs text-gray-500 flex-nowrap overflow-hidden">
                    <TruncatedNickname
                      nickname={post.user?.nickname ?? post.nickname ?? ""}
                      avatarUrl={post.user?.avatar ?? null}
                    />
                    {!post.user && post.ip ? (
                      <span className="text-gray-400 flex-shrink-0 -ml-1.5">
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
                  <div className="w-24 h-24 flex-shrink-0 flex items-end">
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
      {totalPages > 1 && (
        <PostPagination
          currentPage={currentPage}
          totalPages={totalPages}
          paginate={paginate}
        />
      )}
    </div>
  );
}

function TruncatedNickname({
  nickname,
  avatarUrl,
}: {
  nickname: string;
  avatarUrl?: string | null;
}) {
  const nicknameRef = useRef<HTMLSpanElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  useEffect(() => {
    if (nicknameRef.current) {
      const isOverflowing =
        nicknameRef.current.scrollWidth > nicknameRef.current.clientWidth;
      setIsTruncated(isOverflowing);
    }
  }, [nickname]);
  return (
    <span
      ref={nicknameRef}
      className={`truncate max-w-[70%] overflow-hidden text-ellipsis ${
        isTruncated ? "-mr-4 sm:mr-0" : ""
      }`}
    >
      {avatarUrl && (
        <img
          src={avatarUrl.replace("/public", "/avatar")}
          alt={`${nickname}의 프로필 이미지`}
          className="w-5 h-5 rounded-full object-cover inline-block mr-1.5"
        />
      )}
      {nickname}
    </span>
  );
}
