import Link from "next/link";
import { BADGE_N, hireSignal, type FactAgg } from "@/lib/hospFacts";
import { AFTER2 } from "@/lib/hospExtra";
/** 🚦 고용안정성 신호등 — 병원명 바로 밑. 직종별로 2명 이상 답해야 켜져요 (1명 답으로 병원에 딱지를 붙이지 않게) */
export default function HireSignal({ a, hid, locked, after2 }: { a: FactAgg; hid: number; locked?: boolean; after2: number[] }) {
  const on = a.hire.filter(h => h.total >= BADGE_N), wait = a.hire.reduce((n, h) => n + (h.total < BADGE_N ? h.total : 0), 0), a2n = after2.reduce((x, y) => x + y, 0);
  const cta = <Link href={`/hospitals/check?id=${hid}`} className="hs-cta">내 직종 제보하기 ›</Link>;
  if (locked && on.length) return <div className="hs-sig"><div className="hs-row t1"><span className="hs-ico">🔒</span><div><b>고용안정성 신호등 {on.length}개 직종</b><small>다녔던 병원 1곳만 제보하면 바로 열려요</small></div></div>{cta}</div>;
  return <div className="hs-sig" aria-label="고용안정성 신호등">
    <span className="hs-kick">🚦 고용안정성 신호등</span>
    {on.map(h => { const L = hireSignal(h); return <div key={h.dept} className={"hs-row t" + L.t}><span className="hs-ico">{L.icon}</span><div><b>{h.dept}: {L.tag}</b><small>{h.total}명 응답{L.t !== 3 && h.n ? ` · 체감 전환율 평균 ${h.avg}%` : ""}</small></div></div>; })}
    {!on.length && <div className="hs-row t9"><span className="hs-ico">⚪</span><div><b>{wait ? "신호등이 곧 켜져요" : "아직 꺼져 있어요"}</b><small>{wait ? `${wait}명이 답했어요. 같은 직종에서 1명만 더 답하면 켜져요` : "이 병원의 계약직 → 정규직 전환 현실을 처음으로 알려주세요"}</small></div></div>}
    {!locked && a2n >= BADGE_N && <div className="hs-a2"><span>2년 채우면?</span>{AFTER2.map((n, i) => after2[i] ? <em key={n} className={"a" + i}>{n} <b>{after2[i]}</b></em> : null)}</div>}
    {cta}
  </div>;
}
