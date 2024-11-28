import db from "@/lib/db";
import { deleteSubscription } from "@/lib/subscription";
import { stripMarkdown } from "@/lib/utils";
import { NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_KEY as string,
  process.env.PRIVATE_VAPID_KEY as string
);

async function handleExpiredSubscription(
  endpoint: string,
  type: string,
  commentId?: number
) {
  console.log("subscription이 만료되어 삭제합니다:", endpoint);
  try {
    if (commentId === undefined) {
      console.error("commentId가 undefined입니다. 삭제 작업을 건너뜁니다.");
      return;
    }
    await deleteSubscription(endpoint, type, null, commentId);
    console.log("subscription 삭제 완료:", endpoint);
  } catch (error) {
    console.error("subscription 삭제 중 에러 발생:", error);
  }
}

export async function POST(request: Request) {
  try {
    const { commentId, title, message, url } = await request.json();
    const strippedMessage = stripMarkdown(message);
    if (!commentId || !title || !message || !url) {
      return NextResponse.json(
        { error: "commentId, title, message, url 중 일부가 누락되었습니다." },
        { status: 400 }
      );
    }
    const subscription = await db.subscription.findFirst({
      where: {
        commentId: Number(commentId),
        type: "commentAuthor",
      },
    });
    if (!subscription) {
      return NextResponse.json(
        { error: "Comment author subscription not found" },
        { status: 404 }
      );
    }
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };
    const payload = JSON.stringify({
      title,
      message: strippedMessage,
      url,
    });
    try {
      await webpush.sendNotification(pushSubscription, payload);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Send Notification Error:", error);
      if (error.statusCode === 410) {
        await handleExpiredSubscription(
          subscription.endpoint,
          "commentAuthor",
          subscription.commentId ?? undefined
        );
        return NextResponse.json(
          { error: "Subscription expired and removed" },
          { status: 410 }
        );
      } else {
        console.error("알림 전송 실패: ", error);
        return NextResponse.json({ error: "알림 전송 실패" }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("notify-comment-author에서 에러 발생:", error);
    return NextResponse.json(
      { error: "notify-comment-author에서 에러 발생" },
      { status: 500 }
    );
  }
}