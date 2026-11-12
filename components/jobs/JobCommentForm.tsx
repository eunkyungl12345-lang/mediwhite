"use client";
import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { postJobComment } from "@/lib/jobComments.actions";
const HINTS = ["C-arm 하루 몇 건 찍나요?", "칼퇴·분위기 어떤가요?", "면접 다녀오신 분 질문 공유해요"];
const Btn = () => { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "올리는 중…" : "익명으로 올리기"}</button>; };
export default function JobCommentForm({ jk, back }: { jk: string; back: string }) {
  const [st, act] = useFormState(postJobComment, undefined); const [t, setT] = useState(""); const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (st?.ok) setT(""); }, [st]);
  return <form action={act} className="jc-form">
    <div className="jc-hints">{HINTS.map(h => <button key={h} type="button" onClick={() => { setT(h + " "); ref.current?.focus(); }}>{h}</button>)}</div>
    <input type="hidden" name="jk" value={jk} /><input type="hidden" name="back" value={back} />
    <textarea ref={ref} name="text" rows={2} maxLength={300} value={t} onChange={e => setT(e.target.value)} placeholder="이 공고·병원에 대해 궁금한 점이나 아는 사실을 남겨주세요 (익명)" aria-label="익명 댓글" />
    {st?.error && <div className="error" role="alert">{st.error}</div>}
    <div className="jc-f"><small>{t.length}/300 · 19금·욕설·전화번호는 막혀요</small><Btn /></div>
  </form>;
}
