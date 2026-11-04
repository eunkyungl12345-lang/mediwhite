import Link from "next/link";
import AuthForm from "@/components/AuthForm";
export default function LoginPage({ searchParams }: { searchParams: { ref?: string; next?: string } }) {
  const next = /^\/(hospitals|jobs)\/[\w-]+$/.test(searchParams.next ?? "") ? searchParams.next! : "";
  const ref = (searchParams.ref || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  return (
    <div className="login-bg"><div className="app"><main><div className="auth form login-card">
      <h1><Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>메디화이트웹</Link></h1>
      <div className="muted">급여·내부 분위기·입사해야만 아는 리스크까지 — 병원 직원들이 익명으로 알려주는 진짜 병원 정보. 아이디와 닉네임만 있으면 돼요.</div>
      <AuthForm refCode={ref || undefined} next={next || undefined} />
      <div className="muted" style={{ textAlign: "center" }}><Link href="/about">메디화이트웹이 뭐예요?</Link></div>
    </div></main></div></div>
  );
}
