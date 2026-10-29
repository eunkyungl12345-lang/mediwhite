import Link from "next/link";
import AuthForm from "@/components/AuthForm";
export default function LoginPage({ searchParams }: { searchParams: { invite?: string } }) {
  const invite = (searchParams.invite || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  return (
    <div className="login-bg"><div className="app"><main><div className="auth form login-card">
      <h1><Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>메디화이트웹</Link></h1>
      <div className="muted">병원 직원들만의 익명 라운지. 초대장으로 가입해요.</div>
      <AuthForm invite={invite || undefined} />
      <div className="muted" style={{ textAlign: "center" }}><Link href="/about">메디화이트웹이 뭐예요?</Link></div>
    </div></main></div></div>
  );
}
