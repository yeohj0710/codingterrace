import { sendPushNotification } from "@/lib/push";
import {
  checkRateLimit,
  getClientIp,
  isAuthorizedOperatorRequest,
} from "@/lib/security";
import { NextResponse } from "next/server";
import { z } from "zod";

const notifyPostAuthorSchema = z.object({
  postId: z.number().int().positive(),
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(500),
  url: z.string().trim().min(1).max(2048),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`notify-post-author:${getClientIp(request)}`, {
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many notification requests." },
      { status: 429 }
    );
  }

  if (!(await isAuthorizedOperatorRequest(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = notifyPostAuthorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid notification payload." },
        { status: 400 }
      );
    }

    await sendPushNotification({
      type: "postAuthor",
      postId: parsed.data.postId,
      title: parsed.data.title,
      message: parsed.data.message,
      url: parsed.data.url,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to notify post author:", error);
    return NextResponse.json(
      { error: "Failed to notify post author." },
      { status: 500 }
    );
  }
}
