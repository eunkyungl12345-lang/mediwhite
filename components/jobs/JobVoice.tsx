"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { submitJobVoice } from "@/lib/jobActions";
import { VOICE_OPTS } from "@/lib/jobVoice";
function Send() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "보내는 중…" : "의견 보내기 (+10 XP)"}</button>; }
/** 🗣️ 메디잡·사람인으로 병원 구할 때 뭐가 제일 불편했어요? — 메디화이트 채용을 '그 불편' 위주로 고치려고 묻는 설문 */
export default function JobVoice({ n, top, answered }: { n: number; top: { label: string; pct: number }[]; answered?: boolean }) {
  const [st, act] = useFormState(submitJobVoice, undefined); const [open, setOpen] = useState(false);
  if (st?.ok) return <div className="jv done"><b>🙏 {st.ok}</b>{top.length > 0 && <Top n={n} top={top} />}</div>;
  if (answered) return top.length ? <details className="jv done"><summary>🗣️ 메디잡·사람인 불편 설문 결과 보기 · {n}명</summary><Top n={n} top={top} /></details> : null;
  return <div className="jv">
    <button type="button" className="jv-h" onClick={() => setOpen(o => !o)} aria-expanded={open}>
      <span>🗣️</span><div><b>메디잡·사람인으로 병원 구할 때, 뭐가 제일 답답했어요?</b><small>{n > 0 ? `${n}명이 답했어요 · ` : ""}30초 · 이 답 그대로 채용 게시판을 고쳐요</small></div><em>{open ? "접기" : "답하기"}</em>
    </button>
    {open && <form action={act} className="jv-f">
      <div className="jv-opts">{VOICE_OPTS.map(o => <label key={o.id}><input type="checkbox" name="v" value={o.id} /><span>{o.label}</span></label>)}</div>
      <input name="free" maxLength={300} placeholder="그 밖에 불편했던 점 한 줄 (선택)" />
      {st?.error && <div className="error">{st.error}</div>}
      <Send />
      {top.length > 0 && <Top n={n} top={top} />}
    </form>}
  </div>;
}
function Top({ n, top }: { n: number; top: { label: string; pct: number }[] }) {
  return <div className="jv-top"><small>지금까지 {n}명의 답</small>{top.map(t => <div key={t.label} className="jv-bar"><span>{t.label}</span><i style={{ width: `${t.pct}%` }} /><em>{t.pct}%</em></div>)}</div>;
}
