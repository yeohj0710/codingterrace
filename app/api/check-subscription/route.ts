import { NextResponse } from "next/server";
import { findSubscription } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const { endpoint, type, postId } = await request.json();
    if (!endpoint) {
      return NextResponse.json(
        { error: "No endpoint provided" },
        { status: 400 }
      );
    }
    const subscription = await findSubscription(endpoint, type, postId);
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
