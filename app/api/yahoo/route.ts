import { getOrSetResponseCache } from "@/lib/responseCache";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/security";
import { NextResponse } from "next/server";
import { z } from "zod";

const CHART_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_RANGE_SECONDS = 20 * 365 * 24 * 60 * 60;

const yahooSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9.^=_-]+$/),
  period1: z.coerce.number().int().min(0),
  period2: z.coerce.number().int().positive(),
  interval: z.enum(["1d", "1wk", "1mo"]).default("1d"),
});

export async function GET(req: Request) {
  const rateLimit = checkRateLimit(`yahoo:${getClientIp(req)}`, {
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many chart requests." },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit.retryAfterSeconds),
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = yahooSchema.safeParse({
    symbol: searchParams.get("symbol"),
    period1: searchParams.get("period1"),
    period2: searchParams.get("period2"),
    interval: searchParams.get("interval") || "1d",
  });

  if (
    !parsed.success ||
    parsed.data.period2 <= parsed.data.period1 ||
    parsed.data.period2 - parsed.data.period1 > MAX_RANGE_SECONDS
  ) {
    return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
  }

  try {
    const cacheKey = `yahoo:${parsed.data.symbol.toUpperCase()}:${
      parsed.data.period1
    }:${parsed.data.period2}:${parsed.data.interval}`;
    const { value: data, hit } = await getOrSetResponseCache(
      cacheKey,
      CHART_CACHE_TTL_MS,
      async () => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          parsed.data.symbol
        )}?period1=${parsed.data.period1}&period2=${parsed.data.period2}&interval=${
          parsed.data.interval
        }&events=none`;

        const res = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(7000),
        });

        if (!res.ok) {
          throw new Error(
            `Yahoo Finance chart fetch failed with status ${res.status}`
          );
        }

        return res.json();
      }
    );

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Data-Cache": hit ? "HIT" : "MISS",
      },
    });
  } catch (error) {
    console.error("Failed to fetch Yahoo Finance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Yahoo Finance data." },
      { status: 500 }
    );
  }
}
