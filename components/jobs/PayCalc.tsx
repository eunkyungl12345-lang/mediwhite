"use client";
import { useState } from "react";
import Link from "next/link";
import { netMonthly } from "./PayCalc.calc";
export { netMonthly };

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
      <div className="pc-cta"><span>⚠️ 입사 전 원장 성향·실제 퇴근시간 체크 필수!</span><Link href={signup} className="btn">🔓 가입하고 실수령·분위기 보기</Link></div>
    </div>}
  </div>;
}
