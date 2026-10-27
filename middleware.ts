import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = ["/login", "/contact"];
const isRoot = (p: string) => p === "/";
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isRoot(pathname) || PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  const t = req.cookies.get("mw_session")?.value;
  if (t) {
    try { await jwtVerify(t, new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me")); return NextResponse.next(); } catch {}
  }
  const url = req.nextUrl.clone(); url.pathname = "/login"; url.search = "";
  return NextResponse.redirect(url);
}
export const config = { matcher: ["/((?!_next|api/public|.*\\..*).*)"] };
