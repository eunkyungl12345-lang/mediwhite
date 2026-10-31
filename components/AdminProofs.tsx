"use client";
import { useState, useTransition } from "react";
import { decideProof, badgeSignedUrls } from "@/lib/badge.actions";
import { useRouter } from "next/navigation";
type P = { id: number; path: string; created_at: string; user: { nickname: string; dept: string; username: string } | null; hospital: { name: string; region: string } | null; review: { dept: string; status: string; pros: string } | null };
export default function AdminProofs({ items }: { items: P[] }) {
  const [urls, setUrls] = useState<Record<number, string>>({}), [reason, setReason] = useState<Record<number, string>>({}), [p, start] = useTransition(); const r = useRouter();
  if (!items.length) return <div className="muted">대기 중인 인증이 없어요.</div>;
  return <div style={{ display: "grid", gap: 10 }}>{items.map(q => <div key={q.id} className="card" style={{ padding: 10, display: "grid", gap: 8 }}>
    <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>🏥 {q.hospital?.name} <span className="muted">({q.hospital?.region})</span></b><span className="muted" style={{ fontSize: 12 }}>{new Date(q.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span></div>
    <div className="muted" style={{ fontSize: 13 }}>신청자 [{q.user?.dept}]{q.user?.nickname} @{q.user?.username} · 리뷰: {q.review?.dept} {q.review?.status} · “{q.review?.pros.slice(0, 60)}”</div>
    {urls[q.id] ? <a href={urls[q.id]} target="_blank" rel="noreferrer"><img src={urls[q.id]} alt="" style={{ maxWidth: 320, maxHeight: 240, borderRadius: 8, border: "1px solid var(--line)" }} /></a>
      : <button type="button" className="btn ghost" disabled={p} onClick={() => start(async () => { const u = await badgeSignedUrls([q.path]); setUrls(s => ({ ...s, [q.id]: u[0] })); })}>🔍 서류 보기 (10분 링크)</button>}
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      <button type="button" className="btn" disabled={p} onClick={() => start(async () => { await decideProof(q.id, true); r.refresh(); })}>✅ 승인</button>
      <input value={reason[q.id] ?? ""} onChange={e => setReason(s => ({ ...s, [q.id]: e.target.value }))} placeholder="거절 사유 (선택)" maxLength={100} style={{ flex: 1, minWidth: 140 }} />
      <button type="button" className="btn ghost" disabled={p} onClick={() => { if (confirm("거절할까요?")) start(async () => { await decideProof(q.id, false, reason[q.id] ?? ""); r.refresh(); }); }}>거절</button>
    </div>
  </div>)}</div>;
}
