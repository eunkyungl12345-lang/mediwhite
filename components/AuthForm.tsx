"use client";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { login, signup, findUsername, type FormState } from "@/lib/actions";
import { DEPTS, display } from "@/lib/depts";

function Submit({ label }: { label: string }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "잠시만요…" : label}</button>; }

export default function AuthForm({ refCode, invite }: { refCode?: string; invite?: string }) {
  const [mode, setMode] = useState<"login" | "signup" | "find">(refCode || invite ? "signup" : "login");
  const [fs, findAction] = useFormState<FormState, FormData>(findUsername, undefined);
  const [ls, loginAction] = useFormState<FormState, FormData>(login, undefined);
  const [ss, signupAction] = useFormState<FormState, FormData>(signup, undefined);
  const [nick, setNick] = useState(""); const [dept, setDept] = useState("");
  useEffect(() => { if (invite) try { document.cookie = `mw_inv=${encodeURIComponent(invite)}; path=/; max-age=${60 * 60 * 24 * 7}`; } catch {} }, [invite]);
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
          <button type="button" className="link" onClick={() => setMode("find")}>아이디를 잊으셨나요?</button>
        </form>
      ) : mode === "find" ? (
        <form action={findAction} className="form">
          <div className="muted">가입할 때 쓴 닉네임과 직종을 입력하면 아이디 일부를 알려드려요.</div>
          <select name="dept" defaultValue="" required><option value="" disabled>직종</option>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
          <input name="nickname" placeholder="닉네임" maxLength={12} required />
          {fs?.error && <div className="error">{fs.error}</div>}
          {fs?.ok && <div className="muted" style={{ color: "var(--scrub)" }}>{fs.ok}</div>}
          <Submit label="아이디 찾기" />
          <button type="button" className="link" onClick={() => setMode("login")}>← 로그인으로</button>
        </form>
      ) : (
        <form action={signupAction} className="form">
          <div className="inv-gate">💌 메디화이트웹은 <b>병원 사람들만 초대장으로</b> 가입할 수 있어요.</div>
          <input name="invite" defaultValue={invite ?? ""} placeholder="초대 코드 (예: MW-AB12CD)" autoCapitalize="characters" required style={{ textTransform: "uppercase", letterSpacing: 1 }} />
          <input name="username" placeholder="아이디 (영문 소문자·숫자 3~20자)" autoComplete="username" required />
          <input name="password" type="password" placeholder="비밀번호 (4자 이상)" autoComplete="new-password" required />
          <select name="dept" value={dept} onChange={e => setDept(e.target.value)} required>
            <option value="" disabled>직종 선택 (가입 후 변경 불가)</option>
            {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input name="nickname" value={nick} onChange={e => setNick(e.target.value)} placeholder="닉네임 (최대 12자, 나중에 변경 가능)" maxLength={12} required />
          <div className="muted">표시 이름: <b>{display(dept || "직종", nick || "닉네임")}</b> — 앞의 [직종]은 한 번 고르면 바꿀 수 없어요 (탈퇴 후 재가입만 가능).</div>
          <label className="muted" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}><input type="checkbox" name="agree" required style={{ marginTop: 3 }} /><span><a href="/rules" target="_blank">커뮤니티 규칙</a>(실명·환자정보 금지, 게시물 책임은 작성자, 신고 시 임시조치)에 동의해요.</span></label>
          {ss?.error && <div className="error">{ss.error}</div>}
          <Submit label="가입하고 입장" />
        </form>
      )}
    </>
  );
}
