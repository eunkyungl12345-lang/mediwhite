"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { requestContribution, type FormState } from "@/lib/actions";
function Btn({ disabled }: { disabled: boolean }) { const { pending } = useFormStatus(); return <button className="btn" disabled={disabled || pending}>{pending ? "신청 중…" : "응원 신청"}</button>; }
export default function SupportForm({ amounts, rate, disabled }: { amounts: number[]; rate: number; disabled: boolean }) {
  const [st, action] = useFormState<FormState, FormData>(requestContribution, undefined);
  const [amt, setAmt] = useState(amounts[1]);
  return (
    <form action={action} className="form">
      <div className="row">{amounts.map(a => <button type="button" key={a} className="cats-btn" aria-pressed={amt === a} onClick={() => setAmt(a)}>{a.toLocaleString()}원 <span className="muted">+{Math.round(a * rate)}</span></button>)}</div>
      <input type="hidden" name="amount" value={amt} />
      <input name="depositor" maxLength={20} placeholder="입금자명 (통장에 찍히는 이름)" required disabled={disabled} />
      <div className="row"><Btn disabled={disabled} />{st?.error && <span className="error">{st.error}</span>}</div>
      {st?.ok && <div className="muted" style={{ color: "var(--scrub)" }}>{st.ok}</div>}
    </form>
  );
}
