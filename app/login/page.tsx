import OpenPromo from "@/components/OpenPromo";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { promoUntil } from "@/lib/hospFactsDb";

/** 소셜 로그인 실패는 이유만 짧게 알려주고, 다시 누르면 처음부터 진행돼요 */
const OAUTH_ERROR: Record<string, string> = {
  kakao_failed: "카카오 로그인이 중간에 끊겼어요. 다시 한 번 시도해주세요.",
  kakao_state: "보안 확인이 맞지 않아 처음부터 다시 해야 해요. 다시 시도해주세요.",
  kakao_expired: "카카오 가입 시간(10분)이 지났어요. 카카오로 다시 시작해주세요.",
  kakao_config: "카카오 로그인 설정이 아직 없어요. 운영팀에 알려주세요.",
  naver_failed: "네이버 로그인이 중간에 끊겼어요. 다시 한 번 시도해주세요.",
  naver_state: "보안 확인이 맞지 않아 처음부터 다시 해야 해요. 다시 시도해주세요.",
  naver_config: "네이버 로그인 설정이 아직 없어요. 운영팀에 알려주세요.",
  google_failed: "구글 로그인이 중간에 끊겼어요. 다시 한 번 시도해주세요.",
  google_state: "보안 확인이 맞지 않아 처음부터 다시 해야 해요. 다시 시도해주세요.",
  google_config: "구글 로그인 설정이 아직 없어요. 운영팀에 알려주세요.",
  oauth_expired: "가입 입력 시간(10분)이 지났어요. 소셜 로그인으로 다시 시작해주세요.",
};

export default async function LoginPage({ searchParams }: { searchParams: { ref?: string; next?: string; mode?: string; from?: string; error?: string } }) {
  const next = /^\/(hospitals|jobs)\/[\w-]+(\?id=\d+)?$/.test(searchParams.next ?? "") ? searchParams.next! : "";
  const ref = (searchParams.ref || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  const promo = await promoUntil();
  return (
    <div className="login-bg"><div className="app"><main><div className="auth form login-card">
      <h1><Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>메디화이트</Link></h1>
      <p className="one-line">이직 전에 그 병원 실수령 확인하는 곳</p>
      <div className="muted">다녀본 병원 직원들이 익명으로 알려줘요 — 통장 실수령·원장 성향·실제 퇴근. 아이디와 닉네임만 있으면 돼요.</div>
      {searchParams.from === "pay" && <p className="from-pay">💳 방금 본 실수령 카드의 <b>‘같은 직종 상위 몇 %’</b>는 가입하고 다녔던 병원 1곳을 체크하면 열려요. (1분)</p>}
      {searchParams.mode !== "signup" && <OpenPromo />}
      <AuthForm refCode={ref || undefined} next={next || undefined} initialMode={searchParams.mode === "signup" ? "signup" : undefined} promoUntil={promo} oauthError={OAUTH_ERROR[searchParams.error ?? ""]} />
      <div className="muted" style={{ textAlign: "center" }}><Link href="/about">메디화이트가 뭐예요?</Link></div>
    </div></main></div></div>
  );
}
