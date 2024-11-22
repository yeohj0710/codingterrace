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

    const response = await fetch(`${pythonApiUrl}/weather`, { method: "GET" }); // Python API의 /weather 엔드포인트 호출
    if (!response.ok) {
      throw new Error("Failed to fetch data from Python API");
    }

    const data = await response.text(); // Python API는 텍스트 형식으로 반환
    return NextResponse.json({ message: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
