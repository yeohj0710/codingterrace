import { NextResponse } from "next/server";
import webpush from "web-push";
import db from "@/lib/db"; // 데이터베이스 연결 코드

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_KEY as string,
  process.env.PRIVATE_VAPID_KEY as string
);

export async function POST() {
  try {
    const subscriptions = await db.subscription.findMany();

    const payload = JSON.stringify({
      title: "코딩테라스",
      message: "누군가가 코딩테라스의 알림 버튼을 눌렀습니다!",
    });

    const notifications = subscriptions.map(async (subscription) => {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };
      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    });

    await Promise.all(notifications);

    return NextResponse.json({ message: "Notifications sent" });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { error: "Error sending notifications" },
      { status: 500 }
    );
  }
}
