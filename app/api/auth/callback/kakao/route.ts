import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/supabase";
import { createSession, type Session } from "@/lib/auth";
import {
  OAUTH_STATE_COOKIE, OAUTH_TEMP_COOKIE, NEXT_COOKIE, oauthTempCookieOptions,
  exchangeKakaoCode, fetchKakaoProfile, kakaoRedirectUri, safeNext, signOauthTemp,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

const admins = () => (process.env.ADMIN_USERNAMES || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

/** 실패는 모두 같은 방식으로: 임시 흔적을 지우고 로그인 화면에 이유만 알려줍니다. */
function fail(req: NextRequest, reason = "kakao_failed") {
  const res = NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  res.cookies.delete(OAUTH_TEMP_COOKIE);
  return res;
}

/** 카카오 콜백: 기존 회원이면 바로 로그인, 처음이면 직종 선택 퍼널로. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (searchParams.get("error") || !code) return fail(req);

  const savedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!state || !savedState || state !== savedState) return fail(req, "kakao_state");

  const accessToken = await exchangeKakaoCode(code, kakaoRedirectUri(req));
  if (!accessToken) return fail(req);
  const profile = await fetchKakaoProfile(accessToken);
  if (!profile) return fail(req);

  let user: { id: string; username: string; nickname: string; dept: string; role: string } | null = null;
  try {
    const { data } = await db()
      .from("users")
      .select("id,username,nickname,dept,role")
      .eq("oauth_provider", "kakao")
      .eq("oauth_id", profile.id)
      .maybeSingle();
    user = data ?? null;
  } catch {
    return fail(req);
  }

  // 이미 연결된 카카오 계정 → 세션만 발급하고 입장
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

  // 처음 오는 카카오 계정 → 직종만 고르면 끝. 카카오 신원은 10분짜리 서명 쿠키로만 넘깁니다.
  const temp = await signOauthTemp({ oauth_id: profile.id, nickname: profile.nickname });
  const res = NextResponse.redirect(new URL("/login/oauth", req.url));
  res.cookies.set(OAUTH_TEMP_COOKIE, temp, oauthTempCookieOptions);
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
