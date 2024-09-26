"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function Redirect(basePath: string) {
  redirect(basePath);
}

export async function getUser() {
  const session = await getSession();
  if (!session.idx) {
    return null;
  }
  return db.user.findUnique({
    where: {
      idx: session.idx,
    },
  });
}

export async function getIsOwner(userIdx: number) {
  const session = await getSession();
  if (!session.idx) {
    return false;
  }
  return session.idx === userIdx;
}

const postSchema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요."),
  content: z.string().min(1, "내용을 입력해 주세요."),
  nickname: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
});

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

export async function deletePost(idx: number) {
  try {
    await db.post.delete({
      where: {
        idx: idx,
      },
    });
  } catch (error) {
    console.error("Failed to delete post:", error);
  }
}

function formatIp(ip: string | null): string {
  if (ip === null) {
    return "192.168";
  }
  const segments = ip.split(":")[0].split(".");
  if (segments.length < 2) {
    return "192.168";
  }
  return segments.slice(0, 2).join(".");
}

export async function getUploadUrl() {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
        },
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to get upload URL:",
        response.status,
        response.statusText,
        errorText
      );
      return { success: false, error: errorText };
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error in getUploadUrl:", error);
    return { success: false, error: error.message };
  }
}
