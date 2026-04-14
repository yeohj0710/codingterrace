import db from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { deleteSubscription } from "@/lib/subscription";
import { NextResponse } from "next/server";
import { z } from "zod";

const unsubscribeSchema = z.object({
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
  const rateLimit = checkRateLimit(`unsubscribe:${getClientIp(request)}`, {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many unsubscribe requests." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse({
      ...body,
      postId: body.postId ?? null,
      commentId: body.commentId ?? null,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    await deleteSubscription(
      parsed.data.endpoint,
      parsed.data.type,
      parsed.data.postId ?? null,
      parsed.data.commentId ?? null
    );

    const remainingSubscriptions = await db.subscription.count({
      where: {
        endpoint: parsed.data.endpoint,
      },
    });

    return NextResponse.json({
      message: "Subscription removed.",
      hasOtherSubscriptions: remainingSubscriptions > 0,
    });
  } catch (error) {
    console.error("Error removing subscription:", error);
    return NextResponse.json(
      { error: "Error removing subscription." },
      { status: 500 }
    );
  }
}
