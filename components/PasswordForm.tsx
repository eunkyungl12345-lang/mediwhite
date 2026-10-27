"use client";
import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { changePassword, type FormState } from "@/lib/actions";
function Btn() { const { pending } = useFormStatus(); return <button className="btn ghost" disabled={pending}>비밀번호 변경</button>; }
export default function PasswordForm() {
  const [st, action] = useFormState<FormState, FormData>(changePassword, undefined);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async fd => { await action(fd); }} className="form">
      <input name="current" type="password" placeholder="현재 비밀번호" autoComplete="current-password" required />
      <div className="row"><input name="next" type="password" placeholder="새 비밀번호 (4자 이상)" autoComplete="new-password" required /><input name="again" type="password" placeholder="새 비밀번호 확인" autoComplete="new-password" required /></div>
      <div className="row"><Btn />{st?.error && <span className="error">{st.error}</span>}{st?.ok && <span className="muted" style={{ color: "var(--scrub)" }}>{st.ok}</span>}</div>
    </form>
  );
}
