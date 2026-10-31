"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { requestBadge } from "@/lib/badge.actions";
import { shrinkImage } from "@/lib/shrink";
import BlueBadge from "./BlueBadge";

function Pick({ name, label, hint }: { name: string; label: string; hint: string }) {
  const [src, setSrc] = useState(""), [busy, setBusy] = useState(false);
  return <label className="bd-pick">
    <input type="file" name={name} accept="image/*" required onChange={async e => { const inp = e.target, f = inp.files?.[0]; if (!f) { setSrc(""); return; } setBusy(true); const small = await shrinkImage(f); try { const dt = new DataTransfer(); dt.items.add(small); inp.files = dt.files; } catch {} setSrc(URL.createObjectURL(small)); setBusy(false); }} />
    {busy && <small className="muted">사진 줄이는 중…</small>}
    {src ? <img src={src} alt="" /> : <span className="bd-ph">📷</span>}
    <b>{label}</b><small className="muted">{hint}</small>
  </label>;
}
function Submit() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "올리는 중…" : <><BlueBadge size={16} className="bb" /> 인증 신청하기</>}</button>; }
export default function BadgeForm() {
  const [st, action] = useFormState(requestBadge, undefined);
  return <form action={action} className="form" style={{ gap: 10 }}>
    <div className="bd-picks">
      <Pick name="idcard" label="① 운전면허증" hint="이름·생년월일만 보이게, 면허번호·주민번호 뒷자리는 가려주세요" />
      <Pick name="license" label="② 의료 면허·자격증" hint="간호사·방사선사·물리치료사 면허증, 간호조무사 자격증 등 — 이름이 ①과 같아야 해요" />
    </div>
    <input name="note" maxLength={100} placeholder="운영팀에 한마디 (선택) — 예: 자격증 이름이 개명 전 이름이에요" />
    <label className="row" style={{ gap: 6, fontSize: 13, alignItems: "flex-start" }}><input type="checkbox" name="agree" required style={{ marginTop: 3 }} /><span>사진은 <b>골드뱃지 심사에만</b> 쓰이고, 승인·거절 즉시 삭제돼요. 운영팀 외에는 아무도 볼 수 없어요. 동의합니다.</span></label>
    {st?.error && <div className="error">{st.error}</div>}{!st?.error && !st?.ok && <noscript><div className="error">자바스크립트가 꺼져 있으면 업로드가 안 돼요</div></noscript>}{st?.ok && <div className="muted" style={{ fontWeight: 700 }}>{st.ok}</div>}
    <Submit />
  </form>;
}
