import { NextResponse, type NextRequest } from "next/server";
import { db } from "./supabase";
import { createSession, type Session } from "./auth";
import {
  OAUTH_STATE_COOKIE, OAUTH_TEMP_COOKIE, NEXT_COOKIE, oauthStateCookieOptions, oauthTempCookieOptions,
  authorizeUrl, exchangeCode, fetchProfile, oauthRedirectUri, safeNext, signOauthTemp, type OauthProvider,
} from "./oauth";

const admins = () => (process.env.ADMIN_USERNAMES || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

/** 실패는 모두 같은 방식으로: 임시 흔적을 지우고 로그인 화면에 이유만 알려줍니다. */
export function oauthFail(req: NextRequest, provider: OauthProvider, reason?: string) {
  const res = NextResponse.redirect(new URL(`/login?error=${reason ?? `${provider}_failed`}`, req.url));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  res.cookies.delete(OAUTH_TEMP_COOKIE);
  return res;
}

/** 로그인 시작: 제공자 인가 화면으로 보내고 state 쿠키를 심습니다. */
export function startOauth(req: NextRequest, provider: OauthProvider) {
  const url = authorizeUrl(provider, req, crypto.randomUUID().replace(/-/g, ""));
  if (!url) return NextResponse.redirect(new URL(`/login?error=${provider}_config`, req.url));
  const state = url.searchParams.get("state") ?? "";
  const res = NextResponse.redirect(url);
  // 돌아올 때 같은 브라우저가 맞는지 state로 확인합니다.
  res.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions);
  return res;
}

/** 콜백: 기존 회원이면 바로 로그인, 처음이면 직종 선택 퍼널로. */
export async function handleOauthCallback(req: NextRequest, provider: OauthProvider) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (searchParams.get("error") || !code) return oauthFail(req, provider);

  const savedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!state || !savedState || state !== savedState) return oauthFail(req, provider, `${provider}_state`);

  const accessToken = await exchangeCode(provider, code, oauthRedirectUri(provider, req), state);
  if (!accessToken) return oauthFail(req, provider);
  const profile = await fetchProfile(provider, accessToken);
  if (!profile) return oauthFail(req, provider);

  let user: { id: string; username: string; nickname: string; dept: string; role: string } | null = null;
  try {
    const { data } = await db()
      .from("users")
      .select("id,username,nickname,dept,role")
      .eq("oauth_provider", provider)
      .eq("oauth_id", profile.id)
      .maybeSingle();
    user = data ?? null;
  } catch {
    return oauthFail(req, provider);
  }

  // 이미 연결된 계정 → 세션만 발급하고 입장
  if (user) {
    const session: Session = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      dept: user.dept,
      role: user.role === "admin" || admins().includes(user.username.toLowerCase()) ? "admin" : "member",
    };
    await createSession(session);
    const res = NextResponse.redirect(new URL(safeNext(req.cookies.get(NEXT_COOKIE)?.value), req.url));
    res.cookies.delete(OAUTH_STATE_COOKIE);
    res.cookies.delete(OAUTH_TEMP_COOKIE);
    res.cookies.delete(NEXT_COOKIE);
    return res;
  }

  // 처음 오는 계정 → 직종만 고르면 끝. 소셜 신원은 10분짜리 서명 쿠키로만 넘깁니다.
  const temp = await signOauthTemp({ provider, oauth_id: profile.id, nickname: profile.nickname });
  const res = NextResponse.redirect(new URL("/login/oauth", req.url));
  res.cookies.set(OAUTH_TEMP_COOKIE, temp, oauthTempCookieOptions);
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
