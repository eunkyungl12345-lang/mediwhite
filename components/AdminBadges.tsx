"use client";
import { useState, useTransition } from "react";
import { decideBadge, badgeSignedUrls } from "@/lib/badge.actions";
import { useRouter } from "next/navigation";
type Req = { id: number; user_id: string; id_path: string; lic_path: string; note: string | null; created_at: string; user: { nickname: string; dept: string; username: string } | null };
export default function AdminBadges({ reqs }: { reqs: Req[] }) {
  const [urls, setUrls] = useState<Record<number, string[]>>({}), [reason, setReason] = useState<Record<number, string>>({}), [p, start] = useTransition(); const r = useRouter();
  if (!reqs.length) return <div className="muted">대기 중인 신청이 없어요.</div>;
  return <div style={{ display: "grid", gap: 10 }}>{reqs.map(q => <div key={q.id} className="card" style={{ padding: 10, display: "grid", gap: 8 }}>
    <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>[{q.user?.dept}]{q.user?.nickname} <span className="muted">@{q.user?.username}</span></b><span className="muted" style={{ fontSize: 12 }}>{new Date(q.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span></div>
    {q.note && <div className="muted" style={{ fontSize: 13 }}>“{q.note}”</div>}
    {urls[q.id] ? <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{urls[q.id].map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{ maxWidth: 260, maxHeight: 200, borderRadius: 8, border: "1px solid var(--line)" }} /></a>)}</div>
      : <button type="button" className="btn ghost" disabled={p} onClick={() => start(async () => { const u = await badgeSignedUrls([q.id_path, q.lic_path]); setUrls(s => ({ ...s, [q.id]: u })); })}>🔍 서류 보기 (10분 링크)</button>}
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      <button type="button" className="btn" disabled={p} onClick={() => start(async () => { await decideBadge(q.id, true); r.refresh(); })}>✅ 승인</button>
      <input value={reason[q.id] ?? ""} onChange={e => setReason(s => ({ ...s, [q.id]: e.target.value }))} placeholder="거절 사유 (선택)" maxLength={100} style={{ flex: 1, minWidth: 140 }} />
      <button type="button" className="btn ghost" disabled={p} onClick={() => { if (confirm("거절할까요?")) start(async () => { await decideBadge(q.id, false, reason[q.id] ?? ""); r.refresh(); }); }}>거절</button>
    </div>
  </div>)}</div>;
}
