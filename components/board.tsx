"use client";

import Link from "next/link";
import PostList from "@/components/postList";

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

export default function Board() {
  return (
    <div className="w-full sm:w-[640px] lg:w-1/2 px-5 py-7 bg-white sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
      <div className="flex flex-row gap-[2%] mb-6 justify-between">
        <Link href="/board" className="font-bold text-xl">
          자유게시판
        </Link>
        <Link
          href="/board/new"
          className="bg-green-400 px-3 py-1 rounded-md hover:bg-green-500"
        >
          <span className="text-sm font-semibold text-white">글쓰기</span>
        </Link>
      </div>
      <PostList />
    </div>
  );
}
