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

export async function uploadPost(_: any, formData: FormData) {
  const data = {
    title: formData.get("title"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
    content: formData.get("content"),
  };
  const imageUrls = formData.getAll("images[]") as string[];
  console.log("Image URLs to Save:", imageUrls);
  const result = postSchema.safeParse(data);
  if (!result.success) {
    return result.error.flatten();
  }
  const session = await getSession();
  let postData: any = {
    title: result.data.title,
    content: result.data.content,
    category: "board",
    images: {
      create: imageUrls.map((url, index) => ({
        url: url,
        position: index,
      })),
    },
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
  console.log("Post Data to Save:", postData);
  const post = await db.post.create({
    data: postData,
    select: {
      idx: true,
    },
  });
  redirect(`/board/${post.idx}`);
}

export async function getUploadUrl() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
      },
    }
  );
  const data = await response.json();
  console.log("Cloudflare API Response:", response, data);
  return data;
}
