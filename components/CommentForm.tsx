"use client";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addComment } from "@/lib/actions";
function Btn() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>등록</button>; }
export default function CommentForm({ postId }: { postId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} className="composer" action={async fd => { await addComment(postId, String(fd.get("text") ?? "")); ref.current?.reset(); }}>
      <input name="text" maxLength={500} autoComplete="off" placeholder="댓글 달기 (익명)" required />
      <Btn />
    </form>
  );
}
