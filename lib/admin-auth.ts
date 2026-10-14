import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "beebombshell_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getExpectedAdminSecret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.REVALIDATION_SECRET ||
    "beebombshell-admin"
  );
}

function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(`admin-salt-${secret}`).digest("hex");
}

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const expectedSecret = getExpectedAdminSecret();
    const validHash = hashSecret(expectedSecret);

    if (sessionCookie && sessionCookie.value === validHash) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const expectedSecret = getExpectedAdminSecret();
  const validHash = hashSecret(expectedSecret);

  cookieStore.set(SESSION_COOKIE_NAME, validHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function validatePassword(password: string): boolean {
  const expectedSecret = getExpectedAdminSecret();
  if (!password) return false;
  return password.trim() === expectedSecret.trim();
}
