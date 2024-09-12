"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

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

const postSchema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요."),
  content: z.string().min(1, "내용을 입력해 주세요."),
  nickname: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
});

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

export async function uploadPost(formData: FormData) {
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
  if (session.idx) {
    const post = await db.post.create({
      data: {
        title: result.data?.title,
        content: result.data?.content,
        category: "board",
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
  } else {
    const header = headers();
    const ip = header.get("x-forwarded-for");
    const formattedIp = formatIp(ip);
    const post = await db.post.create({
      data: {
        title: result.data?.title,
        nickname: result.data?.nickname !== "" ? result.data?.nickname : "익명",
        ip: formattedIp,
        password: result.data?.password ?? "",
        content: result.data?.content,
        category: "board",
      },
      select: {
        idx: true,
      },
    });
    redirect(`/board/${post.idx}`);
  }
}
