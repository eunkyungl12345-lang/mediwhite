"use client";
import { useFormState } from "react-dom";
import { adminCreateUser, adminSetRank, type FormState } from "@/lib/actions";
import { RANKS } from "@/lib/ranks";
import { DEPTS } from "@/lib/depts";

export default function AdminForms({ userId, currentRank, compact }: { userId?: string; currentRank?: number; compact?: boolean }) {
  const [cs, createAction] = useFormState<FormState, FormData>(adminCreateUser, undefined);
  const [rs, rankAction] = useFormState<FormState, FormData>(adminSetRank, undefined);
  if (compact && userId) {
    return (
      <form action={rankAction} className="row" style={{ alignItems: "center" }}>
        <input type="hidden" name="user_id" value={userId} />
        <select name="rank" defaultValue={String(currentRank ?? 0)} style={{ width: "auto", padding: "4px 8px", fontSize: 13 }}>{RANKS.map(([n], i) => <option key={n} value={i}>{n}</option>)}</select>
        <button className="link">계급 변경</button>{rs?.ok && <span className="muted">{rs.ok}</span>}
      </form>
    );
  }
  return (
    <form action={createAction} className="form">
      <div className="row"><input name="username" placeholder="아이디 (영문 소문자)" required /><input name="password" type="password" placeholder="비밀번호" required /></div>
      <div className="row">
        <select name="dept" defaultValue="" required><option value="" disabled>직종</option>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
        <input name="nickname" placeholder="닉네임" maxLength={12} required />
      </div>
      <div className="row">
        <select name="rank" defaultValue="0">{RANKS.map(([n, x], i) => <option key={n} value={i}>{n} ({x.toLocaleString()} XP)</option>)}</select>
        <label className="cats-btn" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="stealth" style={{ width: "auto" }} /> 숨김</label>
      </div>
      <div className="row"><button className="btn">생성</button>{cs?.error && <span className="error">{cs.error}</span>}{cs?.ok && <span className="muted">{cs.ok}</span>}</div>
    </form>
  );
}
