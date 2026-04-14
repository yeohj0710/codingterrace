const DEFAULT_SITE_URL = "https://codingterrace.com";

export function getSiteUrl() {
  return process.env.SITE_URL || DEFAULT_SITE_URL;
}

export function normalizeInternalUrl(
  value: string | null | undefined,
  fallbackPath = "/"
) {
  const siteUrl = new URL(getSiteUrl());
  const fallback = new URL(fallbackPath, siteUrl);

  if (!value) {
    return fallback.toString();
  }

  try {
    const normalized = new URL(value, siteUrl);

    if (normalized.origin !== siteUrl.origin) {
      return fallback.toString();
    }

    return normalized.toString();
  } catch {
    return fallback.toString();
  }
}

export function isAllowedAvatarUrl(value: string | null | undefined) {
  if (!value) {
    return true;
  }

  try {
    const avatarUrl = new URL(value);
    const siteUrl = new URL(getSiteUrl());
    const isSameOrigin = avatarUrl.origin === siteUrl.origin;
    const isCloudflareImage =
      avatarUrl.hostname === "imagedelivery.net" ||
      avatarUrl.hostname.endsWith(".imagedelivery.net");

    return (
      avatarUrl.protocol === "https:" &&
      avatarUrl.pathname.endsWith("/public") &&
      (isSameOrigin || isCloudflareImage)
    );
  } catch {
    return false;
  }
}
