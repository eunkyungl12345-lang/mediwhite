"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import { createPost, type FormState } from "@/lib/actions";
import { ANON_CAT, ANON_TOPICS } from "@/lib/depts";
export default function AnonPostForm({ defaultTopic = "free" }: { defaultTopic?: string }) {
  const [st, action] = useFormState<FormState, FormData>(createPost, undefined), [topic, setTopic] = useState(defaultTopic), [txt, setTxt] = useState("");
  return (
    <form action={action} className="form an-form">
      <input type="hidden" name="category" value={ANON_CAT} /><input type="hidden" name="topic" value={topic} />
      <div className="an-banner">🕶️ 이 글은 <b>완전 익명</b>으로 올라가요. 닉네임·직종·계급 모두 안 보여요. 대신 실명·병원명·특정인 비방은 안 돼요.</div>
      <div className="topics scroll">{ANON_TOPICS.map(t => <button key={t.key} type="button" className={"topic" + (topic === t.key ? " on" : "")} onClick={() => setTopic(t.key)}><span>{t.icon}</span>{t.name}</button>)}</div>
      <input name="title" maxLength={80} placeholder="제목" required />
      <textarea name="body" maxLength={4000} rows={8} placeholder="아무도 모르니까, 솔직하게." required onChange={e => setTxt(e.target.value)} />
      <div className="muted" style={{ fontSize: 12, textAlign: "right" }}>{txt.length}/4000</div>
      {st?.error && <div className="error">{st.error}</div>}
      <button className="btn">🕶️ 익명으로 올리기</button>
    </form>
  );
}
