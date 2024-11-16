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
    const { endpoint, keys, type, postId } = subscription;
    await db.subscription.upsert({
      where: { endpoint_type: { endpoint, type } },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        postId: postId || null,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        type: type ?? "main",
        postId: postId || null,
        created_at: new Date(),
      },
    });
    return NextResponse.json({ message: "subscription이 저장되었습니다." });
  } catch (error) {
    console.error("subscription 저장 과정에서 에러가 발생했습니다:", error);
    return NextResponse.json(
      { error: "subscription 저장 과정에서 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
