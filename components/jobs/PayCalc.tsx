"use client";
import { useState } from "react";
import Link from "next/link";
/** 💰 통장 실수령 계산기 (2026년 근로자 부담 요율 · 1인 가구 · 비과세 식대 20만 원 가정, 간이 추정)
 *  국민연금 4.75%(기준소득 상한 659만) · 건강 3.595% · 장기요양 0.4724% · 고용 0.9% · 소득세+지방소득세 10% */
export function netMonthly(annualMan: number) {
  const G = annualMan * 10000 / 12, taxable = Math.max(0, G - 200000), base = Math.min(Math.max(taxable, 410000), 6590000);
  const pension = base * .0475, health = taxable * .03595, care = taxable * .004724, emp = taxable * .009;
  const S = taxable * 12; // 총급여
  const ded = S <= 5e6 ? S * .7 : S <= 15e6 ? 3.5e6 + (S - 5e6) * .4 : S <= 45e6 ? 7.5e6 + (S - 15e6) * .15 : S <= 1e8 ? 12e6 + (S - 45e6) * .05 : 14.75e6 + (S - 1e8) * .02;
  const tb = Math.max(0, S - ded - 1.5e6 - pension * 12 - (health + care + emp) * 12);
  const calc = tb <= 14e6 ? tb * .06 : tb <= 50e6 ? tb * .15 - 1.26e6 : tb <= 88e6 ? tb * .24 - 5.76e6 : tb <= 150e6 ? tb * .35 - 15.44e6 : tb * .38 - 19.94e6;
  const credit0 = calc <= 1.3e6 ? calc * .55 : 715000 + (calc - 1.3e6) * .3;
  const cap = S <= 33e6 ? 740000 : S <= 70e6 ? Math.max(660000, 740000 - (S - 33e6) * .008) : Math.max(500000, 660000 - (S - 70e6) / 2);
  const tax = Math.max(0, calc - Math.min(credit0, cap)) * 1.1 / 12;
  return Math.round((G - pension - health - care - emp - tax) / 10000);
}
/** 공고 급여 글자 → 연봉 범위(만 원). "연 3,600~4,200만" · "세전 300만"(월) · "실수령 …"(이미 실수령) */
function parse(pay: string): { lo: number; hi: number; net?: boolean } | null {
  const n = (x: string) => Number(x.replace(/,/g, ""));
  const net = pay.match(/실수령\s*([\d,]+)(?:~([\d,]+))?/); if (net && !/연\s*[\d,]/.test(pay)) return { lo: n(net[1]), hi: n(net[2] ?? net[1]), net: true };
  const yr = pay.match(/연\s*([\d,]+)(?:만)?\s*(?:~\s*([\d,]+))?만?/); if (yr) return { lo: n(yr[1]), hi: n(yr[2] ?? yr[1]) };
  const mo = pay.match(/세전\s*([\d,]+)만/); if (mo) return { lo: n(mo[1]) * 12, hi: n(mo[1]) * 12 };
  return null;
}
export default function PayCalc({ pay, signup }: { pay: string; signup: string }) {
  const p = parse(pay); const [open, setOpen] = useState(false); const [ann, setAnn] = useState(p && !p.net ? p.lo : 3600);
  const fmt = (v: number) => v.toLocaleString("ko-KR");
  return <div className="pc">
    <button type="button" className="pc-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>💰 실수령 계산 {open ? "▲" : "▼"}</button>
    {open && <div className="pc-box">
      {p?.net ? <p className="pc-res">공고에 이미 <b>실수령 월 {fmt(p.lo)}{p.hi !== p.lo ? `~${fmt(p.hi)}` : ""}만 원</b>으로 적혀 있어요.</p>
        : <>{p && <p className="pc-res">4대 보험·소득세 공제 후 예상 통장 실수령액<br /><b>약 월 {fmt(netMonthly(p.lo))}{p.hi !== p.lo ? `~${fmt(netMonthly(p.hi))}` : ""}만 원</b></p>}
          <label className="pc-in">{p ? "연봉을 바꿔 보기" : "공고에 금액이 없어요. 연봉을 넣어 보세요"}<span><input type="number" inputMode="numeric" min={1000} max={20000} step={100} value={ann} onChange={e => setAnn(Number(e.target.value) || 0)} />만 원 → <b>월 약 {ann >= 1000 ? fmt(netMonthly(ann)) : "-"}만 원</b></span></label>
          <small className="pc-note">2026년 요율·1인 가구·비과세 식대 20만 원 기준 추정이에요. 퇴직금 포함 연봉이면 더 적어요.</small></>}
      <div className="pc-cta"><span>⚠️ 입사 전 원장 성향·실제 퇴근시간 체크 필수!</span><Link href={signup} className="btn">가입하고 분위기 보기</Link></div>
    </div>}
  </div>;
}
