"use client";
import { useState } from "react";
import type { Rank } from "@/lib/ranks";
import Name from "./Name";
import Reactions from "./Reactions";
import ReportButton from "./ReportButton";
import CommentForm from "./CommentForm";
import { deleteComment } from "@/lib/actions";

export type CItem = { id: number; author_id: string; text: string; created: string; hidden: boolean; parent_id: number | null; r: Rank; author: { dept: string; nickname: string; username: string; blue_badge?: boolean } | null; label?: string; labelColor?: string; counts: Record<string, number>; mine: string | null };
type Props = { postId: string; items: CItem[]; meId: string; admin: boolean; anon?: boolean };

function Menu({ canDelete, onDelete, reportId }: { canDelete: boolean; onDelete: () => void; reportId: string | null }) {
  const [o, setO] = useState(false);
  return <span className="cm-menu"><button type="button" className="cm-kebab" aria-label="더보기" onClick={() => setO(!o)}>⋮</button>
    {o && <div className="cm-pop" onMouseLeave={() => setO(false)}>{canDelete && <button type="button" onClick={() => { if (confirm("삭제할까요?")) onDelete(); }}>삭제</button>}{reportId && <ReportButton kind="comment" id={reportId} />}<button type="button" onClick={() => setO(false)}>닫기</button></div>}</span>;
}
function One({ c, postId, meId, admin, anon, depth, onReply }: { c: CItem; postId: string; meId: string; admin: boolean; anon?: boolean; depth: number; onReply: (id: number) => void }) {
  const mine = c.author_id === meId, blind = c.hidden && !admin && !mine;
  return <div className={"cm" + (depth ? " cm-reply" : "") + (mine ? " cm-mine" : "")}>
    <div className="cm-head">
      {anon ? <span className="cm-anon" style={{ color: c.labelColor }}>{c.label}</span> : c.author ? <Name r={c.r} dept={c.author.dept} nickname={c.author.nickname} username={c.author.username} badge={c.author.blue_badge} /> : <span className="muted">탈퇴한 회원</span>}
      <span className="cm-time">{c.created}</span>
      <Menu canDelete={admin || mine} onDelete={() => deleteComment(c.id, postId)} reportId={mine ? null : String(c.id)} />
    </div>
    {blind ? <div className="cm-text muted">🚩 신고로 임시 블라인드된 댓글이에요.</div> : <div className="cm-text">{c.hidden && <span className="tag" style={{ background: "#E2574C", color: "#fff", marginRight: 6 }}>블라인드 중</span>}{c.text}</div>}
    <div className="cm-foot"><button type="button" className="cm-act" onClick={() => onReply(c.id)}>답글달기</button><span className="cm-dot">·</span><Reactions kind="comment" id={String(c.id)} compact counts={c.counts} mine={c.mine} /></div>
  </div>;
}
export default function CommentThread({ postId, items, meId, admin, anon }: Props) {
  const [reply, setReply] = useState<number | null>(null), [open, setOpen] = useState<Record<number, boolean>>({});
  const roots = items.filter(c => !c.parent_id), kids = (id: number) => items.filter(c => c.parent_id === id);
  return <div className="cm-list">
    {!items.length && <div className="cm-empty">첫 댓글을 남겨보세요.</div>}
    {roots.map(c => { const rs = kids(c.id), show = open[c.id] || rs.length <= 3, vis = show ? rs : rs.slice(0, 2); return <div key={c.id} className="cm-group">
      <One c={c} postId={postId} meId={meId} admin={admin} anon={anon} depth={0} onReply={id => setReply(reply === id ? null : id)} />
      {vis.map(r => <One key={r.id} c={r} postId={postId} meId={meId} admin={admin} anon={anon} depth={1} onReply={() => setReply(reply === c.id ? null : c.id)} />)}
      {!show && <button type="button" className="cm-more" onClick={() => setOpen(o => ({ ...o, [c.id]: true }))}>답글 {rs.length - 2}개 더보기</button>}
      {reply === c.id && <div className="cm-replyform"><CommentForm postId={postId} parentId={c.id} placeholder="답글 달기" autoFocus label="답글" onDone={() => setReply(null)} /></div>}
    </div>; })}
  </div>;
}
