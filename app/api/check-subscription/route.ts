import { findSubscription } from "@/lib/subscription";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { NextResponse } from "next/server";
import { z } from "zod";

const subscriptionLookupSchema = z.object({
  endpoint: z.string().url().max(2048),
  type: z.enum([
    "main",
    "board",
    "technote",
    "weather",
    "postAuthor",
    "commentAuthor",
  ]),
  postId: z.number().int().positive().nullable().optional(),
  commentId: z.number().int().positive().nullable().optional(),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`check-subscription:${getClientIp(request)}`, {
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many subscription checks." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = subscriptionLookupSchema.safeParse({
      ...body,
      postId: body.postId ?? null,
      commentId: body.commentId ?? null,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid subscription lookup payload." },
        { status: 400 }
      );
    }

    const subscription = await findSubscription(
      parsed.data.endpoint,
      parsed.data.type,
      parsed.data.postId ?? null,
      parsed.data.commentId ?? null
    );

    return NextResponse.json({ exists: Boolean(subscription) });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Error checking subscription." },
      { status: 500 }
    );
  }
}
