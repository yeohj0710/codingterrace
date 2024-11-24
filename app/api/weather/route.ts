import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import webpush from "web-push";
import { deleteSubscription } from "@/lib/subscription";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_KEY as string,
  process.env.PRIVATE_VAPID_KEY as string
);

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const pythonApiUrl = process.env.PYTHON_API_SERVER_URL;
    if (!pythonApiUrl) {
      return NextResponse.json(
        { error: "PYTHON_API_SERVER_URL not set" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");

    if (latitude && longitude) {
      const response = await fetch(
        `${pythonApiUrl}/weather?latitude=${latitude}&longitude=${longitude}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch weather data`);
        return NextResponse.json(
          { error: "Failed to fetch weather data" },
          { status: 500 }
        );
      }

      const data = await response.text();
      const weatherMessage = data || "날씨 데이터를 가져올 수 없습니다.";

      return NextResponse.json(
        { message: weatherMessage },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    } else {
      const subscriptions = await db.subscription.findMany({
        where: { type: "weather" },
      });

      if (subscriptions.length === 0) {
        return NextResponse.json({
          message: "No weather subscriptions found.",
        });
      }

      const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      const notificationPromises = subscriptions.map(async (subscription) => {
        let { latitude, longitude } = subscription;
        if (
          latitude === null ||
          longitude === null ||
          latitude === undefined ||
          longitude === undefined
        ) {
          // 기본값: 서울의 위도와 경도
          latitude = 37.5665;
          longitude = 126.978;
        }

        const response = await fetch(
          `${pythonApiUrl}/weather?latitude=${latitude}&longitude=${longitude}`,
          {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (!response.ok) {
          console.error(
            `Failed to fetch weather data for subscription ${subscription.id}`
          );
          return;
        }

        const data = await response.text();
        const weatherMessage = data || "날씨 데이터를 가져올 수 없습니다.";

        const weatherTitle = weatherMessage.includes("비")
          ? "오늘의 날씨 🌧️"
          : weatherMessage.includes("눈")
          ? "오늘의 날씨 ❄️"
          : "오늘의 날씨 ☀️";

        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        const payload = JSON.stringify({
          title: weatherTitle,
          message: weatherMessage,
          url: baseUrl + "/python",
        });

        try {
          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(
              "Subscription expired or invalid, removing from database:",
              subscription.endpoint
            );
            await deleteSubscription(
              subscription.endpoint,
              subscription.type,
              subscription.postId
            );
          } else {
            console.error(
              "Failed to send notification to:",
              subscription.endpoint,
              error
            );
          }
        }
      });

      await Promise.all(notificationPromises);
      return NextResponse.json(
        { message: "날씨 알림 발송 완료" },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("날씨 알림 발송 중 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
