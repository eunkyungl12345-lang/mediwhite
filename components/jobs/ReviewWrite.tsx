"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import HospCheck from "./HospCheck";
import RegionPick from "./RegionPick";
import { submitHospExtra } from "@/lib/hospExtra.actions";
import { searchHospitals } from "@/lib/jobActions";
import { JOB_DEPTS, HOSP_KINDS } from "@/lib/jobs";
import { X_YEARS, CONTRACT, PAY_YEAR, ALBA_UNIT, ALBA_TAX, ALBA_MEAL, ALBA_LOAD } from "@/lib/hospExtra";
import { netMonthly } from "./PayCalc";
import type { HFact } from "@/lib/hospFacts";
type Hosp = { id: number; name: string; region: string; kind?: string };
type T = "hosp" | "pay" | "alba";
const TABS: { k: T; icon: string; n: string; sub: string; tip: string }[] = [
  { k: "hosp", icon: "🏥", n: "병원 리뷰", sub: "분위기·퇴근·실수령", tip: "실제 퇴근 시간, 분위기, 실수령 구간처럼 입사해야만 아는 걸 탭 몇 번으로 알려주세요. 1분이면 끝나요." },
  { k: "pay", icon: "💰", n: "연봉 리뷰", sub: "숫자로 남기는 연봉", tip: "세전 연봉과 연차·계약 형태만 적으면 돼요. 같은 병원에 3명 이상 모이면 범위로만 공개돼요." },
  { k: "alba", icon: "⏱", n: "알바·단기 리뷰", sub: "일급·식사·업무", tip: "일급·근무 시간·식사·세금 처리, 그리고 다음에 가는 사람을 위한 인계 한마디를 남겨주세요." },
];
function Send({ label }: { label: string }) { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "저장 중…" : label}</button>; }
const Chips = ({ name, opts, values, def }: { name: string; opts: readonly string[]; values?: (string | number)[]; def?: string | number }) =>
  <div className="hc-chips">{opts.map((o, i) => { const v = values ? values[i] : o; return <label key={o}><input type="radio" name={name} value={v} defaultChecked={def !== undefined && String(def) === String(v)} /><span>{o}</span></label>; })}</div>;
function Stars({ name }: { name: string }) { const [v, setV] = useState(0); const W = ["", "많이 아쉬워요", "아쉬워요", "보통", "만족", "아주 만족"];
  return <span className="hc-stars big">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={v >= n ? "on" : ""} onClick={() => setV(n)} aria-label={`${n}점`}>★</button>)}<em className="hc-sw">{W[v]}</em><input type="hidden" name={name} value={v || ""} /></span>; }
/** 병원 고르기 (검색 → 선택, 없으면 새로 등록) */
function HospPick({ hospital }: { hospital?: Hosp | null }) {
  const [q, setQ] = useState(""), [hits, setHits] = useState<Hosp[]>([]), [picked, setPicked] = useState<Hosp | null>(hospital ?? null), [isNew, setIsNew] = useState(false);
  const search = async (v: string) => { setQ(v); setPicked(null); setIsNew(false); setHits(v.trim() ? await searchHospitals(v) : []); };
  return <div className="rw-f"><label htmlFor="rw-h">병원 이름</label>
    <div className="rv-pick"><input id="rw-h" value={picked ? `${picked.name} (${picked.region})` : q} onChange={e => search(e.target.value)} placeholder="병원·의원·약국 이름 검색" autoComplete="off" readOnly={!!hospital} />
      {!picked && !isNew && q && <div className="rv-hits">{hits.map(h => <button key={h.id} type="button" className="rv-hit" onClick={() => { setPicked(h); setHits([]); }}>🏥 {h.name} <small className="muted">{h.region} · {h.kind}</small></button>)}
        <button type="button" className="rv-hit new" onClick={() => { setIsNew(true); setHits([]); }}>➕ “{q}” 새로 등록</button></div>}
      {isNew && !picked && <div className="row" style={{ gap: 6, flexWrap: "wrap" }}><input type="hidden" name="name" value={q} /><RegionPick /><label className="jb-lab">종류<select name="kind" defaultValue="병원">{HOSP_KINDS.map(r => <option key={r}>{r}</option>)}</select></label></div>}</div>
    <input type="hidden" name="hospital_id" value={picked?.id ?? ""} /></div>;
}
function ExtraForm({ kind, hospital, dept }: { kind: "pay" | "alba"; hospital?: Hosp | null; dept?: string }) {
  const [st, act] = useFormState(submitHospExtra, undefined); const [ann, setAnn] = useState(0), [unit, setUnit] = useState("일급");
  const D = <div className="rw-f"><label htmlFor="rw-d">직종</label><select id="rw-d" name="dept" defaultValue={JOB_DEPTS.includes(dept as any) ? dept : ""}><option value="" disabled>직종 선택</option>{JOB_DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>;
  return <form action={act} className="form rw-form" key={kind}>
    <input type="hidden" name="xkind" value={kind} />
    <HospPick hospital={hospital} />
    {kind === "pay" ? <>
      <div className="rw-2">{D}<div className="rw-f"><label htmlFor="rw-a">세전 연봉 <small>(만 원)</small></label><input id="rw-a" name="annual" type="number" inputMode="numeric" min={1000} max={30000} step={10} placeholder="예: 4200" onChange={e => setAnn(Math.round(Number(e.target.value) || 0))} />
        {ann >= 1000 && ann <= 30000 && <small className="rw-hint">통장 실수령 약 <b>{netMonthly(ann).toLocaleString("ko-KR")}만 원</b>/월</small>}</div></div>
      <div className="rw-f"><span className="rw-l">연차</span><Chips name="years" opts={X_YEARS} /></div>
      <div className="rw-f"><span className="rw-l">계약 형태</span><Chips name="contract" opts={CONTRACT} /></div>
      <div className="rw-f"><span className="rw-l">언제 기준인가요?</span><Chips name="year" opts={PAY_YEAR} def="올해" /></div>
      <div className="rw-f"><label htmlFor="rw-hr">주 근무시간 <small>(선택 · 실제로 일하는 시간)</small></label><input id="rw-hr" name="hours" type="number" inputMode="numeric" min={10} max={80} placeholder="예: 45" /></div>
      <div className="rw-f"><span className="rw-l">연봉 만족도</span><Stars name="star" /></div>
      <div className="rw-f"><label htmlFor="rw-w">한마디 <small>(선택)</small></label><textarea id="rw-w" name="word" rows={3} maxLength={200} placeholder="예: 기본급은 낮은데 인센티브가 매달 나와요. 연봉 협상은 1월에 해요." /></div>
    </> : <>
      {D}
      <div className="rw-f"><span className="rw-l">급여</span><div className="hc-chips">{ALBA_UNIT.map(u => <label key={u}><input type="radio" name="unit" value={u} checked={unit === u} onChange={() => setUnit(u)} /><span>{u}</span></label>)}</div>
        <div className="rw-amt"><input name="amount" type="number" inputMode="numeric" min={1} max={200} placeholder={unit === "일급" ? "예: 15" : "예: 2"} aria-label={`${unit} (만 원)`} /><span>만 원</span></div></div>
      <div className="rw-2"><div className="rw-f"><label htmlFor="rw-t">근무 시간</label><input id="rw-t" name="time" maxLength={30} placeholder="예: 09~18시" /></div><div className="rw-f"><label htmlFor="rw-dy">근무한 날 <small>(선택)</small></label><input id="rw-dy" name="days" maxLength={30} placeholder="예: 토요일 하루, 3일" /></div></div>
      <div className="rw-f"><span className="rw-l">세금·신고는 어떻게 했나요?</span><Chips name="tax" opts={ALBA_TAX} /></div>
      <div className="rw-f"><span className="rw-l">식사</span><Chips name="meal" opts={ALBA_MEAL} /></div>
      <div className="rw-f"><span className="rw-l">근무 강도</span><Chips name="load" opts={ALBA_LOAD} /></div>
      <div className="rw-f"><span className="rw-l">또 갈 의향이 있나요?</span><Chips name="again" opts={["👍 또 갈래요", "👎 안 갈래요"]} values={[1, 0]} /></div>
      <div className="rw-f"><label htmlFor="rw-wk">주로 한 일 <small>(선택)</small></label><textarea id="rw-wk" name="work" rows={3} maxLength={500} placeholder="예: 검진 채혈, 접수 보조, 판독 준비" /></div>
      <div className="rw-f"><label htmlFor="rw-nt">다음 사람에게 인계 한마디 <small>(선택)</small></label><textarea id="rw-nt" name="note" rows={3} maxLength={500} placeholder="예: 주차 안 돼요. 점심은 12시 반, 장비는 ○○ 써요." /></div>
    </>}
    <div className="wz-safe">🔒 닉네임 없이 <b>익명</b>으로 올라가요. 19금·욕설과 전화번호만 막아요.</div>
    {st?.error && <div className="error" role="alert">{st.error}</div>}
    <Send label={kind === "pay" ? "💰 연봉 리뷰 올리기 (+30 XP)" : "⏱ 알바 리뷰 올리기 (+30 XP)"} />
  </form>;
}
/** ✍️ 리뷰 쓰기 — 위에서 종류를 고르고(병원 / 연봉 / 알바·단기) 아래에서 바로 작성 */
export default function ReviewWrite({ hospital, dept, mine, t0 }: { hospital?: Hosp | null; dept?: string; mine?: HFact | null; t0?: T }) {
  const [t, setT] = useState<T>(t0 ?? "hosp"); const cur = TABS.find(x => x.k === t)!;
  return <div className="rw">
    <div className="rw-tabs" role="tablist" aria-label="리뷰 종류">{TABS.map(x => <button key={x.k} type="button" role="tab" aria-selected={t === x.k} className={t === x.k ? "on" : ""} onClick={() => setT(x.k)}><b>{x.icon} {x.n}</b><small>{x.sub}</small></button>)}</div>
    <div className="rw-tip"><b>무엇을 쓰면 되나요?</b><span>{cur.tip}</span></div>
    <div className="card">{t === "hosp" ? <HospCheck hospital={hospital} dept={dept} mine={mine} /> : <ExtraForm kind={t} hospital={hospital} dept={dept} />}</div>
  </div>;
}
