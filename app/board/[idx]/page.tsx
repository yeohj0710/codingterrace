import db from "@/lib/db";
import getSession from "@/lib/session";
import { categoryToName } from "@/lib/utils";
import { notFound } from "next/navigation";

async function getIsOwner(userIdx: number) {
  const session = await getSession();
  if (!session.idx) {
    return false;
  }
  return session.idx === userIdx;
}

async function getPost(idx: number) {
  const post = await db.post.findUnique({
    where: {
      idx,
    },
    select: {
      idx: true,
      nickname: true,
      ip: true,
      category: true,
      title: true,
      content: true,
      created_at: true,
      user: {
        select: {
          idx: true,
          nickname: true,
        },
      },
      images: true,
    },
  });
  return post;
}

export default async function Post({ params }: { params: { idx: string } }) {
  const idx = Number(params.idx);
  if (isNaN(idx)) {
    return notFound();
  }
  const post = await getPost(idx);
  if (!post) {
    return notFound();
  }
  const isOwner = await getIsOwner(post.user?.idx!);
  return (
    <div className="flex flex-col items-center p-5">
      <div className="flex flex-col w-full sm:w-[640px] lg:w-1/2 pt-8">
        <span className="text-xl font-bold text-gray-800 mt-4">자유게시판</span>
        <hr className="border-gray-300 my-4" />
        <div className="bg-white shadow-md rounded-lg px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">
              {categoryToName(post.category)}
            </span>
            <span className="text-sm text-gray-600">
              작성자: {post.user?.nickname ?? post.nickname}
            </span>
            <span className="text-sm text-gray-600">
              작성일: {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          <hr className="border-gray-300 my-4" />
          <p className="text-md text-gray-800 leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
          {Array.isArray(post.images) && post.images.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.images.map((image) => (
                <img
                  key={image.idx}
                  src={image.url}
                  alt={`image-${image.idx}`}
                  className="w-full h-auto object-cover rounded-lg"
                />
              ))}
            </div>
          )}
          {isOwner && (
            <div className="flex justify-end mt-4">
              <button className="px-4 py-1.5 bg-green-400 text-white rounded-md hover:bg-green-500">
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
