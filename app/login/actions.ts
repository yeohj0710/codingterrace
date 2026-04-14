"use server";

import db from "@/lib/db";
import { checkRateLimit, getRequestRateLimitKey } from "@/lib/security";
import getSession from "@/lib/session";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { z } from "zod";

const DUMMY_PASSWORD_HASH =
  "$2b$12$wQ4jQ0cAQQ8sM4vztM/ajeSU2Ce279b9Ec/WWEDuJeayQMZT6ZX0m";

const formSchema = z.object({
  id: z.string().trim().min(1, "아이디를 입력해 주세요."),
  password: z.string({
    required_error: "비밀번호를 입력해 주세요.",
  }),
});

export async function login(prevState: any, formData: FormData) {
  const rateLimit = checkRateLimit(getRequestRateLimitKey("login"), {
    limit: 5,
    windowMs: 5 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return {
      fieldErrors: {
        id: [],
        password: ["Too many login attempts. Please try again later."],
      },
    };
  }

  const data = {
    id: formData.get("id"),
    password: formData.get("password"),
  };

  const result = formSchema.safeParse(data);

  if (!result.success) {
    return result.error.flatten();
  }

  const user = await db.user.findUnique({
    where: {
      id: result.data.id,
    },
    select: {
      idx: true,
      password: true,
    },
  });

  const ok = await bcrypt.compare(
    result.data.password,
    user?.password ?? DUMMY_PASSWORD_HASH
  );

  if (!user || !ok) {
    return {
      fieldErrors: {
        id: [],
        password: ["Invalid credentials."],
      },
    };
  }

  const session = await getSession();
  session.idx = user.idx;
  await session.save();
  redirect("/profile");
}
