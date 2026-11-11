import { SignJWT, jwtVerify } from "jose";
import { ENDPOINTS, PROVIDER_LABEL, USERNAME_PREFIX, OAUTH_PROVIDERS, isProvider, type OauthProvider } from "./oauthProviders";

// 화면·서버 액션이 같은 값을 쓰도록 여기서도 다시 내보냅니다.
export { ENDPOINTS, PROVIDER_LABEL, USERNAME_PREFIX, OAUTH_PROVIDERS, isProvider };
export type { OauthProvider };

/** 환경변수 이름 (Vercel > Settings > Environment Variables) */
const CLIENT_ID_ENV: Record<OauthProvider, string> = {
  kakao: "KAKAO_CLIENT_ID",
  google: "GOOGLE_CLIENT_ID",
  naver: "NAVER_CLIENT_ID",
};
const CLIENT_SECRET_ENV: Record<OauthProvider, string> = {
  kakao: "KAKAO_CLIENT_SECRET",
  google: "GOOGLE_CLIENT_SECRET",
  naver: "NAVER_CLIENT_SECRET",
};

export function clientId(p: OauthProvider) {
  return (process.env[CLIENT_ID_ENV[p]] || "").trim();
}
export function clientSecret(p: OauthProvider) {
  return (process.env[CLIENT_SECRET_ENV[p]] || "").trim();
}

/** 소셜에서 돌아온 직후, 직종 선택 전까지 들고 있는 임시 쿠키 (10분) */
export const OAUTH_TEMP_COOKIE = "mw_oauth_temp";
export const OAUTH_TEMP_MAX_AGE = 60 * 10;
/** 인가 요청↔콜백 짝을 맞추는 state 쿠키 */
export const OAUTH_STATE_COOKIE = "mw_oauth_state";
export const OAUTH_STATE_MAX_AGE = 60 * 10;

export type OauthTemp = { provider: OauthProvider; oauth_id: string; nickname: string };
export type OauthProfile = { id: string; nickname: string; email: string | null };

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me");
const isProd = () => process.env.NODE_ENV === "production";

/**
 * 제공자에 알려줄 리다이렉트 주소.
 * 인가 요청과 토큰 교환에서 반드시 같은 값이어야 하므로 한 곳에서만 만듭니다.
 */
export function oauthRedirectUri(p: OauthProvider, req: Request) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/+$/, "");
  return `${base}/api/auth/callback/${p}`;
}

/** 인가 화면 주소. 키가 없으면 null (설정 전 배포에서 500 대신 안내 문구로) */
export function authorizeUrl(p: OauthProvider, req: Request, state: string): URL | null {
  const id = clientId(p);
  if (!id) return null;
  const url = new URL(ENDPOINTS[p].auth);
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", oauthRedirectUri(p, req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  if (p === "google") url.searchParams.set("scope", "openid profile email");
  return url;
}

/** 직종 선택 퍼널로 넘길 소셜 신원을 서명해 임시 쿠키에 담습니다 (10분) */
export async function signOauthTemp(t: OauthTemp) {
  return new SignJWT({ ...t }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${OAUTH_TEMP_MAX_AGE}s`).sign(secret());
}

/** 임시 쿠키 검증. 위조·만료·형식 오류는 모두 null */
export async function readOauthTemp(token: string | undefined | null): Promise<OauthTemp | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    // 제공자 정보가 없는 예전(카카오 전용) 쿠키는 카카오로 봅니다
    const provider: OauthProvider = payload.provider == null ? "kakao" : isProvider(payload.provider) ? payload.provider : "kakao";
    const id = String(payload.oauth_id ?? "");
    if (!/^[\w-]{1,64}$/.test(id)) return null;
    return { provider, oauth_id: id, nickname: String(payload.nickname ?? "").slice(0, 12) };
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

/** 인가 코드 → 액세스 토큰. 네이버는 state까지 함께 보내야 합니다. */
export async function exchangeCode(p: OauthProvider, code: string, redirectUri: string, state: string): Promise<string | null> {
  const id = clientId(p);
  if (!id) return null;
  const secretKey = clientSecret(p);
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: id,
    redirect_uri: redirectUri,
    code,
  });
  // 카카오는 Client Secret을 켠 앱에서만 필요하고, 구글·네이버는 필수입니다.
  if (secretKey) form.set("client_secret", secretKey);
  try {
    // 네이버 토큰 API는 GET(쿼리)을 기본으로 안내하므로 제공자별로 나눕니다.
    const query = new URLSearchParams(form);
    query.set("state", state);
    const res = p === "naver"
      ? await fetch(`${ENDPOINTS.naver.token}?${query.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
      : await fetch(ENDPOINTS[p].token, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
          body: form.toString(),
          cache: "no-store",
        });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; error?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

const cut = (v: unknown, max = 12) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** 액세스 토큰 → 제공자별 고유번호·닉네임·이메일 */
export async function fetchProfile(p: OauthProvider, accessToken: string): Promise<OauthProfile | null> {
  try {
    const res = await fetch(ENDPOINTS[p].me, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;

    if (p === "kakao") {
      const id = json.id == null ? "" : String(json.id);
      const account = (json.kakao_account ?? {}) as { email?: string; profile?: { nickname?: string; name?: string } };
      if (!id) return null;
      return { id, nickname: cut(account.profile?.nickname ?? account.profile?.name), email: account.email ?? null };
    }

    if (p === "google") {
      const id = json.sub == null ? "" : String(json.sub);
      if (!id) return null;
      return { id, nickname: cut(json.name ?? json.given_name), email: (json.email as string) ?? null };
    }

    // 네이버: { resultcode: "00", response: { id, nickname, name, email } }
    if (String(json.resultcode ?? "00") !== "00") return null;
    const me = (json.response ?? {}) as { id?: string; nickname?: string; name?: string; email?: string };
    const id = me.id ? String(me.id) : "";
    if (!id) return null;
    return { id, nickname: cut(me.nickname ?? me.name), email: me.email ?? null };
  } catch {
    return null;
  }
}
