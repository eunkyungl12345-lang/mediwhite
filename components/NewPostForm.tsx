"use client";
import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPost, type FormState } from "@/lib/actions";
import { DEPTS, NOTICE_CAT, TOPICS } from "@/lib/depts";
import { personMention } from "@/lib/safety";
function Submit() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "올리는 중…" : "올리기"}</button>; }
export default function NewPostForm({ defaultCat, defaultTab, defaultTopic = "free", canNotice, boards }: { defaultCat: string; defaultTab: string; defaultTopic?: string; canNotice: boolean; boards: { id: string; name: string; dept: string }[] }) {
  const [state, action] = useFormState<FormState, FormData>(createPost, undefined);
  const [cat, setCat] = useState(defaultCat);
  const [topic, setTopic] = useState(defaultTopic);
  const [txt, setTxt] = useState("");
  const pm = personMention(txt);
  const tabs = boards.filter(b => b.dept === cat);
  return (
    <form action={action} className="form">
      <div className="bar"><strong>새 글</strong><Link className="link" href="/board">취소</Link></div>
      <select name="category" value={cat} onChange={e => setCat(e.target.value)}>{canNotice && <option value={NOTICE_CAT}>📢 공지 (전체)</option>}{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
      {tabs.length > 0 && <select name="board_id" defaultValue={defaultTab}><option value="">자유</option>{tabs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
      <div className="topic-pick">
        <div className="muted" style={{ fontSize: 12 }}>어떤 주제인가요?</div>
        <div className="topics">{TOPICS.map(t => <button key={t.key} type="button" className={"topic" + (topic === t.key ? " on" : "")} onClick={() => setTopic(t.key)}><span>{t.icon}</span>{t.name}</button>)}</div>
        <div className="muted" style={{ fontSize: 12 }}>{TOPICS.find(t => t.key === topic)?.hint}</div>
        <input type="hidden" name="topic" value={topic} />
      </div>
      <input name="title" maxLength={80} placeholder="제목" required />
      <textarea name="body" maxLength={4000} placeholder="실명·환자 정보 없이, 솔직하게." required onChange={e => setTxt(e.target.value)} />
      {pm && <label className="warn"><input type="checkbox" name="confirm_anon" /> <span>"<b>{pm}</b>" — 특정 사람을 가리키는 표현 같아요. 실명·식별 정보가 들어가면 <b>명예훼손 책임</b>이 글쓴이에게 생길 수 있어요. 개인을 식별할 수 없는 내용이 맞다면 체크하고 올려주세요.</span></label>}
      <div className="muted" style={{ fontSize: 12 }}>올리면 <a href="/rules" target="_blank">커뮤니티 규칙</a>에 동의한 것으로 봐요. 신고가 들어오면 임시로 가려질 수 있어요.</div>
      {state?.error && <div className="error">{state.error}</div>}
      <Submit />
    </form>
  );
}
