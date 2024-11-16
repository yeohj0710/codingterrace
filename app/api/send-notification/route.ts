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
    const { title, message, url, type } = await request.json();
    if (!type) {
      return NextResponse.json(
        { error: "Request에서 category type이 누락되었습니다." },
        { status: 400 }
      );
    }
    const subscriptions = await db.subscription.findMany({
      where: { type: type },
    });
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
            where: {
              endpoint_type: {
                endpoint: subscription.endpoint,
                type: subscription.type,
              },
            },
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
    return new Response(
      JSON.stringify({ message: "알림 발송에 성공하였습니다." }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("알림 발송 중 에러가 발생하였습니다:", error);
    return NextResponse.json(
      { error: "알림 발송 중 에러가 발생하였습니다." },
      { status: 500 }
    );
  }
}
