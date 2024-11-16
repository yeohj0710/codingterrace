import db from "@/lib/db";
import { NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_KEY as string,
  process.env.PRIVATE_VAPID_KEY as string
);

export async function POST(request: Request) {
  try {
    const { postId, title, message, url } = await request.json();
    if (!postId) {
      return NextResponse.json(
        { error: "postId가 누락되었습니다." },
        { status: 400 }
      );
    }
    const subscription = await db.subscription.findFirst({
      where: {
        postId: Number(postId),
        type: "postAuthor",
      },
    });
    if (!subscription) {
      return NextResponse.json(
        { error: "Post author subscription not found" },
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
      message,
      url,
    });
    try {
      await webpush.sendNotification(pushSubscription, payload);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      if (error.statusCode === 410) {
        console.log("구독이 만료되어 삭제합니다: ", subscription.endpoint);
        await db.subscription.delete({
          where: {
            endpoint_type: {
              endpoint: subscription.endpoint,
              type: "postAuthor",
            },
          },
        });
      } else {
        console.error("알림 전송 실패: ", error);
      }
      return NextResponse.json({ error: "알림 전송 실패" }, { status: 500 });
    }
  } catch (error) {
    console.error("notify-post-author에서 에러 발생:", error);
    return NextResponse.json(
      { error: "notify-post-author에서 에러 발생" },
      { status: 500 }
    );
  }
}
