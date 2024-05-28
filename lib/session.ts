import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

interface SessionContent {
  idx?: number;
}

export default function getSession() {
  return getIronSession<SessionContent>(cookies(), {
    cookieName: "cookie",
    password: process.env.COOKIE_PASSWORD!,
  });
}
