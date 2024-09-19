"use server";

import db from "@/lib/db";

export async function getPosts(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;
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
    skip,
    take: pageSize,
  });
  const totalPosts = await db.post.count();
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
  return { posts: processedPosts, totalPosts };
}
