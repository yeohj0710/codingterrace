"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { headers } from "next/headers";
import { formatIp } from "@/lib/utils";

export async function getComments(postIdx: number) {
  const comments = await db.comment.findMany({
    where: { postIdx },
    include: {
      user: true,
      Comment: {
        include: {
          user: true,
        },
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
  const newComment = await db.comment.create({ data: commentData });
  return newComment;
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

export async function updateComment(formData: FormData) {
  const data = {
    idx: formData.get("idx"),
    content: formData.get("content"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
  };
  const idx = Number(data.idx);
  if (isNaN(idx)) {
    throw new Error("잘못된 댓글 번호입니다.");
  }
  const session = await getSession();
  const comment = await db.comment.findUnique({
    where: { idx },
    include: { user: true },
  });
  if (!comment) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }
  if (comment.user) {
    if (!session?.idx || session.idx !== comment.user.idx) {
      throw new Error("수정 권한이 없습니다.");
    }
  }
  const updateData: any = {
    content: data.content,
    updated_at: new Date(),
  };
  if (!comment.user) {
    updateData.nickname = data.nickname || "익명";
    updateData.password = data.password;
  }
  await db.comment.update({
    where: { idx },
    data: updateData,
  });
}
