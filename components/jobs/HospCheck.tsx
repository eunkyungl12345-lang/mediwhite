"use client";
import RegionPick from "./RegionPick";
import { useFormState, useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import { submitHospFact, searchHospitals } from "@/lib/jobActions";
import { JOB_DEPTS, HOSP_KINDS } from "@/lib/jobs";
import { PAY, YEARS, MOOD, RISKS, EXIT_STARS, EXIT_REASONS, FUTURE, type HFact } from "@/lib/hospFacts";
import { textProblem } from "@/lib/textQuality";
function Send({ edit }: { edit: boolean }) { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "저장 중…" : edit ? "✏️ 수정 완료" : "🔎 익명으로 체크 완료 (+50 XP)"}</button>; }
const Chips = ({ name, opts, def, values, big }: { name: string; opts: readonly string[]; def?: string | number; values?: (string | number)[]; big?: boolean }) =>
  <div className={"hc-chips" + (big ? " big" : "")}>{opts.map((o, i) => { const v = values ? values[i] : o; return <label key={o}><input type="radio" name={name} value={v} defaultChecked={def !== undefined && String(def) === String(v)} /><span>{o}</span></label>; })}</div>;
function Star5({ name, def, big }: { name: string; def?: number; big?: boolean }) { const [v, setV] = useState(def ?? 0);
  return <span className={"hc-stars" + (big ? " big" : "")}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={v >= n ? "on" : ""} onClick={() => setV(n)} aria-label={`${n}점`}>★</button>)}<input type="hidden" name={name} value={v || ""} /></span>; }

/** 🔎 병원 실체 체크 — 잡플래닛식 한 단계씩. 급여 → 분위기 → 별점 → 추천 → 리스크 → 한줄평(퇴사자는 퇴사 사유) */
export default function HospCheck({ hospital, dept, mine }: { hospital?: { id: number; name: string; region: string } | null; dept?: string; mine?: HFact | null }) {
  const [st, act] = useFormState(submitHospFact, undefined); const form = useRef<HTMLFormElement>(null);
  const [q, setQ] = useState(""), [hits, setHits] = useState<any[]>([]), [picked, setPicked] = useState(hospital ?? null), [isNew, setIsNew] = useState(false);
  const [risk, setRisk] = useState<string[]>(mine?.risks ?? []), [good, setGood] = useState(mine?.good ?? false), [status, setStatus] = useState(mine?.status ?? "재직"), [txt, setTxt] = useState(mine?.last ?? "");
  const steps = [...(hospital ? [] : ["hosp"]), "me", "pay", "mood", "star", "rec", "risk", "word"] as const;
  const [i, setI] = useState(0), [err, setErr] = useState(""); const cur = steps[i], last = i === steps.length - 1;
  const search = async (v: string) => { setQ(v); setPicked(null); setIsNew(false); setHits(v.trim() ? await searchHospitals(v) : []); };
  const check = (): string => {
    const fd = new FormData(form.current!); const has = (k: string) => !!String(fd.get(k) ?? "");
    if (cur === "hosp") return picked || (isNew && q.trim()) ? "" : "병원을 고르거나 새로 등록해주세요";
    if (cur === "me") return has("years") ? "" : "연차를 골라주세요";
    if (cur === "pay") return has("pay") ? "" : "실수령 구간을 골라주세요 (대략이면 돼요)";
    if (cur === "mood") return MOOD.every(m => has(m.k)) ? "" : "세 가지 모두 골라주세요";
    if (cur === "star") return has("st_overall") && EXIT_STARS.every(s => has("st_" + s.k)) ? "" : "총평점과 항목별 별점을 모두 매겨주세요";
    if (cur === "rec") return has("rec") && has("future") ? "" : "두 질문 모두 골라주세요";
    if (cur === "risk") return risk.length || good ? "" : "해당하는 걸 고르거나 '딱히 없어요'를 눌러주세요";
    if (cur === "word") { if (status === "퇴사" && !fd.getAll("reason").length) return "퇴사 사유를 하나 이상 골라주세요"; return txt.trim() ? textProblem(txt, 10) ?? "" : ""; }
    return "";
  };
  const next = () => { const e = check(); setErr(e); if (!e) { setI(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const show = (k: string) => ({ display: cur === k ? undefined : "none" });
  return <form ref={form} action={act} className="form hc wiz" onSubmit={e => { const x = check(); if (x) { e.preventDefault(); setErr(x); } }} onKeyDown={e => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") { e.preventDefault(); if (!last) next(); } }}>
    <div className="wz-top"><div className="wz-bar"><i style={{ width: `${(i + 1) / steps.length * 100}%` }} /></div><small><b>{i + 1}</b> / {steps.length}</small></div>
    {(picked || hospital) && cur !== "hosp" && <div className="wz-h">🏥 <b>{(picked ?? hospital)!.name}</b><small>{(picked ?? hospital)!.region}</small></div>}
    <div className="wz-safe">🔒 <b>안심하고 솔직하게.</b> 닉네임은 절대 안 보이고, 3명 이상 모여야 합친 숫자로만 공개돼요.</div>

    <div style={show("hosp")} className="wz-step"><h3>어느 병원을 알려줄까요?</h3><p>다니는 곳, 다녔던 곳 모두 좋아요.</p>
      <div className="rv-pick"><input value={picked ? `${picked.name} (${picked.region})` : q} onChange={e => search(e.target.value)} placeholder="병원·약국 이름 검색" autoComplete="off" />
        {!picked && !isNew && q && <div className="rv-hits">{hits.map(h => <button key={h.id} type="button" className="rv-hit" onClick={() => { setPicked(h); setHits([]); }}>🏥 {h.name} <small className="muted">{h.region} · {h.kind}</small></button>)}
          <button type="button" className="rv-hit new" onClick={() => { setIsNew(true); setHits([]); }}>➕ “{q}” 새로 등록</button></div>}
        {isNew && !picked && <div className="row" style={{ gap: 6, flexWrap: "wrap" }}><input type="hidden" name="name" value={q} /><RegionPick />
          <label className="jb-lab">종류<select name="kind" defaultValue="병원">{HOSP_KINDS.map(r => <option key={r}>{r}</option>)}</select></label></div>}</div></div>
    <input type="hidden" name="hospital_id" value={picked?.id ?? ""} />

    <div style={show("me")} className="wz-step"><h3>어떤 자리에서 일했나요?</h3>
      <div className="row" style={{ gap: 6 }}><select name="dept" defaultValue={mine?.dept ?? (JOB_DEPTS.includes(dept as any) ? dept : "간호사")}>{JOB_DEPTS.map(r => <option key={r}>{r}</option>)}</select>
        <select name="status" value={status} onChange={e => setStatus(e.target.value)}><option>재직</option><option>퇴사</option></select></div>
      <b className="wz-sub">연차</b><Chips name="years" opts={YEARS} def={mine?.years} big /></div>

    <div style={show("pay")} className="wz-step"><h3>💰 세후 실수령은 얼마쯤이에요?</h3><p>수당 포함 월 평균, 만원 단위. 정확하지 않아도 돼요. 동료 급여를 아는 범위로 골라도 좋아요.</p><Chips name="pay" opts={PAY} def={mine?.pay} big /></div>

    <div style={show("mood")} className="wz-step"><h3>😶 내부 분위기는 어때요?</h3>
      {MOOD.map(m => <div key={m.k} className="hc-q"><b>{m.q}</b><Chips name={m.k} opts={m.opts} values={[0, 1, 2]} def={(mine as any)?.[m.k]} big /></div>)}</div>

    <div style={show("star")} className="wz-step"><h3>⭐ 별점을 매겨주세요</h3>
      <div className="hc-q"><b>총평점</b><Star5 name="st_overall" def={mine?.overall} big /></div>
      {EXIT_STARS.map(s => <div key={s.k} className="hc-srow"><span>{s.icon} {s.name}</span><Star5 name={"st_" + s.k} def={mine?.stars?.[s.k]} /></div>)}</div>

    <div style={show("rec")} className="wz-step"><h3>👍 이 병원, 추천하나요?</h3>
      <div className="hc-q"><b>이 병원을 친한 동료에게 추천하나요?</b><Chips name="rec" opts={["👍 추천해요", "👎 추천 안 해요"]} values={[1, 0]} def={mine?.rec} big /></div>
      <div className="hc-q"><b>1년 뒤 이 병원은?</b><Chips name="future" opts={FUTURE} values={[0, 1, 2]} def={mine?.future} big /></div></div>

    <div style={show("risk")} className="wz-step risk"><h3>⚠️ 입사 전에 알았으면 좋았을 것</h3><p>해당하는 것을 모두 골라주세요. 입사해야만 알던 걸 다음 사람은 미리 알 수 있어요.</p>
      <div className="hc-chips multi">{RISKS.map(r => <label key={r.k}><input type="checkbox" name="risk" value={r.k} checked={risk.includes(r.k)} onChange={e => setRisk(x => e.target.checked ? [...x, r.k] : x.filter(y => y !== r.k))} /><span>{r.label}</span></label>)}
        <label className="good"><input type="checkbox" name="good" value="1" checked={!risk.length && good} disabled={risk.length > 0} onChange={e => setGood(e.target.checked)} /><span>{risk.length ? "—" : "딱히 없어요, 괜찮은 곳 👍"}</span></label></div></div>

    <div style={show("word")} className="wz-step">
      {status === "퇴사" && <><h3>🚪 왜 퇴사했나요?</h3><div className="hc-chips multi">{EXIT_REASONS.map(r => <label key={r}><input type="checkbox" name="reason" value={r} defaultChecked={mine?.reasons?.includes(r)} /><span>{r}</span></label>)}</div></>}
      <h3 style={{ marginTop: status === "퇴사" ? 18 : 0 }}>✍️ 한줄평 <small>(선택)</small></h3><p>이 병원 갈까 고민하는 사람에게 한마디. 사람이 아니라 병원 이야기만 해주세요.</p>
      <textarea name="last" maxLength={120} rows={3} value={txt} onChange={e => setTxt(e.target.value)} placeholder="예: 배울 건 많지만 신규한텐 버거워요. 면접 때 교대 꼭 물어보세요" />
      <small className="muted" style={{ textAlign: "right" }}>{txt.length} / 120</small></div>

    {(err || st?.error) && <div className="error">{err || st?.error}</div>}
    <div className="wz-nav">{i > 0 && <button type="button" className="btn ghost" onClick={() => { setErr(""); setI(i - 1); }}>이전</button>}
      {last ? <Send edit={!!mine} /> : <button type="button" className="btn wz-next" onClick={next}>다음</button>}</div>
  </form>;
}
