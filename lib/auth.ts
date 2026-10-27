import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Session = { id: string; username: string; nickname: string; dept: string; role: "admin" | "member" };
const COOKIE = "mw_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me");

export async function createSession(s: Session) {
  const token = await new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret());
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function getSession(): Promise<Session | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, secret()); return payload as unknown as Session; } catch { return null; }
}
export function clearSession() { cookies().delete(COOKIE); }
export const SESSION_COOKIE = COOKIE;
