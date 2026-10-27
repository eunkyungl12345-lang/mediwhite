"use client";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { login, signup, type FormState } from "@/lib/actions";
import { DEPTS, display } from "@/lib/depts";

function Submit({ label }: { label: string }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "잠시만요…" : label}</button>; }

export default function AuthForm({ refCode }: { refCode?: string }) {
  const [mode, setMode] = useState<"login" | "signup">(refCode ? "signup" : "login");
  const [ls, loginAction] = useFormState<FormState, FormData>(login, undefined);
  const [ss, signupAction] = useFormState<FormState, FormData>(signup, undefined);
  const [nick, setNick] = useState(""); const [dept, setDept] = useState("");
  useEffect(() => { if (refCode) try { document.cookie = `mw_ref=${encodeURIComponent(refCode)}; path=/; max-age=${60 * 60 * 24 * 7}`; } catch {} }, [refCode]);
  return (
    <>
      <div className="switch" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => setMode("login")}>로그인</button>
        <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => setMode("signup")}>가입</button>
      </div>
      {mode === "login" ? (
        <form action={loginAction} className="form">
          <input name="username" placeholder="아이디" autoComplete="username" required />
          <input name="password" type="password" placeholder="비밀번호" autoComplete="current-password" required />
          {ls?.error && <div className="error">{ls.error}</div>}
          <Submit label="들어가기" />
        </form>
      ) : (
        <form action={signupAction} className="form">
          {refCode && <><input type="hidden" name="ref" value={refCode} /><div className="muted">초대 링크로 오셨어요 (초대한 사람: {refCode})</div></>}
          <input name="username" placeholder="아이디 (영문 소문자·숫자 3~20자)" autoComplete="username" required />
          <input name="password" type="password" placeholder="비밀번호 (4자 이상)" autoComplete="new-password" required />
          <select name="dept" value={dept} onChange={e => setDept(e.target.value)} required>
            <option value="" disabled>직종 선택 (가입 후 변경 불가)</option>
            {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input name="nickname" value={nick} onChange={e => setNick(e.target.value)} placeholder="닉네임 (최대 12자, 나중에 변경 가능)" maxLength={12} required />
          <div className="muted">표시 이름: <b>{display(dept || "직종", nick || "닉네임")}</b> — 앞의 [직종]은 한 번 고르면 바꿀 수 없어요 (탈퇴 후 재가입만 가능).</div>
          {ss?.error && <div className="error">{ss.error}</div>}
          <Submit label="가입하고 입장" />
        </form>
      )}
    </>
  );
}
