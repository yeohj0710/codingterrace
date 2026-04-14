import { z } from "zod";

export const postSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20000),
  nickname: z.string().trim().max(12).optional().nullable(),
  password: z.string().trim().max(128).optional().nullable(),
});
