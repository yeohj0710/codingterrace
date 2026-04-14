import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/requestGuard";
import { NextRequest, NextResponse } from "next/server";

type PathRule = {
  prefix: string;
  scope: string;
  limit: number;
  windowMs: number;
  methods?: string[];
};

const API_METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
const STATIC_FILE_PATTERN =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webp|woff|woff2|xml)$/i;
const MAX_PATH_LENGTH = 512;
const MAX_QUERY_LENGTH = 2048;

const PATH_RULES: PathRule[] = [
  {
    prefix: "/api/autocomplete",
    scope: "mw-autocomplete",
    limit: 30,
    windowMs: 60 * 1000,
  },
  {
    prefix: "/api/yahoo",
    scope: "mw-yahoo",
    limit: 30,
    windowMs: 60 * 1000,
  },
  {
    prefix: "/api/weather",
    scope: "mw-weather",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  },
  {
    prefix: "/api/send-notification",
    scope: "mw-send-notification",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  },
  {
    prefix: "/api/notify-post-author",
    scope: "mw-notify-post-author",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  },
  {
    prefix: "/api/notify-comment-author",
    scope: "mw-notify-comment-author",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  },
  {
    prefix: "/api/save-subscription",
    scope: "mw-save-subscription",
    limit: 30,
    windowMs: 60 * 60 * 1000,
  },
  {
    prefix: "/api/check-subscription",
    scope: "mw-check-subscription",
    limit: 120,
    windowMs: 60 * 60 * 1000,
  },
  {
    prefix: "/api/unsubscribe",
    scope: "mw-unsubscribe",
    limit: 30,
    windowMs: 60 * 60 * 1000,
  },
  {
    prefix: "/api/hello",
    scope: "mw-hello",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  },
  {
    prefix: "/api/wake-server",
    scope: "mw-wake-server",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  },
  {
    prefix: "/login",
    scope: "mw-login",
    limit: 30,
    windowMs: 10 * 60 * 1000,
    methods: ["POST"],
  },
  {
    prefix: "/join",
    scope: "mw-join",
    limit: 20,
    windowMs: 10 * 60 * 1000,
    methods: ["POST"],
  },
];

function isStaticPath(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    STATIC_FILE_PATTERN.test(pathname)
  );
}

function getMatchingRule(pathname: string, method: string) {
  return PATH_RULES.find(
    (rule) =>
      pathname.startsWith(rule.prefix) &&
      (!rule.methods || rule.methods.includes(method))
  );
}

function rejectionResponse(
  request: NextRequest,
  status: number,
  message: string,
  retryAfterSeconds?: number
) {
  const headers = retryAfterSeconds
    ? getRateLimitHeaders(retryAfterSeconds)
    : { "Cache-Control": "no-store" };

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: message }, { status, headers });
  }

  return new NextResponse(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      ...(retryAfterSeconds
        ? { "Retry-After": String(retryAfterSeconds) }
        : {}),
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") && !API_METHODS.has(request.method)) {
    return rejectionResponse(
      request,
      405,
      "Method not allowed for this endpoint."
    );
  }

  if (pathname.length > MAX_PATH_LENGTH || search.length > MAX_QUERY_LENGTH) {
    return rejectionResponse(
      request,
      414,
      "Request URL is too large to process."
    );
  }

  const clientIp = getClientIp(request);
  const globalRateLimit = checkRateLimit(`mw:global:${clientIp}`, {
    limit: 300,
    windowMs: 60 * 1000,
  });

  if (!globalRateLimit.allowed) {
    return rejectionResponse(
      request,
      429,
      "Too many requests. Please slow down.",
      globalRateLimit.retryAfterSeconds
    );
  }

  const matchingRule = getMatchingRule(pathname, request.method);

  if (matchingRule) {
    const routeRateLimit = checkRateLimit(
      `mw:${matchingRule.scope}:${clientIp}`,
      {
        limit: matchingRule.limit,
        windowMs: matchingRule.windowMs,
      }
    );

    if (!routeRateLimit.allowed) {
      return rejectionResponse(
        request,
        429,
        "Too many requests for this route.",
        routeRateLimit.retryAfterSeconds
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Request-Guard", "active");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
