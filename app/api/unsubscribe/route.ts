import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { endpoint, type } = await request.json();
    if (!endpoint || !type) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
    await db.subscription.delete({
      where: {
        endpoint_type: {
          endpoint,
          type,
        },
      },
    });
    return NextResponse.json({ message: "Subscription removed" });
  } catch (error) {
    console.error("Error removing subscription:", error);
    return NextResponse.json(
      { error: "Error removing subscription" },
      { status: 500 }
    );
  }
}
