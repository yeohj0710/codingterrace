import db from "@/lib/db";
import Link from "next/link";

async function getPosts() {
  const posts = await db.post.findMany({
    select: {
      idx: true,
      user: true,
      nickname: true,
      ip: true,
      category: true,
      title: true,
      content: true,
      created_at: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
  const processedPosts = posts.map((post) => {
    if (post.user) {
      return post;
    } else {
      return {
        ...post,
        nickname: post.nickname ?? "",
        ip: post.ip ?? "",
      };
    }
  });
  return processedPosts;
}

export default async function Board() {
  const posts = await getPosts();
  return (
    <div className="flex flex-col items-center mt-3 md:mt-6 md:mb-10">
      <div className="flex flex-col w-full sm:w-[640px] lg:w-1/2 bg-white md:pt-8 p-6 gap-3 shadow-md rounded-lg">
        <div className="flex flex-row items-center justify-between w-full">
          <span className="text-2xl font-bold text-gray-800">자유게시판</span>
          <Link href="/board/new">
            <button className="px-4 py-2 bg-green-400 text-white rounded-md hover:bg-green-500">
              글쓰기
            </button>
          </Link>
        </div>
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
        ))}
      </div>
    </div>
  );
}
