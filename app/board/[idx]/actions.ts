"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";

export async function Redirect() {
  redirect("/board");
}

export async function getIsOwner(userIdx: number) {
  const session = await getSession();
  if (!session.idx) {
    return false;
  }
  return session.idx === userIdx;
}

export async function getPost(idx: number) {
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
      // 이미지 정보 가져오기 제거
      // images: true,
    },
  });
  return post;
}

export async function deletePost(idx: number) {
  try {
    await db.post.delete({
      where: {
        idx: idx,
      },
    });
    redirect("/board");
  } catch (error) {
    console.error("Failed to delete post:", error);
  }
}
