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

    const response = await fetch(`${pythonApiUrl}/hello`, { method: "GET" });
    if (!response.ok) {
      throw new Error("Failed to fetch data from Python API");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
