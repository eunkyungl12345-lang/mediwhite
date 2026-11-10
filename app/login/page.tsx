import OpenPromo from "@/components/OpenPromo";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { promoUntil } from "@/lib/hospFactsDb";
export default async function LoginPage({ searchParams }: { searchParams: { ref?: string; next?: string; mode?: string } }) {
  const next = /^\/(hospitals|jobs)\/[\w-]+(\?id=\d+)?$/.test(searchParams.next ?? "") ? searchParams.next! : "";
  const ref = (searchParams.ref || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  const promo = await promoUntil();
  return (
    <div className="login-bg"><div className="app"><main><div className="auth form login-card">
      <h1><Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>메디화이트</Link></h1>
      <p className="one-line">이직 전에 그 병원 실수령 확인하는 곳</p>
      <div className="muted">다녀본 병원 직원들이 익명으로 알려줘요 — 통장 실수령·원장 성향·실제 퇴근. 아이디와 닉네임만 있으면 돼요.</div>
      {searchParams.mode !== "signup" && <OpenPromo />}
      <AuthForm refCode={ref || undefined} next={next || undefined} initialMode={searchParams.mode === "signup" ? "signup" : undefined} promoUntil={promo} />
      <div className="muted" style={{ textAlign: "center" }}><Link href="/about">메디화이트가 뭐예요?</Link></div>
    </div></main></div></div>
  );
}
