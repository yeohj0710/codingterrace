"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formatIp } from "./utils";
import { postSchema } from "./schema";

export async function getPosts(
  category: string,
  page: number = 1,
  pageSize: number = 10
) {
  const skip = (page - 1) * pageSize;
  const posts = await db.post.findMany({
    where: { category },
    select: {
      idx: true,
      user: true,
      nickname: true,
      ip: true,
      category: true,
      title: true,
      content: true,
      created_at: true,
      _count: {
        select: { comment: true },
      },
    },
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

export async function getPost(idx: number, category: string) {
  const post = await db.post.findUnique({
    where: {
      idx,
    },
    select: {
      idx: true,
      nickname: true,
      ip: true,
      password: true,
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
    },
  });
  if (post && post.category !== category) {
    return null;
  }
  return post;
}

export async function uploadPost(
  category: string,
  basePath: string,
  formData: FormData
) {
  const data = {
    title: formData.get("title"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
    content: formData.get("content"),
  };
  const result = postSchema.safeParse(data);
  if (!result.success) {
    return result.error.flatten();
  }
  const session = await getSession();
  let postData: any = {
    title: result.data.title,
    content: result.data.content,
    category: category,
  };
  if (session?.idx) {
    postData.user = {
      connect: {
        idx: session.idx,
      },
    };
  } else {
    const header = headers();
    const ip = header.get("x-forwarded-for");
    const formattedIp = formatIp(ip);
    postData = {
      ...postData,
      nickname: result.data.nickname || "익명",
      ip: formattedIp,
      password: result.data.password || "",
    };
  }
  const post = await db.post.create({
    data: postData,
    select: {
      idx: true,
    },
  });
  redirect(`${basePath}/${post.idx}`);
}

export async function updatePost(formData: FormData) {
  const data = {
    idx: formData.get("idx"),
    title: formData.get("title"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
    content: formData.get("content"),
  };
  const idx = Number(data.idx);
  if (isNaN(idx)) {
    return { error: "잘못된 게시글 번호입니다." };
  }
  const session = await getSession();
  const post = await db.post.findUnique({
    where: { idx },
    include: { user: true },
  });
  if (!post) {
    return { error: "게시글을 찾을 수 없습니다." };
  }
  if (post.user && (!session?.idx || session.idx !== post.user.idx)) {
    return { error: "잘못된 접근입니다." };
  }
  let updateData: any = {
    title: data.title,
    content: data.content,
    updated_at: new Date(),
  };
  if (!post.user) {
    updateData.nickname = data.nickname || "익명";
    updateData.password = data.password;
  }
  await db.post.update({
    where: { idx },
    data: updateData,
  });
  redirect(`/board/${idx}`);
}

export async function deletePost(idx: number) {
  try {
    await db.post.delete({
      where: {
        idx: idx,
      },
    });
  } catch (error) {
    console.error("게시글 삭제에 실패했습니다:", error);
  }
}
