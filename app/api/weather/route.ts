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

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 10,
  delay = 10000
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        throw new Error(`All ${retries} retries failed`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable code");
}

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
      const response = await fetchWithRetry(
        `${pythonApiUrl}/weather?latitude=${latitude}&longitude=${longitude}`,
        { method: "GET", headers: { "Cache-Control": "no-cache" } },
        10,
        10000
      );
      const data = await response.text();
      const weatherMessage = data || "날씨 데이터를 가져올 수 없습니다.";
      return NextResponse.json(
        { message: weatherMessage },
        { headers: { "Cache-Control": "no-store" } }
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
          latitude = 37.5665;
          longitude = 126.978;
        }
        try {
          const response = await fetchWithRetry(
            `${pythonApiUrl}/weather?latitude=${latitude}&longitude=${longitude}`,
            { method: "GET", headers: { "Cache-Control": "no-cache" } },
            10,
            10000
          );
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
            url: baseUrl + "/weather",
          });
          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          console.error(
            `Failed to process subscription ${subscription.id}:`,
            error
          );
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
          }
        }
      });
      await Promise.all(notificationPromises);
      return NextResponse.json(
        { message: "날씨 알림 발송 완료" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  } catch (error: any) {
    console.error("날씨 알림 발송 중 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
