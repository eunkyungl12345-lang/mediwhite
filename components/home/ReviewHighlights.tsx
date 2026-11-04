import Link from "next/link";
import { db } from "@/lib/supabase";
import { overall } from "@/lib/jobs";
/** 🏥 요즘 리뷰가 올라온 병원 — 잡플래닛 '#연봉 언급 TOP' 카드처럼: 한 줄 제목 + 장점 맛보기 + 병원 */
export default async function ReviewHighlights() {
  const d = db();
  const [{ data: revs }, { data: facts }] = await Promise.all([
    d.from("hospital_reviews").select("hospital_id,pros,dept,status,created_at,r_welfare,r_balance,r_pay,r_culture,r_growth").eq("hidden", false).order("created_at", { ascending: false }).limit(12),
    d.from("game_state").select("game,state,updated_at").like("game", "hfact:%").order("updated_at", { ascending: false }).limit(40),
  ]);
  type C = { hid: number; title: string; pros?: string; star?: number; meta: string };
  const cards: C[] = [];
  for (const f of facts ?? []) { const s: any = f.state; if (s?.last) cards.push({ hid: Number(String(f.game).slice(6)), title: s.last, star: s.overall, meta: s.status === "퇴사" ? "퇴사자" : "현직자" }); }
  for (const r of revs ?? []) cards.push({ hid: r.hospital_id, title: r.pros.split(/[.!?\n]/)[0].slice(0, 40), pros: r.pros, star: overall([r]), meta: `${r.dept} · ${r.status}` });
  const seen = new Set<number>(), pick = cards.filter(c => !seen.has(c.hid) && seen.add(c.hid)).slice(0, 6);
  if (!pick.length) return <Link href="/hospitals/check" className="rh-empty"><b>🏥 내가 다닌 병원, 첫 리뷰의 주인공이 되어주세요</b><span>급여·분위기·별점을 1분 만에 · 익명</span></Link>;
  const { data: hs } = await d.from("hospitals").select("id,name,region").in("id", pick.map(c => c.hid));
  return <section className="rh"><div className="ht-h"><b>🏥 요즘 리뷰가 올라온 병원</b><Link href="/hospitals">전체보기 ›</Link></div>
    <div className="rh-row">{pick.map(c => { const h = (hs ?? []).find(x => x.id === c.hid); if (!h) return null; return <Link key={c.hid} href={`/hospitals/${c.hid}`} className="rh-card">
      <b>“{c.title}”</b>{c.pros && <p><em>장점</em>{c.pros.slice(0, 26)}…</p>}<span className="rh-more">자세히 보기 ›</span>
      <div className="rh-h"><span>🏥</span><div><strong>{h.name}</strong><small>{c.star ? `★ ${c.star.toFixed(1)} · ` : ""}{c.meta} · {h.region}</small></div></div></Link>; })}</div></section>;
}
