"use client";
import { useRef, useState } from "react";
import { personMention } from "@/lib/safety";
import { useFormStatus } from "react-dom";
import { addComment } from "@/lib/actions";
function Btn({ label }: { label: string }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "…" : label}</button>; }
export default function CommentForm({ postId, parentId, placeholder = "댓글 달기 (익명)", autoFocus, onDone, label = "등록" }: { postId: string; parentId?: number; placeholder?: string; autoFocus?: boolean; onDone?: () => void; label?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [t, setT] = useState(""); const pm = personMention(t);
  return (<>
    {pm && <div className="warn" style={{ marginTop: 8 }}>"<b>{pm}</b>" — 특정 사람을 가리키는 표현 같아요. 실명·식별 정보는 빼주세요.</div>}
    <form ref={ref} className="composer" action={async fd => { await addComment(postId, String(fd.get("text") ?? ""), parentId ?? null); ref.current?.reset(); setT(""); onDone?.(); }}>
      <input name="text" maxLength={500} autoComplete="off" placeholder={placeholder} required autoFocus={autoFocus} value={t} onChange={e => setT(e.target.value)} />
      <Btn label={label} />
    </form>
  </>);
}
