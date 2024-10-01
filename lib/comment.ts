"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { headers } from "next/headers";
import { formatIp } from "@/lib/utils";

export async function getComments(postIdx: number) {
  const comments = await db.comment.findMany({
    where: { postIdx, parentIdx: null },
    include: {
      user: true,
      replies: {
        include: {
          user: true,
        },
        orderBy: { created_at: "asc" },
      },
    },
    orderBy: { created_at: "asc" },
  });
  return comments;
}

export async function addComment(formData: FormData) {
  const postIdx = Number(formData.get("postIdx"));
  const parentIdx = formData.get("parentIdx")
    ? Number(formData.get("parentIdx"))
    : null;
  const content = formData.get("content") as string;
  const nickname = formData.get("nickname") as string | null;
  const password = formData.get("password") as string | null;
  const session = await getSession();
  let commentData: any = {
    content,
    post: { connect: { idx: postIdx } },
    parent: parentIdx ? { connect: { idx: parentIdx } } : undefined,
  };
  if (session?.idx) {
    commentData.user = { connect: { idx: session.idx } };
  } else {
    const header = headers();
    const ip = header.get("x-forwarded-for");
    const formattedIp = formatIp(ip);
    commentData.nickname = nickname || "익명";
    commentData.password = password || "";
    commentData.ip = formattedIp;
  }
  await db.comment.create({ data: commentData });
}

export async function deleteComment(commentIdx: number, password?: string) {
  const session = await getSession();
  const comment = await db.comment.findUnique({
    where: { idx: commentIdx },
    include: { user: true },
  });
  if (!comment) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }
  if (comment.user) {
    if (session?.idx !== comment.user.idx) {
      throw new Error("댓글을 삭제할 권한이 없습니다.");
    }
  } else {
    if (comment.password && comment.password !== password) {
      throw new Error("비밀번호가 올바르지 않습니다.");
    }
  }
  await db.comment.delete({ where: { idx: commentIdx } });
}

// updateComment 구현 필요
