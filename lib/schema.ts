import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요."),
  content: z.string().min(1, "내용을 입력해 주세요."),
  nickname: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
});
