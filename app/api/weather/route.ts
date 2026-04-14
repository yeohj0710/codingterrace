import db from "@/lib/db";
import { getOrSetResponseCache } from "@/lib/responseCache";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  isAuthorizedOperatorRequest,
} from "@/lib/security";
import { deleteSubscription } from "@/lib/subscription";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { z } from "zod";

export const revalidate = 0;

const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;

const weatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

let vapidConfigured = false;

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  const privateKey = process.env.PRIVATE_VAPID_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("Push notification keys are not configured.");
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(
      "mailto:security@codingterrace.com",
      publicKey,
      privateKey
    );
    vapidConfigured = true;
  }
}

async function fetchWithRetry(
  url: string,
  retries = 2,
  delayMs = 1000
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Unreachable");
}

function normalizeCoordinate(value: number) {
  return value.toFixed(2);
}

async function getWeatherMessage(
  pythonApiUrl: string,
  latitude: number,
  longitude: number
) {
  const normalizedLatitude = normalizeCoordinate(latitude);
  const normalizedLongitude = normalizeCoordinate(longitude);

  return getOrSetResponseCache(
    `weather:${normalizedLatitude}:${normalizedLongitude}`,
    WEATHER_CACHE_TTL_MS,
    () =>
      fetchWithRetry(
        `${pythonApiUrl}/weather?latitude=${normalizedLatitude}&longitude=${normalizedLongitude}`
      )
  );
}

function getWeatherTitle(message: string) {
  if (message.includes("비")) {
    return "오늘의 비 소식";
  }

  if (message.includes("눈")) {
    return "오늘의 눈 소식";
  }

  return "오늘의 날씨";
}

export async function GET(req: NextRequest) {
  const pythonApiUrl = process.env.PYTHON_API_SERVER_URL;

  if (!pythonApiUrl) {
    return NextResponse.json(
      { error: "Python API is not configured." },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const hasCoordinates =
      searchParams.has("latitude") && searchParams.has("longitude");

    if (hasCoordinates) {
      const rateLimit = checkRateLimit(`weather-fetch:${getClientIp(req)}`, {
        limit: 20,
        windowMs: 10 * 60 * 1000,
      });

      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: "Too many weather requests." },
          {
            status: 429,
            headers: getRateLimitHeaders(rateLimit.retryAfterSeconds),
          }
        );
      }

      const parsed = weatherQuerySchema.safeParse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid coordinates." },
          { status: 400 }
        );
      }

      const { value: message, hit } = await getWeatherMessage(
        pythonApiUrl,
        parsed.data.latitude,
        parsed.data.longitude
      );

      return NextResponse.json(
        { message: message || "Unable to load the weather data." },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-Data-Cache": hit ? "HIT" : "MISS",
          },
        }
      );
    }

    const rateLimit = checkRateLimit(`weather-broadcast:${getClientIp(req)}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many weather broadcast requests." },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.retryAfterSeconds),
        }
      );
    }

    if (!(await isAuthorizedOperatorRequest(req, { allowCron: true }))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    configureWebPush();

    const subscriptions = await db.subscription.findMany({
      where: { type: "weather" },
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        type: true,
        postId: true,
        commentId: true,
        latitude: true,
        longitude: true,
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        message: "No weather subscriptions found.",
      });
    }

    const weatherPageUrl = new URL("/weather", req.nextUrl.origin).toString();

    await Promise.all(
      subscriptions.map(async (subscription) => {
        const latitude = subscription.latitude ?? 37.5665;
        const longitude = subscription.longitude ?? 126.978;

        try {
          const { value: message } = await getWeatherMessage(
            pythonApiUrl,
            latitude,
            longitude
          );

          const payload = JSON.stringify({
            title: getWeatherTitle(message),
            message: message || "Unable to load the weather data.",
            url: weatherPageUrl,
          });

          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload
          );
        } catch (error: any) {
          console.error(
            `Failed to process weather subscription ${subscription.id}:`,
            error
          );

          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await deleteSubscription(
              subscription.endpoint,
              subscription.type,
              subscription.postId,
              subscription.commentId
            );
          }
        }
      })
    );

    return NextResponse.json(
      { message: "Weather notifications sent." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Weather route failed:", error);
    return NextResponse.json(
      { error: "Weather request failed." },
      { status: 500 }
    );
  }
}
