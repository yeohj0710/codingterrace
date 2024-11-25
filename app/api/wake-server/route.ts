import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pythonApiUrl = process.env.PYTHON_API_SERVER_URL;
    if (!pythonApiUrl) {
      return NextResponse.json(
        { error: "PYTHON_API_SERVER_URL not set" },
        { status: 500 }
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);
    try {
      await fetch(`${pythonApiUrl}/wake-up`, {
        method: "GET",
        signal: controller.signal,
      });
      console.log("서버 깨우기 요청 전송 완료");
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("서버를 5초 동안 깨운 후 요청을 종료하였습니다.");
      } else {
        console.error("서버 깨우기 요청 실패:", err);
      }
    } finally {
      clearTimeout(timeout);
    }
    return NextResponse.json(
      { message: "Wake-up request sent" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("서버 깨우기 중 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
