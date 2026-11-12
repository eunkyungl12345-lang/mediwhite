import Link from "next/link";
import { db } from "@/lib/supabase";
import { getFocus } from "@/lib/focus";
import { loadFacts } from "@/lib/hospFactsDb";
import { MIN_N } from "@/lib/hospFacts";
import { loadDistricts } from "@/lib/districtDb";
/** 📍 집중 지역 챌린지 — "○○ 병원 실체 지도" 채우기. 정보가 공개된 병원 수 / 목표, 1~2명만 더 오면 열리는 병원 */
export default async function FocusCard() {
  const f = await getFocus(); if (!f) return null;
  const { data: all } = await db().from("hospitals").select("id,name,kind").eq("region", f.region).limit(2000);
  const dist = f.gus.length ? await loadDistricts((all ?? []).map(h => h.id)) : {}; const hs = f.gus.length ? (all ?? []).filter(h => f.gus.includes(dist[h.id])) : all;
  const facts = await loadFacts((hs ?? []).map(h => h.id));
  const open = (hs ?? []).filter(h => (facts[h.id]?.n ?? 0) >= MIN_N).length, near = (hs ?? []).filter(h => { const n = facts[h.id]?.n ?? 0; return n > 0 && n < MIN_N; }).sort((a, b) => (facts[b.id]?.n ?? 0) - (facts[a.id]?.n ?? 0)).slice(0, 3);
  const pct = Math.min(100, Math.round(open / f.goal * 100));
  return <div className="fc">
    <div className="fc-h"><b>📍 {f.label} 병원 실체 지도</b><span>{open} / {f.goal}곳 공개</span></div>
    <div className="fc-bar"><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
    <small>{f.label} 병원·약국마다 {MIN_N}명이 제보하면 실수령·분위기·리스크가 열려요. 같이 채워요!</small>
    {near.length > 0 && <div className="fc-near">{near.map(h => <Link key={h.id} href={`/hospitals/check?id=${h.id}`}><b>{h.name}</b><em>{MIN_N - (facts[h.id]?.n ?? 0)}명만 더!</em></Link>)}</div>}
    <Link href="/hospitals/check" className="btn">🔎 내가 아는 {f.label} 병원 제보하기</Link>
  </div>;
}
