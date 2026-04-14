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

    const response = await fetch(`${pythonApiUrl}/hello`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch data from the Python API.");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to call hello endpoint:", error);
    return NextResponse.json(
      { error: "Failed to call the Python API." },
      { status: 500 }
    );
  }
}
