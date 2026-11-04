"use client";
import { useState } from "react";
/** 💰 내 급여 위치 — 같은 직종 실수령 분포 곡선 위에 '내 위치' (잡플래닛 연봉 위치처럼, 우리 데이터로) */
export default function SalaryCurve({ ranges, byDept, depts, myDept, myPay, minN }: { ranges: readonly string[]; byDept: Record<string, number[]>; depts: string[]; myDept: string; myPay?: string; minN: number }) {
  const [dept, setDept] = useState(depts.includes(myDept) ? myDept : "전체"), [pay, setPay] = useState(myPay ?? "");
  const c = byDept[dept] ?? ranges.map(() => 0), n = c.reduce((a, b) => a + b, 0), max = Math.max(1, ...c);
  const W = 340, H = 150, step = W / (ranges.length - 1), pts = c.map((v, i) => [i * step, H - 10 - (v / max) * (H - 30)] as const);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const pi = ranges.indexOf(pay), below = pi >= 0 ? c.slice(0, pi).reduce((a, b) => a + b, 0) + c[pi] / 2 : 0, top = n && pi >= 0 ? Math.max(1, Math.round((1 - below / n) * 100)) : null;
  return <div className="sc">
    <div className="sc-tabs">{["전체", ...depts].map(d => <button key={d} type="button" className={dept === d ? "on" : ""} onClick={() => setDept(d)}>{d}</button>)}</div>
    {n < minN ? <div className="fb fb-wait"><b>{dept} 급여 데이터가 모이는 중이에요 ({n}명)</b><p>{minN}명 이상 모이면 분포가 열려요. 내 병원 체크하면서 실수령을 알려주세요.</p></div> : <>
      <svg viewBox={`-10 0 ${W + 20} ${H + 24}`} className="sc-svg" role="img" aria-label="실수령 분포">
        <defs><linearGradient id="scg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3CC07A" stopOpacity=".45" /><stop offset="1" stopColor="#3CC07A" stopOpacity="0" /></linearGradient></defs>
        <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#scg)" /><path d={path} fill="none" stroke="#2EAF6A" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#2EAF6A" strokeWidth="1.5" />)}
        {pi >= 0 && <><line x1={pi * step} x2={pi * step} y1={pts[pi][1]} y2={H} stroke="#1F7A4C" strokeWidth="2" /><circle cx={pi * step} cy={pts[pi][1]} r="7" fill="#fff" stroke="#1F7A4C" strokeWidth="4" /></>}
        {ranges.map((r, i) => i % 2 === 0 ? <text key={r} x={i * step} y={H + 18} fontSize="9.5" textAnchor="middle" fill="currentColor" opacity=".55">{r}</text> : null)}
      </svg>
      <div className="sc-me">{top != null ? <><b>내 위치: 상위 {top}%</b><span>{dept} {n}명 중 · 세후 {pay}만원</span></> : <span>아래에서 내 실수령을 고르면 위치를 보여줘요</span>}</div>
    </>}
    <div className="hc-chips">{ranges.map(r => <label key={r}><input type="radio" name="mypay" checked={pay === r} onChange={() => setPay(r)} /><span>{r}</span></label>)}</div>
    <small className="muted">회원이 실체 체크에 남긴 세후 실수령(만원) 구간을 합친 분포예요. 내 선택은 저장되지 않아요.</small>
  </div>;
}
