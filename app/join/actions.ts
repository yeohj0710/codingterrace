"use server";

import { z } from "zod";
import { ID_MIN_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/constants";
import db from "@/lib/db";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import getSession from "@/lib/session";

const formSchema = z
  .object({
    id: z.string().min(ID_MIN_LENGTH, "아이디는 3글자 이상이어야 합니다."),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, "비밀번호는 3글자 이상이어야 합니다."),
    confirm_password: z.string(),
    nickname: z
      .string({
        invalid_type_error: "닉네임은 문자열 형식이어야 합니다.",
        required_error: "닉네임을 입력해 주세요.",
      })
      .min(1, "닉네임은 1글자 이상이어야 합니다.")
      .max(12, "닉네임은 12글자 이하여야 합니다.")
      .trim(),
  })
  .superRefine(async ({ id }, ctx) => {
    const user = await db.user.findUnique({
      where: {
        id,
      },
      select: {
        idx: true,
      },
    });
    if (user) {
      ctx.addIssue({
        code: "custom",
        message: "이미 사용 중인 아이디입니다.",
        path: ["id"],
        fatal: true,
      });
      return z.NEVER;
    }
  })
  .superRefine(({ password, confirm_password }, ctx) => {
    if (password !== confirm_password) {
      ctx.addIssue({
        code: "custom",
        message: "비밀번호가 일치하지 않습니다.",
        path: ["confirm_password"],
        fatal: true,
      });
      return z.NEVER;
    }
  })
  .superRefine(async ({ nickname }, ctx) => {
    const user = await db.user.findUnique({
      where: {
        nickname,
      },
      select: {
        idx: true,
      },
    });
    if (user) {
      ctx.addIssue({
        code: "custom",
        message: "이미 사용 중인 닉네임입니다.",
        path: ["nickname"],
        fatal: true,
      });
      return z.NEVER;
    }
  });

export async function join(prevState: any, formData: FormData) {
  const data = {
    id: formData.get("id"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
    nickname: formData.get("nickname"),
  };
  const result = await formSchema.safeParseAsync(data);
  if (!result.success) {
    return result.error.flatten();
  } else {
    const hashedPassword = await bcrypt.hash(result.data.password, 12);
    const user = await db.user.create({
      data: {
        id: result.data.id,
        password: hashedPassword,
        nickname: result.data.nickname,
      },
      select: {
        idx: true,
      },
    });
    const session = await getSession();
    session.idx = user.idx;
    await session.save();
    redirect("/");
  }
}
