import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SocialSignupForm from "@/components/SocialSignupForm";
import { OAUTH_TEMP_COOKIE, PROVIDER_LABEL, readOauthTemp } from "@/lib/oauth";

export const dynamic = "force-dynamic";

/** 카카오·구글·네이버로 처음 온 분: 직종만 고르면 가입이 끝납니다 (임시 쿠키 10분). */
export default async function OauthSignupPage() {
  const temp = await readOauthTemp(cookies().get(OAUTH_TEMP_COOKIE)?.value);
  if (!temp) redirect("/login?error=oauth_expired");
  return (
    <div className="login-bg"><div className="app"><main><div className="auth form login-card">
      <h1><Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>메디화이트</Link></h1>
      <p className="one-line">{PROVIDER_LABEL[temp.provider]}로 왔어요 — 마지막 한 가지만 고르면 끝</p>
      <div className="muted">직종은 어느 게시판·파트에서 활동할지 정하는 값이라 한 번 고르면 바꿀 수 없어요. 닉네임은 나중에 바꿀 수 있어요.</div>
      <SocialSignupForm defaultNickname={temp.nickname} provider={temp.provider} />
      <div className="muted" style={{ textAlign: "center" }}><Link href="/login">취소하고 로그인으로</Link></div>
    </div></main></div></div>
  );
}
