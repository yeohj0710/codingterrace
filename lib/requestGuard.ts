type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;

const globalForRequestGuard = globalThis as typeof globalThis & {
  __codingTerraceRateLimits?: Map<string, number[]>;
  __codingTerraceRateLimitChecks?: number;
};

const rateLimitStore =
  globalForRequestGuard.__codingTerraceRateLimits ?? new Map<string, number[]>();

if (!globalForRequestGuard.__codingTerraceRateLimits) {
  globalForRequestGuard.__codingTerraceRateLimits = rateLimitStore;
}

function pruneRateLimitStore(now: number) {
  const checks = (globalForRequestGuard.__codingTerraceRateLimitChecks ?? 0) + 1;
  globalForRequestGuard.__codingTerraceRateLimitChecks = checks;

  if (checks % 250 !== 0 && rateLimitStore.size < 5000) {
    return;
  }

  const retentionStart = now - RATE_LIMIT_RETENTION_MS;

  for (const [key, hits] of rateLimitStore.entries()) {
    const recentHits = hits.filter((timestamp) => timestamp > retentionStart);

    if (recentHits.length === 0) {
      rateLimitStore.delete(key);
      continue;
    }

    if (recentHits.length !== hits.length) {
      rateLimitStore.set(key, recentHits);
    }
  }
}

export function getClientIp(source?: Headers | Request) {
  const headerSource =
    source instanceof Request ? source.headers : source ?? new Headers();
  const forwardedFor = headerSource.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return (
    headerSource.get("x-real-ip") ||
    headerSource.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  pruneRateLimitStore(now);

  const windowStart = now - windowMs;
  const existingHits = rateLimitStore.get(key) ?? [];
  const recentHits = existingHits.filter((timestamp) => timestamp > windowStart);

  if (recentHits.length >= limit) {
    const oldestHit = recentHits[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestHit + windowMs - now) / 1000)
    );

    rateLimitStore.set(key, recentHits);
    return { allowed: false, retryAfterSeconds };
  }

  recentHits.push(now);
  rateLimitStore.set(key, recentHits);

  return { allowed: true, retryAfterSeconds: 0 };
}

export function getRateLimitHeaders(retryAfterSeconds: number) {
  return {
    "Cache-Control": "no-store",
    "Retry-After": String(retryAfterSeconds),
  };
}
