import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pythonApiUrl = process.env.PYTHON_API_SERVER_URL;
    if (!pythonApiUrl) {
      return NextResponse.json(
        { error: "PYTHON_API_SERVER_URL 환경 변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);
    let isRequestSuccessful = false;
    let serverResponseMessage: string | null = null;
    try {
      const response = await fetch(`${pythonApiUrl}/weather`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
        signal: controller.signal,
      });
      if (response.ok) {
        isRequestSuccessful = true;
        serverResponseMessage = await response.text();
        console.log(
          "서버가 이미 깨어있어요. 요청에 대한 응답을 성공적으로 받았습니다:",
          serverResponseMessage
        );
      } else {
        console.error("서버 응답 실패:", response.status, response.statusText);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("서버를 5초 동안 깨운 후 요청을 종료하였습니다.");
      } else {
        console.error("서버 깨우기 요청 실패:", err);
      }
    } finally {
      clearTimeout(timeout);
    }
    const message = isRequestSuccessful
      ? "서버가 이미 깨어있어요. 요청에 대한 응답을 성공적으로 받았습니다."
      : "서버를 5초 동안 깨웠습니다. 곧 일어날 예정이에요.";
    return NextResponse.json(
      {
        message,
        response: serverResponseMessage,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("서버 깨우기 중 에러:", error);
    return NextResponse.json(
      { error: "서버 깨우기 중 오류가 발생했습니다.", detail: error.message },
      { status: 500 }
    );
  }
}
