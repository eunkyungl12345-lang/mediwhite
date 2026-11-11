/** 카카오·네이버·구글 공식 브랜드 SVG 심볼 — 로그인 버튼과 가입 퍼널 배지에서 함께 사용. 순수 인라인 SVG(외부 이미지 요청 없음) */
import type { OauthProvider } from "@/lib/oauthProviders";

type SymbolProps = { size?: number };

/** 카카오 말풍선 심볼 — 카카오톡 공식 말풍선 형태(디자인 가이드: 심볼 #000 90%) */
export function KakaoSymbol({ size = 18 }: SymbolProps) {
  return (
    <svg viewBox="24 36 208 192" width={size} height={size} aria-hidden="true" focusable="false" style={{ display: "block", flex: "none" }}>
      <path
        fill="#000000"
        fillOpacity="0.9"
        d="M128 36C70.562 36 24 72.713 24 118c0 29.279 19.466 54.97 48.748 69.477-1.593 5.494-10.237 35.344-10.581 37.689 0 0-.207 1.762.934 2.434s2.483.15 2.483.15c3.272-.457 37.943-24.811 43.944-29.04 5.995.849 12.168 1.29 18.472 1.29 57.438 0 104-36.712 104-82 0-45.287-46.562-82-104-82Z"
      />
    </svg>
  );
}

/** 네이버 N 심볼 — 초록 버튼 위에서는 흰색, 연한 배지 위에서는 네이버 그린 */
export function NaverSymbol({ size = 18, onBrand = true }: SymbolProps & { onBrand?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" style={{ display: "block", flex: "none" }}>
      <path fill={onBrand ? "#FFFFFF" : "#03C75A"} d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" />
    </svg>
  );
}

/** 구글 4색 G 로고 */
export function GoogleSymbol({ size = 18 }: SymbolProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false" style={{ display: "block", flex: "none" }}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}

/** 제공자별 심볼 선택기 — onBrand=false 이면 연한 배지 배경에 맞는 색을 씀 */
export function ProviderSymbol({ provider, size = 18, onBrand = true }: SymbolProps & { provider: OauthProvider; onBrand?: boolean }) {
  if (provider === "kakao") return <KakaoSymbol size={size} />;
  if (provider === "naver") return <NaverSymbol size={size} onBrand={onBrand} />;
  return <GoogleSymbol size={size} />;
}
