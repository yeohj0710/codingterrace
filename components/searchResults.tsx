"use client";

import PostList from "@/components/postList";
import { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [postCount, setPostCount] = useState(0);
  return (
    <div className="w-full sm:w-[640px] xl:w-1/2 px-5 py-7 bg-white sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
      <div className="flex flex-row gap-[2%] justify-between mb-3 items-center">
        <div className="flex items-center">
          <h1 className="font-bold text-xl ml-0.5">게시글 검색 결과</h1>

          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className={`ml-2 ${isRefreshing ? "animate-spin" : ""}`}
          >
            <ArrowPathIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-5 ml-1">
        <span className="sm:inline hidden">제목 또는 내용에 </span>
        <span className="text-black font-bold">{query}</span>를 포함하는 게시글{" "}
        <span className="text-black font-bold">{postCount}</span>개를 찾았어요.
      </p>
      <PostList
        query={query}
        postsPerPage={6}
        refreshKey={refreshKey}
        setIsRefreshing={setIsRefreshing}
        onPostCountChange={(count) => setPostCount(count)}
      />
    </div>
  );
}
