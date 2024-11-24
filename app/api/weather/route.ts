import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/notification";

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
    const response = await fetch(`${pythonApiUrl}/weather`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch data from Python API");
    }
    const data = await response.text();
    const weatherMessage = data || "날씨 데이터가 존재하지 않습니다.";
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    await sendNotification(
      "오늘의 날씨",
      weatherMessage,
      "weather",
      "/python",
      baseUrl
    );
    return NextResponse.json(
      { message: "알림을 발송하고 있어요. 곧 알림이 도착할 거예요." },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
