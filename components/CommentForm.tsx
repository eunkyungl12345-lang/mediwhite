"use client";
import { useRef, useState } from "react";
import { personMention } from "@/lib/safety";
import { useFormStatus } from "react-dom";
import { addComment } from "@/lib/actions";
function Btn() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>등록</button>; }
export default function CommentForm({ postId }: { postId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [t, setT] = useState(""); const pm = personMention(t);
  return (<>
    {pm && <div className="warn" style={{ marginTop: 8 }}>"<b>{pm}</b>" — 특정 사람을 가리키는 표현 같아요. 실명·식별 정보는 빼주세요.</div>}
    <form ref={ref} className="composer" action={async fd => { await addComment(postId, String(fd.get("text") ?? "")); ref.current?.reset(); }}>
      <input name="text" maxLength={500} autoComplete="off" placeholder="댓글 달기 (익명)" required onChange={e => setT(e.target.value)} />
      <Btn />
    </form>
  </>);
}
