import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("query");
    if (!q) {
      return NextResponse.json(
        { error: "query parameter required" },
        { status: 400 }
      );
    }

    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      q
    )}&lang=en-US&region=US`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Yahoo search fetch failed:", res.status, await res.text());
      return NextResponse.json(
        { error: "Yahoo search API error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API Route /api/autocomplete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
