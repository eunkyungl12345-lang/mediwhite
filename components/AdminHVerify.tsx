"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideHVerify, hverifyPhoto } from "@/lib/hverify.actions";
type Req = { uid: string; hid: number; kind: "work" | "exit"; at: string; hospital: { name: string; region: string } | null; user: { nickname: string; dept: string; username: string } | null };
/** 관리자: 병원 재직/퇴사 인증 심사 — 사진 안 닉네임 포스트잇이 이 계정 닉네임과 같은지, 병원 이름이 맞는지 */
export default function AdminHVerify({ reqs }: { reqs: Req[] }) {
  const [url, setUrl] = useState<Record<string, string>>({}), [why, setWhy] = useState<Record<string, string>>({}), [p, start] = useTransition(); const r = useRouter();
  if (!reqs.length) return <div className="muted">대기 중인 신청이 없어요.</div>;
  return <div style={{ display: "grid", gap: 10 }}>{reqs.map(q => { const k = q.uid + ":" + q.hid; return <div key={k} className="card" style={{ padding: 10, display: "grid", gap: 8 }}>
    <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>{q.kind === "work" ? "🏥 재직" : "🚪 퇴사"} · {q.hospital?.name} <span className="muted">{q.hospital?.region}</span></b><span className="muted" style={{ fontSize: 12 }}>{new Date(q.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span></div>
    <div style={{ fontSize: 13 }}>신청자 <b>[{q.user?.dept}]{q.user?.nickname}</b> <span className="muted">@{q.user?.username}</span> — 포스트잇에 <b>“{q.user?.nickname}”</b>이 있고, {q.kind === "work" ? "명찰" : "서류"}의 병원이 <b>{q.hospital?.name}</b>인지 확인</div>
    {url[k] ? <a href={url[k]} target="_blank" rel="noreferrer"><img src={url[k]} alt="" style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8, border: "1px solid var(--line)" }} /></a>
      : <button type="button" className="btn ghost" disabled={p} onClick={() => start(async () => { const u = await hverifyPhoto(q.uid, q.hid); setUrl(s => ({ ...s, [k]: u })); })}>🔍 사진 보기 (10분 링크)</button>}
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      <button type="button" className="btn" disabled={p} onClick={() => start(async () => { await decideHVerify(q.uid, q.hid, true); r.refresh(); })}>✅ 승인</button>
      <input value={why[k] ?? ""} onChange={e => setWhy(s => ({ ...s, [k]: e.target.value }))} placeholder="거절 사유 (예: 포스트잇 닉네임이 안 보여요)" maxLength={100} style={{ flex: 1, minWidth: 140 }} />
      <button type="button" className="btn ghost" disabled={p} onClick={() => { if (confirm("거절할까요?")) start(async () => { await decideHVerify(q.uid, q.hid, false, why[k] ?? ""); r.refresh(); }); }}>거절</button>
    </div></div>; })}</div>;
}
