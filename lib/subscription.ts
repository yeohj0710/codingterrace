import db from "./db";

export const findSubscription = async (
  endpoint: string,
  type: string,
  postId: number | null = null,
  commentId: number | null = null
) => {
  return await db.subscription.findFirst({
    where: {
      endpoint,
      type,
      postId: postId ?? null,
      commentId: commentId ?? null,
    },
  });
};
