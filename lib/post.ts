"use server";

import db from "@/lib/db";
import { hashGuestPassword, isHashedPassword, verifyStoredPassword } from "@/lib/password";
import { sendPushNotification } from "@/lib/push";
import { checkRateLimit, getRequestRateLimitKey, isUserOperatorSession } from "@/lib/security";
import getSession from "@/lib/session";
import { publicUserSelect } from "@/lib/selects";
import { postSchema } from "@/lib/schema";
import { categoryToName, formatIp, stripMarkdown } from "@/lib/utils";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const POST_LIST_SELECT = {
  idx: true,
  category: true,
  title: true,
  content: true,
  created_at: true,
  nickname: true,
  ip: true,
  _count: {
    select: { comment: true },
  },
  user: {
    select: publicUserSelect,
  },
};

const POST_DETAIL_SELECT = {
  idx: true,
  nickname: true,
  ip: true,
  password: true,
  category: true,
  title: true,
  content: true,
  created_at: true,
  user: {
    select: publicUserSelect,
  },
};

async function assertWritePermissionForCategory(category: string) {
  if (category === "technote" && !(await isUserOperatorSession())) {
    throw new Error("You do not have permission to modify technical notes.");
  }
}

async function getPostForMutation(idx: number) {
  return db.post.findUnique({
    where: { idx },
    select: {
      idx: true,
      category: true,
      nickname: true,
      password: true,
      user: {
        select: {
          idx: true,
        },
      },
    },
  });
}

async function verifyGuestPostAccess(
  idx: number,
  suppliedPassword: string | null | undefined
) {
  const post = await getPostForMutation(idx);

  if (!post) {
    throw new Error("Post not found.");
  }

  if (post.user) {
    throw new Error("This post must be managed by the account owner.");
  }

  const isValidPassword = await verifyStoredPassword(
    post.password,
    suppliedPassword
  );

  if (!isValidPassword) {
    return false;
  }

  if (post.password && !isHashedPassword(post.password)) {
    await db.post.update({
      where: { idx: post.idx },
      data: {
        password: await hashGuestPassword(suppliedPassword),
      },
    });
  }

  return true;
}

export async function getPosts(
  category: string,
  page: number = 1,
  pageSize: number = 10
) {
  const skip = (page - 1) * pageSize;
  const posts = await db.post.findMany({
    where: { category },
    select: POST_LIST_SELECT,
    orderBy: {
      created_at: "desc",
    },
    skip,
    take: pageSize,
  });
  const totalPosts = await db.post.count({ where: { category } });
  const processedPosts = posts.map((post) => {
    if (post.user) {
      return post;
    }

    return {
      ...post,
      nickname: post.nickname ?? "",
      ip: post.ip ?? "",
    };
  });
  return { posts: processedPosts, totalPosts };
}

export async function getPost(idx: number, category: string) {
  const post = await db.post.findUnique({
    where: {
      idx,
    },
    select: POST_DETAIL_SELECT,
  });

  if (post && post.category !== category) {
    return null;
  }

  if (!post) {
    return null;
  }

  return {
    idx: post.idx,
    nickname: post.nickname,
    ip: post.ip,
    hasPassword: Boolean(post.password),
    category: post.category,
    title: post.title,
    content: post.content,
    created_at: post.created_at,
    user: post.user,
  };
}

export async function verifyPostPassword(idx: number, password: string) {
  return verifyGuestPostAccess(idx, password);
}

export async function uploadPost(
  category: string,
  _basePath: string,
  formData: FormData
) {
  const rateLimit = checkRateLimit(getRequestRateLimitKey(`post-create:${category}`), {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    throw new Error("Too many post submissions. Please try again later.");
  }

  await assertWritePermissionForCategory(category);

  const data = {
    title: formData.get("title"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
    content: formData.get("content"),
  };

  const result = postSchema.safeParse(data);

  if (!result.success) {
    throw new Error("Invalid post input.");
  }

  const session = await getSession();
  let postData: {
    title: string;
    content: string;
    category: string;
    user?: { connect: { idx: number } };
    nickname?: string;
    ip?: string;
    password?: string | null;
  } = {
    title: result.data.title,
    content: result.data.content,
    category,
  };

  if (session.idx) {
    postData.user = {
      connect: {
        idx: session.idx,
      },
    };
  } else {
    const headerStore = headers();
    const ip = headerStore.get("x-forwarded-for");
    postData = {
      ...postData,
      nickname: result.data.nickname || "Anonymous",
      ip: formatIp(ip),
      password: await hashGuestPassword(result.data.password),
    };
  }

  const post = await db.post.create({
    data: postData,
    select: {
      idx: true,
      category: true,
    },
  });

  const strippedContent = stripMarkdown(result.data.content);
  const preview =
    strippedContent.length > 50
      ? `${strippedContent.slice(0, 50)}...`
      : strippedContent;

  try {
    await sendPushNotification({
      type: category,
      title: `${categoryToName(category)}에 새 글이 등록됐어요.`,
      message: `${result.data.title}\n${preview}`,
      url: `/${post.category}/${post.idx}`,
    });
  } catch (error) {
    console.error("Failed to send post notification:", error);
  }

  return post.idx;
}

export async function updatePost(category: string, formData: FormData) {
  const idx = Number(formData.get("idx"));

  if (Number.isNaN(idx) || idx <= 0) {
    throw new Error("Invalid post id.");
  }

  const data = {
    title: formData.get("title"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
    content: formData.get("content"),
    currentPassword: formData.get("currentPassword"),
  };

  const result = postSchema.safeParse(data);

  if (!result.success) {
    throw new Error("Invalid post input.");
  }

  const session = await getSession();
  const post = await getPostForMutation(idx);

  if (!post) {
    throw new Error("Post not found.");
  }

  await assertWritePermissionForCategory(post.category);

  if (post.user) {
    if (!session.idx || session.idx !== post.user.idx) {
      throw new Error("You do not have permission to edit this post.");
    }
  } else {
    const isValidPassword = await verifyGuestPostAccess(
      idx,
      typeof data.currentPassword === "string" ? data.currentPassword : null
    );

    if (!isValidPassword) {
      throw new Error("Invalid post password.");
    }

    if (!result.data.password?.trim()) {
      throw new Error("Guest posts must keep a password.");
    }
  }

  const updateData: {
    title: string;
    content: string;
    updated_at: Date;
    nickname?: string;
    password?: string | null;
  } = {
    title: result.data.title,
    content: result.data.content,
    updated_at: new Date(),
  };

  if (!post.user) {
    updateData.nickname = result.data.nickname || "Anonymous";
    updateData.password = await hashGuestPassword(result.data.password);
  }

  await db.post.update({
    where: { idx },
    data: updateData,
  });

  redirect(`/${post.category}/${idx}`);
}

export async function deletePost(
  idx: number,
  suppliedPassword?: string | null
) {
  const post = await getPostForMutation(idx);

  if (!post) {
    throw new Error("Post not found.");
  }

  await assertWritePermissionForCategory(post.category);

  const session = await getSession();

  if (post.user) {
    if (!session.idx || session.idx !== post.user.idx) {
      throw new Error("You do not have permission to delete this post.");
    }
  } else {
    const isValidPassword = await verifyGuestPostAccess(idx, suppliedPassword);

    if (!isValidPassword) {
      throw new Error("Invalid post password.");
    }
  }

  await db.post.delete({
    where: {
      idx,
    },
  });
}

export async function searchPosts(
  query: string,
  page: number = 1,
  pageSize: number = 10
) {
  const skip = (page - 1) * pageSize;
  const posts = await db.post.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    select: POST_LIST_SELECT,
    orderBy: {
      created_at: "desc",
    },
    skip,
    take: pageSize,
  });
  const totalPosts = await db.post.count({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
  });
  const processedPosts = posts.map((post) => {
    if (post.user) {
      return post;
    }

    return {
      ...post,
      nickname: post.nickname ?? "",
      ip: post.ip ?? "",
    };
  });
  return { posts: processedPosts, totalPosts };
}
