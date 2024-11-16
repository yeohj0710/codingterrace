import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { endpoint, type, postId } = await request.json();
    if (!endpoint || !type) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
    if (postId === null) {
      await db.subscription.deleteMany({
        where: {
          endpoint: endpoint,
          type: type,
          postId: null,
        },
      });
    } else {
      await db.subscription.delete({
        where: {
          endpoint_type_postId: {
            endpoint: endpoint,
            type: type,
            postId: postId,
          },
        },
      });
    }
    const remainingSubscriptions = await db.subscription.findMany({
      where: {
        endpoint: endpoint,
      },
    });
    const hasOtherSubscriptions = remainingSubscriptions.length > 0;
    return NextResponse.json({
      message: "Subscription removed",
      hasOtherSubscriptions,
    });
  } catch (error) {
    console.error("Error removing subscription:", error);
    return NextResponse.json(
      { error: "Error removing subscription" },
      { status: 500 }
    );
  }
}
