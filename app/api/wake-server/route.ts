import { isAuthorizedOperatorRequest } from "@/lib/security";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!(await isAuthorizedOperatorRequest(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const pythonApiUrl = process.env.PYTHON_API_SERVER_URL;

    if (!pythonApiUrl) {
      return NextResponse.json(
        { error: "Python API is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(`${pythonApiUrl}/weather`, {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    return NextResponse.json({
      message: response.ok
        ? "Python weather service responded."
        : "Python weather service did not respond successfully.",
    });
  } catch (error) {
    console.error("Failed to wake the Python API server:", error);
    return NextResponse.json(
      { error: "Failed to wake the Python API server." },
      { status: 500 }
    );
  }
}
