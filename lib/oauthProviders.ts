/**
 * 간편 로그인 제공자 정의 (카카오 · 네이버 · 구글).
 * 서버 라우트와 화면(클라이언트 컴포넌트)이 같이 쓰는 값만 모아 둡니다.
 * 라우트는 /api/auth/<provider> ↔ /api/auth/callback/<provider> 로 하나씩 대응합니다.
 */
export type OauthProvider = "kakao" | "google" | "naver";
export const OAUTH_PROVIDERS: readonly OauthProvider[] = ["kakao", "google", "naver"];

/** 화면에 쓰는 이름·아이콘·아이디 프리픽스 */
export const PROVIDER_LABEL: Record<OauthProvider, string> = { kakao: "카카오", google: "구글", naver: "네이버" };
export const USERNAME_PREFIX: Record<OauthProvider, string> = { kakao: "k", google: "g", naver: "n" };

/** 제공자별 엔드포인트 */
export const ENDPOINTS: Record<OauthProvider, { auth: string; token: string; me: string }> = {
  kakao: {
    auth: "https://kauth.kakao.com/oauth/authorize",
    token: "https://kauth.kakao.com/oauth/token",
    me: "https://kapi.kakao.com/v2/user/me",
  },
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    me: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  naver: {
    auth: "https://nid.naver.com/oauth2.0/authorize",
    token: "https://nid.naver.com/oauth2.0/token",
    me: "https://openapi.naver.com/v1/nid/me",
  },
};

/** 제공자 이름이 맞는지 (쿼리·쿠키에서 온 값은 그대로 믿지 않습니다) */
export function isProvider(v: unknown): v is OauthProvider {
  return typeof v === "string" && (OAUTH_PROVIDERS as readonly string[]).includes(v);
}
