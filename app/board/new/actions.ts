"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요."),
  content: z.string().min(1, "내용을 입력해 주세요."),
  category: z.string(),
  password: z.string(),
});

export async function uploadPost(formData: FormData) {
  const data = {
    title: formData.get("title"),
    category: formData.get("category"),
    password: formData.get("password"),
    content: formData.get("content"),
  };
  const result = postSchema.safeParse(data);
  if (!result.success) {
    return result.error.flatten();
  }
  const session = await getSession();
  if (!session.idx) return;
  const post = await db.post.create({
    data: {
      title: result.data?.title,
      category: result.data?.category,
      password: result.data?.password,
      content: result.data?.content,
      user: {
        connect: {
          idx: session.idx,
        },
      },
    },
    select: {
      idx: true,
    },
  });
  redirect(`/board/${post.idx}`);
}
