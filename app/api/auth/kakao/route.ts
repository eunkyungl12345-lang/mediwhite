import { NextResponse, type NextRequest } from "next/server";
import { KAKAO_AUTH_URL, OAUTH_STATE_COOKIE, oauthStateCookieOptions, kakaoRedirectUri } from "@/lib/oauth";

export const dynamic = "force-dynamic";

/** 카카오 로그인 시작: 카카오 인가 화면으로 보냅니다. */
export async function GET(req: NextRequest) {
  const clientId = process.env.KAKAO_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/login?error=kakao_config", req.url));

  const state = crypto.randomUUID().replace(/-/g, "");
  const url = new URL(KAKAO_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", kakaoRedirectUri(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  // 돌아올 때 같은 브라우저가 맞는지 state로 확인합니다.
  res.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions);
  return res;
}
