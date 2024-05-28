"use server";

import db from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";

const checkIdExists = async (id: string) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
    select: {
      idx: true,
    },
  });
  return Boolean(user);
};

const formSchema = z.object({
  id: z.string().refine(checkIdExists, "계정이 존재하지 않습니다."),
  password: z.string({
    required_error: "비밀번호를 입력해 주세요.",
  }),
});

export async function login(prevState: any, formData: FormData) {
  const data = {
    id: formData.get("id"),
    password: formData.get("password"),
  };
  const result = await formSchema.safeParseAsync(data);
  if (!result.success) {
    return result.error.flatten();
  } else {
    const user = await db.user.findUnique({
      where: {
        id: result.data.id,
      },
      select: {
        idx: true,
        password: true,
      },
    });
    const ok = await bcrypt.compare(result.data.password, user!.password ?? "");
    if (ok) {
      const session = await getSession();
      session.idx = user!.idx;
      await session.save();
      redirect("/profile");
    } else {
      return {
        fieldErrors: {
          id: [],
          password: ["비밀번호가 올바르지 않습니다."],
        },
      };
    }
  }
}
