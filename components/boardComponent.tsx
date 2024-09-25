"use client";

import Link from "next/link";
import PostList from "@/components/postList";

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
  return (
    <div className="w-full sm:w-[640px] xl:w-1/2 px-5 py-7 bg-white sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
      <div className="flex flex-row gap-[2%] mb-6 justify-between">
        <Link href={basePath} className="font-bold text-xl">
          {title}
        </Link>
        <Link
          href={`${basePath}/new`}
          className="bg-green-400 px-3 py-1 rounded-md hover:bg-green-500"
        >
          <span className="text-sm font-semibold text-white">글쓰기</span>
        </Link>
      </div>
      <PostList
        category={category}
        basePath={basePath}
        postsPerPage={postsPerPage}
      />
    </div>
  );
}
