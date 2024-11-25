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
    fetch(`${pythonApiUrl}/wake-up`, { method: "GET" })
      .then(() => console.log("서버 깨우기 요청 전송 완료"))
      .catch((err) => console.error("서버 깨우기 요청 실패:", err));
    return NextResponse.json(
      { message: "Wake-up request sent" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("서버 깨우기 중 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
