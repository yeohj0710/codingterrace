import bcrypt from "bcrypt";
import { timingSafeEqual } from "crypto";

const BCRYPT_PREFIX = /^\$2[aby]\$/;
const GUEST_PASSWORD_ROUNDS = 12;

export async function hashGuestPassword(
  password?: string | null
): Promise<string | null> {
  const normalized = password?.trim();
  if (!normalized) {
    return null;
  }

  return bcrypt.hash(normalized, GUEST_PASSWORD_ROUNDS);
}

export async function verifyStoredPassword(
  storedPassword: string | null | undefined,
  suppliedPassword: string | null | undefined
): Promise<boolean> {
  if (!storedPassword || !suppliedPassword) {
    return false;
  }

  if (BCRYPT_PREFIX.test(storedPassword)) {
    return bcrypt.compare(suppliedPassword, storedPassword);
  }

  const storedBuffer = Buffer.from(storedPassword);
  const suppliedBuffer = Buffer.from(suppliedPassword);

  if (storedBuffer.length !== suppliedBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, suppliedBuffer);
}

export function isHashedPassword(password: string | null | undefined) {
  return Boolean(password && BCRYPT_PREFIX.test(password));
}
