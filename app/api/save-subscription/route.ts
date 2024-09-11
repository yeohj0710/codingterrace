import { NextResponse } from "next/server";
import db from "@/lib/db"; // 데이터베이스 연결 코드

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    await db.subscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ message: "Subscription saved" });
  } catch (error) {
    console.error("Error saving subscription:", error);
    return NextResponse.json(
      { error: "Error saving subscription" },
      { status: 500 }
    );
  }
}
