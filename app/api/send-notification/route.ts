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
    const { title, message } = await request.json(); // 클라이언트에서 보낸 제목과 메시지를 추출
    const subscriptions = await db.subscription.findMany(); // 구독된 모든 사용자 가져오기

    const payload = JSON.stringify({
      title,
      message,
    });

    const notificationPromises = subscriptions.map(async (subscription) => {
      const { endpoint, p256dh, auth } = subscription;

      const pushSubscription = {
        endpoint,
        keys: {
          p256dh,
          auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error) {
        console.error("Error sending notification to:", endpoint, error);
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      message: "Notification sent to all subscribers",
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Error sending notification" },
      { status: 500 }
    );
  }
}
