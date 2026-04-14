import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

interface SessionContent {
  idx?: number;
}

const globalForSession = globalThis as typeof globalThis & {
  __codingTerraceFallbackCookiePassword?: string;
};

export default function getSession() {
  const configuredPassword = process.env.COOKIE_PASSWORD;
  const hasValidConfiguredPassword =
    Boolean(configuredPassword) && configuredPassword!.length >= 32;

  if (!hasValidConfiguredPassword) {
    globalForSession.__codingTerraceFallbackCookiePassword =
      globalForSession.__codingTerraceFallbackCookiePassword ||
      randomBytes(32).toString("hex");

    if (process.env.NODE_ENV === "production") {
      console.warn(
        "COOKIE_PASSWORD is not configured with at least 32 characters. Falling back to an ephemeral process-local secret."
      );
    }
  }

  const password =
    configuredPassword && configuredPassword.length >= 32
      ? configuredPassword
      : globalForSession.__codingTerraceFallbackCookiePassword!;

  return getIronSession<SessionContent>(cookies(), {
    cookieName: "cookie",
    password,
    ttl: 60 * 60 * 24 * 14,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  });
}
