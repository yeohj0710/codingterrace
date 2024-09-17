import Link from "next/link";
import { getPosts } from "./actions";
import PostList from "@/components/postList";

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
        <PostList posts={posts} />
      </div>
    </div>
  );
}
