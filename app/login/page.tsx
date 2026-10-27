import AuthForm from "@/components/AuthForm";
export default function LoginPage({ searchParams }: { searchParams: { ref?: string } }) {
  const ref = (searchParams.ref || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  return (
    <div className="app"><main><div className="auth form">
      <h1>메디화이트웹</h1>
      <div className="muted">병원 직원들의 라운지. 아이디와 닉네임만 있으면 돼요.</div>
      <AuthForm refCode={ref || undefined} />
    </div></main></div>
  );
}
