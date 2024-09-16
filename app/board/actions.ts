import db from "@/lib/db";

export async function getPosts() {
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
    take: 5,
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
