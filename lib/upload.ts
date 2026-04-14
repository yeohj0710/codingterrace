"use server";

import { checkRateLimit, getRequestRateLimitKey } from "@/lib/security";

export async function getUploadUrl() {
  const rateLimit = checkRateLimit(getRequestRateLimitKey("upload"), {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many upload attempts. Retry in ${rateLimit.retryAfterSeconds}s.`,
    };
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_API_KEY;

  if (!accountId || !apiKey) {
    return { success: false, error: "Upload service is not configured." };
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to get upload URL:",
        response.status,
        response.statusText,
        errorText
      );
      return { success: false, error: "Failed to get upload URL." };
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error in getUploadUrl:", error);
    return { success: false, error: "Failed to get upload URL." };
  }
}
