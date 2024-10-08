import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { endpoint, type } = await request.json();
    if (!endpoint) {
      return NextResponse.json(
        { error: "No endpoint provided" },
        { status: 400 }
      );
    }
    const subscription = await db.subscription.findUnique({
      where: { endpoint, type },
    });
    if (subscription) {
      return NextResponse.json({ exists: true });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Error checking subscription" },
      { status: 500 }
    );
  }
}
