"use client";
import RegionPick from "./RegionPick";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { submitHospFact, searchHospitals } from "@/lib/jobActions";
import { JOB_REGIONS, JOB_DEPTS, HOSP_KINDS } from "@/lib/jobs";
import { PAY, YEARS, MOOD, RISKS, EXIT_STARS, EXIT_REASONS, type HFact } from "@/lib/hospFacts";
function Send({ edit }: { edit: boolean }) { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "저장 중…" : edit ? "✏️ 수정하기" : "🔎 익명으로 체크 완료 (+50 XP)"}</button>; }
const Chips = ({ name, opts, def, values }: { name: string; opts: readonly string[]; def?: string | number; values?: (string | number)[] }) =>
  <div className="hc-chips">{opts.map((o, i) => { const v = values ? values[i] : o; return <label key={o}><input type="radio" name={name} value={v} defaultChecked={def !== undefined && String(def) === String(v)} /><span>{o}</span></label>; })}</div>;
function Star5({ name, def }: { name: string; def?: number }) { const [v, setV] = useState(def ?? 0);
  return <span className="hc-stars">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={v >= n ? "on" : ""} onClick={() => setV(n)} aria-label={`${n}점`}>★</button>)}<input type="hidden" name={name} value={v || ""} /></span>; }
/** 🔎 병원 실체 체크 — 탭만으로 30초. 실수령·분위기·입사해야만 아는 치명적 리스크 */
export default function HospCheck({ hospital, dept, mine }: { hospital?: { id: number; name: string; region: string } | null; dept?: string; mine?: HFact | null }) {
  const [st, act] = useFormState(submitHospFact, undefined);
  const [q, setQ] = useState(""), [hits, setHits] = useState<any[]>([]), [picked, setPicked] = useState(hospital ?? null), [isNew, setIsNew] = useState(false), [risk, setRisk] = useState<string[]>(mine?.risks ?? []), [good, setGood] = useState(mine?.good ?? false), [status, setStatus] = useState(mine?.status ?? "재직");
  const search = async (v: string) => { setQ(v); setPicked(null); setIsNew(false); setHits(v.trim() ? await searchHospitals(v) : []); };
  return <form action={act} className="form hc">
    {!hospital && <div className="rv-pick">
      <label className="jb-lab">어느 병원이에요? (다니는 곳 · 다녔던 곳)<input value={picked ? `${picked.name} (${picked.region})` : q} onChange={e => search(e.target.value)} placeholder="병원 이름 검색 — 없으면 새로 등록" autoComplete="off" /></label>
      {!picked && !isNew && q && <div className="rv-hits">{hits.map(h => <button key={h.id} type="button" className="rv-hit" onClick={() => { setPicked(h); setHits([]); }}>🏥 {h.name} <small className="muted">{h.region} · {h.kind}</small></button>)}
        <button type="button" className="rv-hit new" onClick={() => { setIsNew(true); setHits([]); }}>➕ “{q}” 새 병원으로 등록</button></div>}
      {isNew && !picked && <div className="row" style={{ gap: 6, flexWrap: "wrap" }}><input type="hidden" name="name" value={q} />
        <RegionPick />
        <label className="jb-lab">종류<select name="kind" defaultValue="병원">{HOSP_KINDS.map(r => <option key={r}>{r}</option>)}</select></label></div>}
    </div>}
    <input type="hidden" name="hospital_id" value={picked?.id ?? ""} />
    <div className="hc-q"><b>나는</b><div className="row" style={{ gap: 6 }}>
      <select name="dept" defaultValue={mine?.dept ?? (JOB_DEPTS.includes(dept as any) ? dept : "간호사")}>{JOB_DEPTS.map(r => <option key={r}>{r}</option>)}</select>
      <select name="status" value={status} onChange={e => setStatus(e.target.value)}><option>재직</option><option>퇴사</option></select></div>
      <Chips name="years" opts={YEARS} def={mine?.years} /></div>
    <div className="hc-q"><b>💰 세후 실수령 월급 <small>(만원 · 수당 포함 평균, 대략이면 OK · 동료 급여 아는 범위도 OK)</small></b><Chips name="pay" opts={PAY} def={mine?.pay} /></div>
    {MOOD.map(m => <div key={m.k} className="hc-q"><b>{m.k === "taeum" ? "😶 " : m.k === "off" ? "🕕 " : "🚪 "}{m.q}</b><Chips name={m.k} opts={m.opts} values={[0, 1, 2]} def={(mine as any)?.[m.k]} /></div>)}
    <div className="hc-q"><b>⭐ 별점 평가 <small>(별 5개 기준)</small></b>
      {EXIT_STARS.map(st => <div key={st.k} className="hc-srow"><span>{st.icon} {st.name}</span><Star5 name={"st_" + st.k} def={mine?.stars?.[st.k]} /></div>)}</div>
    <div className="hc-q risk"><b>⚠️ 입사 전에 알았으면 좋았을 것 <small>(해당하는 것 모두)</small></b>
      <div className="hc-chips multi">{RISKS.map(r => <label key={r.k}><input type="checkbox" name="risk" value={r.k} checked={risk.includes(r.k)} onChange={e => setRisk(x => e.target.checked ? [...x, r.k] : x.filter(y => y !== r.k))} /><span>{r.label}</span></label>)}
        <label className="good"><input type="checkbox" name="good" value="1" checked={!risk.length && good} disabled={risk.length > 0} onChange={e => setGood(e.target.checked)} /><span>{risk.length ? "—" : "딱히 없어요, 괜찮은 곳 👍"}</span></label></div></div>
    {status === "퇴사" && <div className="hc-exit">
      <div className="hc-q"><b>퇴사 사유 <small>(모두 골라주세요)</small></b><div className="hc-chips multi">{EXIT_REASONS.map(r => <label key={r}><input type="checkbox" name="reason" value={r} defaultChecked={mine?.reasons?.includes(r)} /><span>{r}</span></label>)}</div></div>
      <label className="hc-q"><b>마지막으로 한마디 <small>(선택 · 이 병원 갈까 고민하는 후배에게)</small></b><input name="last" maxLength={120} defaultValue={mine?.last ?? ""} placeholder="예: 배울 건 많지만 신규한텐 버거워요. 면접 때 교대 꼭 물어보세요" /></label>
    </div>}
    <div className="hc-safe">🔒 이름·닉네임은 절대 안 보여요. 응답이 <b>3명 이상</b> 모여야 합쳐진 숫자로만 공개돼서, 누가 답했는지 알 수 없어요.</div>
    {st?.error && <div className="error">{st.error}</div>}
    <Send edit={!!mine} />
  </form>;
}
