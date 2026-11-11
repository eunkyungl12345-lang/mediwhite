import { SignJWT, jwtVerify } from "jose";

/** 카카오 OAuth 엔드포인트 */
export const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
export const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
export const KAKAO_ME_URL = "https://kapi.kakao.com/v2/user/me";

/** 카카오에서 돌아온 직후, 직종 선택 전까지 들고 있는 임시 쿠키 (10분) */
export const OAUTH_TEMP_COOKIE = "mw_oauth_temp";
export const OAUTH_TEMP_MAX_AGE = 60 * 10;
/** 인가 요청↔콜백 짝을 맞추는 state 쿠키 */
export const OAUTH_STATE_COOKIE = "mw_oauth_state";
export const OAUTH_STATE_MAX_AGE = 60 * 10;

export type OauthTemp = { oauth_id: string; nickname: string };
export type KakaoProfile = { id: string; nickname: string; email: string | null };

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me");
const isProd = () => process.env.NODE_ENV === "production";

/**
 * 카카오에 알려줄 리다이렉트 주소.
 * 인가 요청과 토큰 교환에서 반드시 같은 값이어야 하므로 한 곳에서만 만듭니다.
 */
export function kakaoRedirectUri(req: Request) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/+$/, "");
  return `${base}/api/auth/callback/kakao`;
}

/** 직종 선택 퍼널로 넘길 카카오 신원을 서명해 임시 쿠키에 담습니다 (10분) */
export async function signOauthTemp(t: OauthTemp) {
  return new SignJWT({ ...t }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${OAUTH_TEMP_MAX_AGE}s`).sign(secret());
}

/** 임시 쿠키 검증. 위조·만료·형식 오류는 모두 null */
export async function readOauthTemp(token: string | undefined | null): Promise<OauthTemp | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = String(payload.oauth_id ?? "");
    if (!/^\d+$/.test(id)) return null;
    return { oauth_id: id, nickname: String(payload.nickname ?? "").slice(0, 12) };
  } catch {
    return null;
  }
}

export const oauthTempCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: isProd(), path: "/", maxAge: OAUTH_TEMP_MAX_AGE };
export const oauthStateCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: isProd(), path: "/", maxAge: OAUTH_STATE_MAX_AGE };

/** 공유 링크(/h/<id>)로 와서 로그인한 경우 원래 보려던 병원·공고로 돌려보냅니다 (아이디 로그인과 같은 규칙) */
export const NEXT_COOKIE = "mw_next";
export function safeNext(value: string | undefined | null) {
  try {
    const n = decodeURIComponent(value ?? "");
    return /^\/(hospitals|jobs)\/[\w-]+(\?id=\d+)?$/.test(n) ? n : "/home";
  } catch { return "/home"; }
}

/** 인가 코드 → 액세스 토큰 */
export async function exchangeKakaoCode(code: string, redirectUri: string): Promise<string | null> {
  const clientId = process.env.KAKAO_CLIENT_ID;
  if (!clientId) return null;
  const body = new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, redirect_uri: redirectUri, code });
  // 카카오 앱에서 '보안' > Client Secret 사용을 켠 경우에만 필요합니다.
  if (process.env.KAKAO_CLIENT_SECRET) body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  try {
    const res = await fetch(KAKAO_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: body.toString(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

/** 액세스 토큰 → 카카오 회원번호·닉네임·이메일 */
export async function fetchKakaoProfile(accessToken: string): Promise<KakaoProfile | null> {
  try {
    const res = await fetch(KAKAO_ME_URL, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { id?: number | string; kakao_account?: { email?: string; profile?: { nickname?: string } } };
    const id = json.id == null ? "" : String(json.id);
    if (!/^\d+$/.test(id)) return null;
    const nickname = (json.kakao_account?.profile?.nickname ?? "").trim().slice(0, 12);
    const email = json.kakao_account?.email ?? null;
    return { id, nickname, email };
  } catch {
    return null;
  }
}
