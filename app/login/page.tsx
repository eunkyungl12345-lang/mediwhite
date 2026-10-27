import AuthForm from "@/components/AuthForm";
export default function LoginPage() {
  return (
    <div className="app"><main><div className="auth form">
      <h1>메디화이트웹</h1>
      <div className="muted">병원 직원들의 익명 라운지. 실명 대신 아이디와 닉네임만 있으면 돼요.</div>
      <AuthForm />
    </div></main></div>
  );
}
