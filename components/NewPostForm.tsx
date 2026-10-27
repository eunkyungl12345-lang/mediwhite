"use client";
import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPost, type FormState } from "@/lib/actions";
import { DEPTS, NOTICE_CAT } from "@/lib/depts";
function Submit() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "올리는 중…" : "올리기"}</button>; }
export default function NewPostForm({ defaultCat, defaultTab, canNotice, boards }: { defaultCat: string; defaultTab: string; canNotice: boolean; boards: { id: string; name: string; dept: string }[] }) {
  const [state, action] = useFormState<FormState, FormData>(createPost, undefined);
  const [cat, setCat] = useState(defaultCat);
  const tabs = boards.filter(b => b.dept === cat);
  return (
    <form action={action} className="form">
      <div className="bar"><strong>새 글</strong><Link className="link" href="/board">취소</Link></div>
      <select name="category" value={cat} onChange={e => setCat(e.target.value)}>{canNotice && <option value={NOTICE_CAT}>📢 공지 (전체)</option>}{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
      {tabs.length > 0 && <select name="board_id" defaultValue={defaultTab}><option value="">자유</option>{tabs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
      <input name="title" maxLength={80} placeholder="제목" required />
      <textarea name="body" maxLength={4000} placeholder="환자 개인정보는 올리지 말아주세요." required />
      {state?.error && <div className="error">{state.error}</div>}
      <Submit />
    </form>
  );
}
