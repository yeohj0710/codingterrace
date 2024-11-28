import db from "./db";

export const findSubscription = async (
  endpoint: string,
  type: string,
  postId: number | null,
  commentId: number | null
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

export const deleteSubscription = async (
  endpoint: string,
  type: string,
  postId: number | null,
  commentId: number | null
) => {
  return await db.subscription.deleteMany({
    where: {
      endpoint,
      type,
      postId: postId ?? null,
      commentId: commentId ?? null,
    },
  });
};
