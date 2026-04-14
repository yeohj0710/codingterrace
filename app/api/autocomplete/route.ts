import { getOrSetResponseCache } from "@/lib/responseCache";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/security";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const AUTOCOMPLETE_CACHE_TTL_MS = 5 * 60 * 1000;

const autocompleteSchema = z.object({
  query: z.string().trim().min(1).max(80),
});

export async function GET(req: Request) {
  const rateLimit = checkRateLimit(`autocomplete:${getClientIp(req)}`, {
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many autocomplete requests." },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit.retryAfterSeconds),
      }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = autocompleteSchema.safeParse({
      query: searchParams.get("query"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "query parameter is required." },
        { status: 400 }
      );
    }

    const cacheKey = `autocomplete:${parsed.data.query.toLowerCase()}`;
    const { value: data, hit } = await getOrSetResponseCache(
      cacheKey,
      AUTOCOMPLETE_CACHE_TTL_MS,
      async () => {
        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
          parsed.data.query
        )}&lang=en-US&region=US`;

        const res = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
          throw new Error(`Yahoo search fetch failed with status ${res.status}`);
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
    console.error("API Route /api/autocomplete error:", error);
    return NextResponse.json(
      { error: "Failed to fetch autocomplete results." },
      { status: 500 }
    );
  }
}
