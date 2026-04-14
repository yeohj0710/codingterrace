type CacheEntry<T> =
  | {
      expiresAt: number;
      value: T;
    }
  | {
      expiresAt: number;
      promise: Promise<T>;
    };

const CACHE_RETENTION_MS = 60 * 60 * 1000;

const globalForResponseCache = globalThis as typeof globalThis & {
  __codingTerraceResponseCache?: Map<string, CacheEntry<unknown>>;
  __codingTerraceResponseCacheChecks?: number;
};

const responseCacheStore =
  globalForResponseCache.__codingTerraceResponseCache ??
  new Map<string, CacheEntry<unknown>>();

if (!globalForResponseCache.__codingTerraceResponseCache) {
  globalForResponseCache.__codingTerraceResponseCache = responseCacheStore;
}

function pruneResponseCache(now: number) {
  const checks =
    (globalForResponseCache.__codingTerraceResponseCacheChecks ?? 0) + 1;
  globalForResponseCache.__codingTerraceResponseCacheChecks = checks;

  if (checks % 200 !== 0 && responseCacheStore.size < 1000) {
    return;
  }

  const retentionStart = now - CACHE_RETENTION_MS;

  for (const [key, entry] of responseCacheStore.entries()) {
    if (entry.expiresAt <= now || entry.expiresAt < retentionStart) {
      responseCacheStore.delete(key);
    }
  }
}

export async function getOrSetResponseCache<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>
) {
  const now = Date.now();
  pruneResponseCache(now);

  const existing = responseCacheStore.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    if ("value" in existing) {
      return { value: existing.value, hit: true };
    }

    return { value: await existing.promise, hit: true };
  }

  const pendingPromise = factory()
    .then((value) => {
      responseCacheStore.set(key, {
        expiresAt: Date.now() + ttlMs,
        value,
      });
      return value;
    })
    .catch((error) => {
      const current = responseCacheStore.get(key) as CacheEntry<T> | undefined;
      if (current && "promise" in current && current.promise === pendingPromise) {
        responseCacheStore.delete(key);
      }
      throw error;
    });

  responseCacheStore.set(key, {
    expiresAt: now + ttlMs,
    promise: pendingPromise,
  });

  return { value: await pendingPromise, hit: false };
}
