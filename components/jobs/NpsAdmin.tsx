"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { npsCandidates, npsLink, npsUnlink } from "@/lib/nps.actions";
/** 🛠️ 관리자: 국민연금 사업장 연결 */
export default function NpsAdmin({ hid, linked }: { hid: number; linked: boolean }) {
  const [q, setQ] = useState(""), [list, setList] = useState<any[] | null>(null), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false); const r = useRouter();
  const find = async () => { setBusy(true); setMsg(""); const x: any = await npsCandidates(hid, q); setBusy(false); if (x.error) setMsg("⚠️ " + x.error); else { setList(x.list); if (!x.list.length) setMsg("후보가 없어요. 이름을 줄여서 검색해보세요 (예: '척척마취')"); } };
  return <details className="nps-admin"><summary>🛠️ 국민연금 데이터 연결 (관리자){linked ? " · 연결됨" : ""}</summary>
    <div className="row" style={{ gap: 6 }}><input value={q} onChange={e => setQ(e.target.value)} placeholder="사업장명 (비우면 병원 이름)" style={{ flex: 1 }} /><button type="button" className="btn ghost" disabled={busy} onClick={find}>{busy ? "찾는 중…" : "후보 찾기"}</button>{linked && <button type="button" className="btn ghost" onClick={async () => { await npsUnlink(hid); r.refresh(); }}>해제</button>}</div>
    {list?.map(c => <button key={c.seq} type="button" className="rv-hit" disabled={busy} onClick={async () => { setBusy(true); const x: any = await npsLink(hid, c.seq, c.name, c.addr); setBusy(false); setMsg(x.error ? "⚠️ " + x.error : "✅ " + x.ok); if (!x.error) { setList(null); r.refresh(); } }}><b>{c.name}</b> <small className="muted">{c.addr}</small></button>)}
    {msg && <small>{msg}</small>}
  </details>;
}
