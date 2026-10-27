"use client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { createPost, type FormState } from "@/lib/actions";
import { DEPTS, NOTICE_CAT } from "@/lib/depts";

function Submit() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "올리는 중…" : "올리기"}</button>; }

export default function NewPostForm({ defaultCat, canNotice }: { defaultCat: string; canNotice: boolean }) {
  const [state, action] = useFormState<FormState, FormData>(createPost, undefined);
  return (
    <form action={action} className="form">
      <div className="bar"><strong>새 글</strong><Link className="link" href="/board">취소</Link></div>
      <select name="category" defaultValue={defaultCat}>{canNotice && <option value={NOTICE_CAT}>📢 공지 (전체)</option>}{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
      <input name="title" maxLength={80} placeholder="제목" required />
      <textarea name="body" maxLength={4000} placeholder="익명으로 올라가요. 환자 개인정보는 올리지 말아주세요." required />
      {state?.error && <div className="error">{state.error}</div>}
      <Submit />
    </form>
  );
}
