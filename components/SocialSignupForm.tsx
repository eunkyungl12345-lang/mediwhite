"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { completeSocialSignup, type OauthFormState } from "@/lib/oauth.actions";
import { DEPT_GROUPS, VENDOR_FIELDS, deptLabel, display } from "@/lib/depts";
import { PROVIDER_LABEL, type OauthProvider } from "@/lib/oauthProviders";

/** 제공자별 아이콘 (로그인 화면 버튼과 같은 표기) */
const ICON: Record<OauthProvider, string> = { kakao: "💬", naver: "N", google: "G" };

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "가입하는 중…" : "가입하고 입장"}</button>;
}

export default function SocialSignupForm({ defaultNickname, provider }: { defaultNickname: string; provider: OauthProvider }) {
  const [state, action] = useFormState<OauthFormState, FormData>(completeSocialSignup, undefined);
  const [dept, setDept] = useState("");
  const [nick, setNick] = useState(defaultNickname.slice(0, 12));
  return (
    <form action={action} className="form">
      <div className={`oauth-who oauth-who-${provider}`}>
        <span className={`${provider}-ico`} aria-hidden>{ICON[provider]}</span> {PROVIDER_LABEL[provider]} 계정으로 확인됐어요
      </div>
      <select name="dept" value={dept} onChange={e => setDept(e.target.value)} required>
        <option value="" disabled>직종 선택 (가입 후 변경 불가)</option>
        {DEPT_GROUPS.map(([g, ds]) => <optgroup key={g} label={g}>{ds.map(d => <option key={d} value={d}>{deptLabel(d)}</option>)}</optgroup>)}
      </select>
      {dept === "업체" && <select name="field" defaultValue="" required><option value="" disabled>업체 분야 선택</option>{VENDOR_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}</select>}
      <input name="nickname" value={nick} onChange={e => setNick(e.target.value)} placeholder="닉네임 (최대 12자, 나중에 변경 가능)" maxLength={12} required />
      <div className="muted">표시 이름: <b>{display(dept || "직종", nick || "닉네임")}</b> — 앞의 [직종]은 한 번 고르면 바꿀 수 없어요.</div>
      <label className="muted agree"><input type="checkbox" name="age14" required /><span>만 14세 이상이에요.</span></label>
      <label className="muted agree"><input type="checkbox" name="agree" required /><span><a href="/terms" target="_blank">이용약관</a>, <a href="/privacy" target="_blank">개인정보처리방침</a>, <a href="/rules" target="_blank">커뮤니티 규칙</a>(실명·환자정보 금지, 게시물 책임은 작성자)에 동의해요.</span></label>
      {state?.error && <div className="error">{state.error}</div>}
      <Submit />
    </form>
  );
}
