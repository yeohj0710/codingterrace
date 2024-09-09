import db from "@/lib/db";
import Link from "next/link";

async function getPosts() {
  const posts = await db.post.findMany({
    select: {
      idx: true,
      user: true,
      category: true,
      title: true,
      content: true,
      created_at: true,
    },
  });
  return posts;
}

export default async function Board() {
  const posts = await getPosts();
  return (
    <div className="flex flex-col items-center pt-8">
      <div className="flex flex-col w-[640px] lg:w-1/2 bg-white p-5 gap-3 shadow-lg rounded-lg">
        <span className="text-2xl font-bold text-gray-800 mt-4">게시판</span>
        <hr className="border-gray-300 my-4" />
        {posts.map((post) => (
          <Link
            href={`/board/${post.idx}`}
            key={post.idx}
            className="flex flex-col w-full bg-gray-100 p-4 rounded-lg shadow-sm mb-2"
          >
            <span className="text-lg font-semibold text-gray-700">
              {post.title}
            </span>
            <p className="text-sm text-gray-500 mt-2">{post.content}</p>
            <div className="flex justify-between items-center mt-4 text-gray-600 text-xs">
              <span>{post.user.nickname}</span>
              <span>
                {new Date(post.created_at).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
