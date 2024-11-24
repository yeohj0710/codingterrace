import db from "./db";

export const findSubscription = async (
  endpoint: string,
  type: string,
  postId: number | null
) => {
  if (postId === null) {
    return await db.subscription.findFirst({
      where: {
        endpoint,
        type,
        postId: null,
      },
    });
  } else {
    return await db.subscription.findUnique({
      where: {
        endpoint_type_postId: {
          endpoint,
          type,
          postId,
        },
      },
    });
  }
};

export const deleteSubscription = async (
  endpoint: string,
  type: string,
  postId: number | null
) => {
  if (postId === null) {
    return await db.subscription.deleteMany({
      where: {
        endpoint,
        type,
        postId: null,
      },
    });
  } else {
    return await db.subscription.delete({
      where: {
        endpoint_type_postId: {
          endpoint,
          type,
          postId,
        },
      },
    });
  }
};
