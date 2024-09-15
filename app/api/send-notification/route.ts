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
    const { title, message } = await request.json();
    const subscriptions = await db.subscription.findMany();
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
            "Error sending notification to:",
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
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Error sending notification" },
      { status: 500 }
    );
  }
}
