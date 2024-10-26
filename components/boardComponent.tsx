"use client";

import Link from "next/link";
import PostList from "@/components/postList";
import { useState, useEffect } from "react";
import { isUserOperator } from "@/lib/auth";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface BoardProps {
  category: string;
  title: string;
  basePath: string;
  postsPerPage: number;
}

export default function BoardComponent({
  category,
  title,
  basePath,
  postsPerPage,
}: BoardProps) {
  const [isOperator, setIsOperator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const canWrite = category !== "technote" || isOperator;
  useEffect(() => {
    const checkUserOperator = async () => {
      const isOp = await isUserOperator();
      setIsOperator(isOp);
    };
    checkUserOperator();
  }, []);
  return (
    <div className="w-full sm:w-[640px] xl:w-1/2 px-5 py-7 bg-white sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
      <div className="flex flex-row gap-[2%] justify-between mb-6 items-center">
        <div className="flex items-center">
          <Link href={basePath} className="font-bold text-xl">
            {title}
          </Link>
          <button
            onClick={() => {
              setRefreshKey((prev) => prev + 1);
            }}
            className={`ml-2 ${isRefreshing ? "animate-spin" : ""}`}
          >
            <ArrowPathIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {canWrite && (
          <Link
            href={`${basePath}/new`}
            className="bg-green-400 px-3 py-1 rounded-md hover:bg-green-500"
          >
            <span className="text-sm font-semibold text-white">글쓰기</span>
          </Link>
        )}
      </div>
      {category === "board" && (
        <span className="text-xs text-gray-400 block -mt-3 mb-3 ml-1">
          * 부적절한 게시글은 임의로 삭제될 수 있습니다.
        </span>
      )}
      <PostList
        category={category}
        basePath={basePath}
        postsPerPage={postsPerPage}
        refreshKey={refreshKey}
        setIsRefreshing={setIsRefreshing}
      />
    </div>
  );
}
