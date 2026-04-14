import { sendPushNotification } from "@/lib/push";
import {
  checkRateLimit,
  getClientIp,
  isAuthorizedOperatorRequest,
} from "@/lib/security";
import { NextResponse } from "next/server";
import { z } from "zod";

const notificationSchema = z.object({
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(500),
  url: z.string().trim().min(1).max(2048),
  type: z.enum(["main", "board", "technote"]),
  postId: z.number().int().positive().nullable().optional(),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`notify:${getClientIp(request)}`, {
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
    const parsed = notificationSchema.safeParse({
      ...body,
      postId: body.postId ?? null,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid notification payload." },
        { status: 400 }
      );
    }

    await sendPushNotification({
      type: parsed.data.type,
      postId: parsed.data.postId ?? null,
      title: parsed.data.title,
      message: parsed.data.message,
      url: parsed.data.url,
    });

    return NextResponse.json({ message: "Notification sent." });
  } catch (error) {
    console.error("Failed to send notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification." },
      { status: 500 }
    );
  }
}
