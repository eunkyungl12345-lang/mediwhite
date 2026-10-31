"use client";
import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPost, type FormState } from "@/lib/actions";
import { DEPTS, NOTICE_CAT, TOPICS, SSUM_TOPICS } from "@/lib/depts";
import { personMention, placeMention } from "@/lib/safety";
function Submit({ disabled }: { disabled?: boolean }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending || disabled}>{pending ? "올리는 중…" : disabled ? "수정 후 올리기" : "올리기"}</button>; }
export default function NewPostForm({ defaultCat, defaultTab, defaultTopic = "free", canNotice, boards, defaultTitle = "", defaultBody = "" }: { defaultCat: string; defaultTab: string; defaultTopic?: string; canNotice: boolean; boards: { id: string; name: string; dept: string }[]; defaultTitle?: string; defaultBody?: string }) {
  const [state, action] = useFormState<FormState, FormData>(createPost, undefined);
  const [cat, setCat] = useState(defaultCat);
  const [topic, setTopic] = useState(defaultTopic);
  const [title, setTitle] = useState(defaultTitle);
  const [txt, setTxt] = useState(defaultBody);
  const combined = `${title} ${txt}`.trim();
  const pm = personMention(combined);
  const plm = cat === "썸" ? placeMention(combined) : null;
  const isSsumBlocked = cat === "썸" && !!(plm || pm);
  const tabs = boards.filter(b => b.dept === cat);
  return (
    <form action={action} className="form">
      <div className="bar"><strong>새 글</strong><Link className="link" href="/board">취소</Link></div>
      <select name="category" value={cat} onChange={e => { setCat(e.target.value); if (e.target.value === "썸") setTopic(t => SSUM_TOPICS.some(x => x.key === t) ? t : "moment"); else if (SSUM_TOPICS.some(x => x.key === topic)) setTopic("free"); }}>{canNotice && <option value={NOTICE_CAT}>📢 공지 (전체)</option>}{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}<option value="썸">💘 썸 (썸 탭에만 보여요)</option></select>
      {tabs.length > 0 && <select name="board_id" defaultValue={defaultTab}><option value="">자유</option>{tabs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
      <div className="topic-pick">
        <div className="muted" style={{ fontSize: 12 }}>어떤 주제인가요?</div>
        <div className="topics">{(cat === "썸" ? SSUM_TOPICS : TOPICS).map(t => <button key={t.key} type="button" className={"topic" + (topic === t.key ? " on" : "")} onClick={() => setTopic(t.key)}><span>{t.icon}</span>{t.name}</button>)}</div>
        <div className="muted" style={{ fontSize: 12 }}>{(cat === "썸" ? SSUM_TOPICS : TOPICS as readonly { key: string; hint: string }[]).find(t => t.key === topic)?.hint ?? (cat === "썸" ? "주제를 골라주세요" : "")}</div>
        <input type="hidden" name="topic" value={topic} />
      </div>
      {cat === "썸" && <div className="an-banner">🕶️ 썸 글은 <b>완전 익명</b>으로 올라가요. 닉네임·직종이 안 보이고 댓글도 익명이에요. 실명·병원명(초성 포함)은 안 돼요.</div>}
      <input name="title" maxLength={80} placeholder="제목" required defaultValue={defaultTitle} onChange={e => setTitle(e.target.value)} />
      <textarea name="body" maxLength={4000} placeholder={cat === "썸" ? "초성으로 마음을 전해요 (병원명·병동·실명은 적을 수 없어요)" : "실명·환자 정보 없이, 솔직하게."} required defaultValue={defaultBody} onChange={e => setTxt(e.target.value)} />
      {plm && (
        <div className="warn" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.5 }}>
          🚨 "<b>{plm}</b>" — 썸 글에는 병원명(초성 포함)·병동·층·부서를 쓸 수 없어요. 특정될 수 있으니 지우고 올려주세요! 💘
        </div>
      )}
      {!plm && pm && (cat === "썸" ? (
        <div className="warn" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.5 }}>
          🚨 "<b>{pm}</b>" — 썸 글엔 실명을 쓸 수 없어요. 초성(예: ㄱㅁㅈ 쌤)으로 바꿔주세요! 💘
        </div>
      ) : (
        <label className="warn"><input type="checkbox" name="confirm_anon" /> <span>"<b>{pm}</b>" — 특정 사람을 가리키는 표현 같아요. 실명·식별 정보가 들어가면 <b>명예훼손 책임</b>이 글쓴이에게 생길 수 있어요. 개인을 식별할 수 없는 내용이 맞다면 체크하고 올려주세요.</span></label>
      ))}
      <div className="muted" style={{ fontSize: 12 }}>올리면 <a href="/rules" target="_blank">커뮤니티 규칙</a>에 동의한 것으로 봐요. 신고가 들어오면 임시로 가려질 수 있어요.</div>
      {state?.error && <div className="error">{state.error}</div>}
      <Submit disabled={isSsumBlocked} />
    </form>
  );
}
