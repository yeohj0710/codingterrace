import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const period1 = searchParams.get("period1");
  const period2 = searchParams.get("period2");
  const interval = searchParams.get("interval") || "1d";

  if (!symbol || !period1 || !period2) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}&events=none`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Yahoo Finance data" },
      { status: 500 }
    );
  }
}
