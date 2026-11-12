"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updatePost } from "@/lib/actions";
const Save = () => { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "저장 중…" : "수정 완료"}</button>; };
/** ✏️ 글 수정 폼 — 제목·본문만 (칸·주제는 그대로) */
export default function EditPostForm({ id, title, body, back }: { id: string; title: string; body: string; back: string }) {
  const [st, act] = useFormState(updatePost, undefined as any); const [b, setB] = useState(body);
  return <form action={act} className="form card" style={{ display: "grid", gap: 12 }}>
    <input type="hidden" name="id" value={id} />
    <label className="rw-f"><span className="rw-l">제목</span><input name="title" defaultValue={title} maxLength={80} required /></label>
    <label className="rw-f"><span className="rw-l">내용 <small>{b.length}/4000</small></span><textarea name="body" rows={12} maxLength={4000} value={b} onChange={e => setB(e.target.value)} required /></label>
    {st?.error && <><div className="error" role="alert">{st.error}</div>{/특정 개인/.test(st.error) && <label className="muted agree"><input type="checkbox" name="confirm_anon" /><span>실명·식별 정보가 없는 글이에요</span></label>}</>}
    <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}><a className="btn ghost" href={back}>취소</a><Save /></div>
  </form>;
}
