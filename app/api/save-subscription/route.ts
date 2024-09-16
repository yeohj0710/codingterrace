import { NextResponse } from "next/server";
import db from "@/lib/db";

const validateSubscription = (subscription: any) => {
  return (
    subscription &&
    subscription.endpoint &&
    subscription.keys &&
    subscription.keys.p256dh &&
    subscription.keys.auth
  );
};

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    if (!validateSubscription(subscription)) {
      return NextResponse.json(
        { error: "subscription 데이터 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }
    await db.subscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        type: subscription.type ?? "main",
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        type: subscription.type,
        created_at: new Date(),
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
