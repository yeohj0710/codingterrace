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
    const { title, message, url } = await request.json();
    const subscriptions = await db.subscription.findMany();
    const payload = JSON.stringify({
      title,
      message,
      url,
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
      } catch (error: any) {
        if (error.statusCode === 410) {
          console.log(
            "다음의 subscription이 만료되었거나 해지되어 삭제합니다:",
            subscription.endpoint
          );
          await db.subscription.delete({
            where: { endpoint: subscription.endpoint },
          });
        } else {
          console.error(
            "다음의 endpoint로 알림을 발송하는 데 실패하였습니다:",
            subscription.endpoint,
            error
          );
        }
      }
    });
    await Promise.all(notificationPromises);
    return new Response(JSON.stringify({ message: "Notification sent" }), {
      status: 200,
    });
  } catch (error) {
    console.error("알림 발송 중 에러가 발생하였습니다:", error);
    return NextResponse.json(
      { error: "알림 발송 중 에러 발생" },
      { status: 500 }
    );
  }
}
