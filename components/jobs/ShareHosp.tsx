"use client";
import { useState } from "react";
/** 🔗 병원 페이지 공유 — 로그인 없이 보이는 맛보기 링크(/h/<id>) */
export default function ShareHosp({ hid, name }: { hid: number; name: string }) {
  const [done, setDone] = useState(false);
  const share = async () => { const url = `${location.origin}/h/${hid}`, text = `${name} 이직 전에 실수령부터 확인해요 — 메디화이트`;
    try { if (navigator.share) { await navigator.share({ title: name, text, url }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); setDone(true); setTimeout(() => setDone(false), 2000); } catch {} };
  return <button type="button" className="btn ghost sh-btn" onClick={share}>{done ? "✅ 링크 복사됨" : "🔗 단톡방에 공유"}</button>;
}
