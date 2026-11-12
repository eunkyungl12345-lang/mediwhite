import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = ["/login", "/contact", "/about", "/rules", "/privacy", "/terms", "/h/", "/pay", "/api/auth/"];
const isRoot = (p: string) => p === "/";
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isRoot(pathname) || PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  const t = req.cookies.get("mw_session")?.value;
  if (t) {
    try { await jwtVerify(t, new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me")); return NextResponse.next(); } catch {}
  }
  const url = req.nextUrl.clone(); url.pathname = "/login"; url.search = "";
  // 비회원이 공고 지원 링크를 누르면 → 가입 후 그 공고로
  if (pathname === "/api/extout") { const id = req.nextUrl.searchParams.get("id") ?? ""; if (/^\d+$/.test(id)) { url.searchParams.set("mode", "signup"); url.searchParams.set("next", `/jobs/ext/${id}`); } }
  return NextResponse.redirect(url);
}
export const config = { matcher: ["/((?!_next|api/public|.*\\..*).*)"] };
