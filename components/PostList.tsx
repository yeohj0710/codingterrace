"use client";

import Link from "next/link";

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

export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <div className="w-full bg-white rounded-lg shadow">
      {posts.length > 0 ? (
        posts.map((post: Post) => (
          <Link
            key={post.idx}
            href={`/board/${post.idx}`}
            className="block mb-4 p-4 bg-gray-100 rounded hover:bg-gray-200"
          >
            <h2 className="text-lg font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-600 mt-2">{post.content}</p>
            <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
              <span>{post.nickname || post.user?.nickname}</span>
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
    </div>
  );
}
