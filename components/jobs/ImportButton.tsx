"use client";
import { useState } from "react";
import { runJobImport } from "@/lib/jobActions";
export default function ImportButton() {
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  return <div className="jb-admin"><button type="button" className="btn ghost" disabled={busy} onClick={async () => { setBusy(true); setMsg(""); const r = await runJobImport(); setBusy(false); setMsg(r.ok ? `✅ 공고 ${r.fetched}건 중 병원 ${r.hospitals}건 확인 · 새로 ${r.added}건 등록` : `⚠️ ${r.error}`); }}>{busy ? "가져오는 중…" : "🏛️ 공공 병원 채용 지금 가져오기"}</button>{msg && <small>{msg}</small>}</div>;
}
