import { NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_KEY as string,
  process.env.PRIVATE_VAPID_KEY as string
);

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    const payload = JSON.stringify({
      title: "코딩테라스",
      message: "누군가가 코딩테라스의 알림 버튼을 눌렀습니다!",
    });

    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ message: "Notification sent" });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Error sending notification" },
      { status: 500 }
    );
  }
}
