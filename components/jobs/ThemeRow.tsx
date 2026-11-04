import Link from "next/link";
import { MIN_N, type FactAgg } from "@/lib/hospFacts";
/** 🏷️ 전·현직원이 인정한 — 잡플래닛 '리뷰로 찾은 채용공고'처럼 실체 체크로 고른 테마별 병원 */
const THEMES: { key: string; t: string; d: string; icon: string; bg: string; pick: (a: FactAgg) => number | null; fmt: (v: number) => string }[] = [
  { key: "pay", t: "급여 만족", d: "별점 급여가 높은 곳", icon: "💰", bg: "#FFF4D6", pick: a => a.stars.find(x => x.k === "pay")?.avg || null, fmt: v => `급여 ★${v.toFixed(1)}` },
  { key: "off", t: "칼퇴하는 곳", d: "대부분 제때 퇴근", icon: "🕕", bg: "#E3F2EA", pick: a => { const m = a.mood.find(x => x.k === "off"); return m ? Math.round(m.counts[0] / a.n * 100) : null; }, fmt: v => `칼퇴 ${v}%` },
  { key: "taeum", t: "태움 없는 곳", d: "태움·갑질 거의 없음", icon: "🤝", bg: "#E8EEFF", pick: a => { const m = a.mood.find(x => x.k === "taeum"); return m ? Math.round(m.counts[0] / a.n * 100) : null; }, fmt: v => `태움 없음 ${v}%` },
  { key: "rec", t: "추천받는 곳", d: "동료에게 추천해요", icon: "👍", bg: "#FFE8EE", pick: a => a.recN >= MIN_N ? a.recPct : null, fmt: v => `추천 ${v}%` },
];
export default function ThemeRow({ hs, facts }: { hs: { id: number; name: string }[]; facts: Record<number, FactAgg> }) {
  const cards = THEMES.map(th => ({ th, top: hs.filter(h => (facts[h.id]?.n ?? 0) >= (facts[h.id]?.need ?? MIN_N)).map(h => ({ h, v: th.pick(facts[h.id]) })).filter(x => x.v != null && x.v > 0).sort((a, b) => b.v! - a.v!).slice(0, 3) })).filter(c => c.top.length);
  if (!cards.length) return null;
  return <section className="th"><h3>전·현직원이 인정한</h3><div className="th-row">{cards.map(({ th, top }) => <div key={th.key} className="th-card" style={{ background: th.bg }}>
    <span className="th-ic">{th.icon}</span><b>{th.t}</b><small>{th.d}</small>
    {top.map(({ h, v }) => <Link key={h.id} href={`/hospitals/${h.id}`}><em>{h.name}</em><i>{th.fmt(v!)}</i></Link>)}</div>)}</div></section>;
}
