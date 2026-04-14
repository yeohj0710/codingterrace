import db from "@/lib/db";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/requestGuard";
import getSession from "@/lib/session";
import { headers } from "next/headers";
export { checkRateLimit, getClientIp, getRateLimitHeaders };

export function getRequestRateLimitKey(scope: string) {
  const requestHeaders = headers();
  return `${scope}:${getClientIp(requestHeaders)}`;
}

export async function isUserOperatorSession() {
  const session = await getSession();

  if (!session.idx) {
    return false;
  }

  const user = await db.user.findUnique({
    where: { idx: session.idx },
    select: { id: true },
  });

  if (!user) {
    return false;
  }

  const operators = process.env.OPERATORS?.split(",")
    .map((operatorId) => operatorId.trim())
    .filter(Boolean);

  return Boolean(operators?.includes(user.id));
}

export function isAuthorizedCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function isAuthorizedOperatorRequest(
  request: Request,
  options?: {
    allowCron?: boolean;
  }
) {
  if (options?.allowCron && isAuthorizedCronRequest(request)) {
    return true;
  }

  return isUserOperatorSession();
}
