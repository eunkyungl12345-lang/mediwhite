"use client";
import { useState } from "react";
import Link from "next/link";
import { netMonthly } from "@/components/jobs/PayCalc";
const YEARS = ["신규·1년 미만", "1~3년", "4~7년", "8년 이상"];
/** 💳 내 통장 실수령 카드 — 병원 이름이 없어서 공유해도 안전한 결과물.
 *  '같은 직종 상위 %'는 실제 체크가 min명 이상 모인 직종만 계산 (dist). 모자라면 숫자를 지어내지 않고 '모으는 중'으로 표시 */
export default function PayCard({ depts, dist, cnt, min }: { depts: string[]; dist: Record<string, number[]>; cnt: Record<string, number>; min: number }) {
  const [dept, setDept] = useState("간호사"), [yrs, setYrs] = useState(YEARS[1]), [ann, setAnn] = useState(3600), [hrs, setHrs] = useState(40), [done, setDone] = useState("");
  const ok = ann >= 1000 && ann <= 30000 && hrs >= 10 && hrs <= 80, net = ok ? netMonthly(ann) : 0;
  const hourly = ok ? Math.round(net * 10000 / (hrs * 4.345) / 10) * 10 : 0, perMin = Math.round(hourly / 60);
  const arr = dist[dept], top = arr && ok ? Math.max(1, Math.round((1 - arr.filter(v => v < net).length / arr.length) * 100)) : null, have = cnt[dept] ?? 0;
  const fmt = (v: number) => v.toLocaleString("ko-KR");
  const text = `💳 내 통장 실수령 카드\n${dept} · ${yrs}\n월 실수령 약 ${fmt(net)}만 원 · 진짜 시급 ${fmt(hourly)}원${top ? `\n같은 직종 상위 ${top}%` : ""}\n\n너도 계산해봐 👉`;
  const share = async () => { const url = `${location.origin}/pay`;
    try { if (navigator.share) { await navigator.share({ title: "내 통장 실수령 카드", text, url }); return; } } catch (e) { if ((e as Error)?.name === "AbortError") return; /* 사용자가 직접 닫은 경우만 끝. 카톡·네이버 인앱처럼 공유창이 실패하면 아래 복사로 */ }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setDone("✅ 복사됐어요. 단톡방에 붙여넣기!"); setTimeout(() => setDone(""), 2500); } catch { setDone("복사가 안 됐어요. 화면을 캡처해 주세요"); } };
  return <div className="pcd">
    <div className="pcd-form">
      <label>직종<select value={dept} onChange={e => setDept(e.target.value)}>{depts.map(d => <option key={d}>{d}</option>)}</select></label>
      <label>연차<select value={yrs} onChange={e => setYrs(e.target.value)}>{YEARS.map(y => <option key={y}>{y}</option>)}</select></label>
      <label>세전 연봉 (만 원)<input type="number" inputMode="numeric" min={1000} max={30000} step={100} value={ann || ""} onChange={e => setAnn(Math.round(Number(e.target.value) || 0))} /></label>
      <label>주 근무시간 (실제로 일하는 시간)<input type="number" inputMode="numeric" min={10} max={80} value={hrs || ""} onChange={e => setHrs(Number(e.target.value) || 0)} /></label>
    </div>
    {ok ? <>
      <div className="pcd-card" aria-live="polite">
        <div className="pcd-top"><span>{dept} · {yrs}</span><span>메디화이트</span></div>
        <small>매달 통장에 찍히는 돈</small>
        <b className="pcd-net">약 {fmt(net)}<i>만 원</i></b>
        <div className="pcd-row"><div><small>진짜 시급</small><b>{fmt(hourly)}원</b></div><div><small>1분에</small><b>{fmt(perMin)}원</b></div><div><small>세전 연봉</small><b>{fmt(ann)}만</b></div></div>
        {top ? <p className="pcd-pct">같은 직종 <b>상위 {top}%</b> <small>({arr!.length}명 체크 기준)</small></p>
          : <p className="pcd-pct wait">같은 직종 비교는 <b>모으는 중</b> <small>({have}/{min}명 · {min}명 모이면 ‘상위 몇 %’가 열려요)</small></p>}
      </div>
      <div className="pcd-acts"><button type="button" className="btn" onClick={share}>📤 단톡방에 공유</button><Link href="/login?mode=signup&next=/hospitals/check&from=pay" className="btn ghost">🔎 다녔던 병원 체크하고 비교 열기</Link></div>
      {done && <p className="pcd-done" role="status">{done}</p>}
    </> : <p className="muted" style={{ margin: 0 }}>연봉(1,000~30,000만 원)과 주 근무시간(10~80시간)을 넣어 주세요.</p>}
  </div>;
}
