"use client";
import Pledge from "@/components/jobs/Pledge";
import RegionPick from "./RegionPick";
import { useFormState, useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import { submitHospFact, searchHospitals } from "@/lib/jobActions";
import { JOB_DEPTS, HOSP_KINDS } from "@/lib/jobs";
import { isField, isReal, SHIFT, PAY, YEARS, MOOD, RISKS, EXIT_STARS, EXIT_REASONS, FUTURE, type HFact } from "@/lib/hospFacts";
import { textProblem } from "@/lib/textQuality";
function Send({ edit, label }: { edit: boolean; label?: string }) { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "저장 중…" : label ?? (edit ? "✏️ 수정 완료" : "🔎 익명으로 체크 완료")}</button>; }
const Chips = ({ name, opts, def, values, big }: { name: string; opts: readonly string[]; def?: string | number; values?: (string | number)[]; big?: boolean }) =>
  <div className={"hc-chips" + (big ? " big" : "")}>{opts.map((o, i) => { const v = values ? values[i] : o; return <label key={o}><input type="radio" name={name} value={v} defaultChecked={def !== undefined && String(def) === String(v)} /><span>{o}</span></label>; })}</div>;
const STAR_W = ["", "별로예요", "아쉬워요", "보통", "좋아요", "최고예요"];
function Star5({ name, def, big }: { name: string; def?: number; big?: boolean }) { const [v, setV] = useState(def ?? 0);
  return <span className={"hc-stars" + (big ? " big" : "")}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={v >= n ? "on" : ""} onClick={() => setV(n)} aria-label={`${n}점`}>★</button>)}<em className="hc-sw">{STAR_W[v]}</em><input type="hidden" name={name} value={v || ""} /></span>; }

/** 🔎 병원 실체 체크 — 잡플래닛식 한 단계씩. 급여 → 분위기 → 별점 → 추천 → 리스크 → 한줄평(퇴사자는 퇴사 사유) */
const BIG_KIND = /상급종합|종합병원|^병원$|요양병원/, LOCAL_KIND = /의원|치과|약국|한방병원/;
export default function HospCheck({ hospital, dept, mine }: { hospital?: { id: number; name: string; region: string; kind?: string } | null; dept?: string; mine?: HFact | null }) {
  const [st, act] = useFormState(submitHospFact, undefined); const form = useRef<HTMLFormElement>(null);
  const [q, setQ] = useState(""), [hits, setHits] = useState<any[]>([]), [picked, setPicked] = useState(hospital ?? null), [isNew, setIsNew] = useState(false);
  const [risk, setRisk] = useState<string[]>(mine?.risks ?? []), [good, setGood] = useState(mine?.good ?? false), [status, setStatus] = useState(mine?.status ?? "재직"), [txt, setTxt] = useState(mine?.last ?? ""), [pros, setPros] = useState((mine as any)?.pros ?? ""), [cons, setCons] = useState((mine as any)?.cons ?? "");
  // 빠른 체크(3문항) → 여기서 끝내거나 '더 알려주기'
  const [more, setMore] = useState(false), [rp, setRp] = useState(typeof (mine as any)?.regularPct === "number" ? String((mine as any).regularPct) : "");
  const steps: string[] = [...(hospital ? [] : ["hosp"]), "me", "pay", "quick", ...(more ? ["mood", "field", "real", "star", "future", "risk", "pc", "word"] : ["fork"])];
  const [i, setI] = useState(0), [err, setErr] = useState(""); const cur = steps[i], last = i === steps.length - 1;
  const search = async (v: string) => { setQ(v); setPicked(null); setIsNew(false); setHits(v.trim() ? await searchHospitals(v) : []); };
  const check = (): string => {
    const fd = new FormData(form.current!); const has = (k: string) => !!String(fd.get(k) ?? "");
    if (cur === "hosp") return picked || (isNew && q.trim()) ? "" : "병원을 고르거나 새로 등록해주세요";
    if (cur === "me") return !has("shift") ? "근무 형태를 골라주세요" : has("years") ? "" : "연차를 골라주세요";
    if (cur === "pay") return has("pay") ? "" : "실수령 구간을 골라주세요 (대략이면 돼요)";
    if (cur === "quick") return has("late") && has("rec") && has("st_overall") ? "" : "세 가지 모두 골라주세요";
    if (cur === "mood" || cur === "field" || cur === "real") return MOOD.filter(m => m.k !== "late" && (cur === "real" ? isReal(m) : !isReal(m) && isField(m) === (cur === "field"))).every(m => has(m.k)) ? "" : "모두 골라주세요";
    if (cur === "star") return EXIT_STARS.every(s => has("st_" + s.k)) ? "" : "항목별 별점을 모두 매겨주세요";
    if (cur === "future") return has("future") ? "" : "골라주세요";
    if (cur === "risk") return risk.length || good ? "" : "해당하는 걸 고르거나 '딱히 없어요'를 눌러주세요";
    if (cur === "pc") { for (const [k, n] of [["pros", "장점"], ["cons", "단점"]] as const) { const v = String(fd.get(k) ?? "").trim(); if (v) { const e = textProblem(v, 20); if (e) return `${n}: ${e}`; } } return ""; }
    if (cur === "word") { if (status === "퇴사" && !fd.getAll("reason").length) return "퇴사 사유를 하나 이상 골라주세요"; return txt.trim() ? textProblem(txt, 10) ?? "" : ""; }
    return "";
  };
  const next = () => { const e = check(); setErr(e); if (!e) { setI(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const show = (k: string) => ({ display: cur === k ? undefined : "none" });
  return <form ref={form} action={act} className="form hc wiz" data-more={more ? "1" : "0"} onSubmit={e => { const x = check(); if (x) { e.preventDefault(); setErr(x); } }} onKeyDown={e => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") { e.preventDefault(); if (!last) next(); } }}>
    <div className="wz-top"><div className="wz-bar"><i style={{ width: `${(i + 1) / steps.length * 100}%` }} /></div><small><b>{i + 1}</b> / {steps.length}</small></div>
    {(picked || hospital || (isNew && q)) && cur !== "hosp" && <div className="wz-h"><b>{picked?.name ?? hospital?.name ?? q}</b><small>{picked?.region ?? hospital?.region ?? ""}</small>{!hospital && <button type="button" className="wz-chg" onClick={() => { setI(0); setErr(""); }}>변경</button>}</div>}
    <input type="hidden" name="more" value={more ? "1" : ""} />
    <div className="wz-safe">🔒 입력하신 모든 정보는 <b>익명으로 처리</b>되니 걱정 마세요! 닉네임은 절대 안 보이고, 병원 단위로 합쳐서만 공개돼요.</div>

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
      <b className="wz-sub">고용 형태 <small className="muted">(비공개)</small></b><Chips name="emp" opts={["정규직", "계약직", "파트타임", "인턴·수습"] as const} def={(mine as any)?.emp} />
      <b className="wz-sub">근무 형태</b><Chips key={String((picked as any)?.kind ?? hospital?.kind)} name="shift" opts={SHIFT} values={[0, 1, 2]} def={mine?.shift ?? (BIG_KIND.test(String((picked as any)?.kind ?? hospital?.kind ?? "")) ? 0 : LOCAL_KIND.test(String((picked as any)?.kind ?? hospital?.kind ?? "")) ? 2 : undefined)} big />
      <small className="muted">대학·종합병원은 보통 3교대, 의원·치과·약국 같은 로컬은 보통 상근이라 미리 골라뒀어요. 다르면 바꿔주세요.</small>
      <b className="wz-sub">연차</b><Chips name="years" opts={YEARS} def={mine?.years} big /></div>

    <div style={show("pay")} className="wz-step"><h3>💰 세후 실수령은 얼마쯤이에요?</h3><p>수당 포함 월 평균, 만원 단위. 정확하지 않아도 돼요. 동료 급여를 아는 범위로 골라도 좋아요.</p><Chips name="pay" opts={PAY} def={mine?.pay} big /></div>

    <div style={show("quick")} className="wz-step"><h3>⚡ 딱 세 가지만</h3><p>다음 지원자가 제일 궁금해하는 것부터요.</p>
      <div className="hc-q"><b>⏰ 공고 퇴근 시간보다 실제로 늦게 끝나요?</b><Chips name="late" opts={MOOD.find(m => m.k === "late")!.opts} values={[0, 1, 2]} def={(mine as any)?.late} big /></div>
      <div className="hc-q"><b>👍 친한 동료에게 이 병원 추천해요?</b><Chips name="rec" opts={["👍 추천해요", "👎 추천 안 해요"]} values={[1, 0]} def={mine?.rec} big /></div>
      <div className="hc-q"><b>⭐ 총평점</b><Star5 name="st_overall" def={mine?.overall} big /></div></div>

    <div style={show("fork")} className="wz-step wz-fork"><h3>🙌 여기까지만 해도 충분해요!</h3><p>저장하면 바로 모든 병원의 실수령·고용 현실이 열려요.</p>
      {cur === "fork" && <Pledge />}
      <Send edit={!!mine} label={mine ? "✏️ 이대로 수정 완료" : "✅ 여기까지 저장하기"} />
      <button type="button" className="btn ghost wz-more" onClick={() => { setMore(true); setI(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>💬 분위기·원장 스타일·연차까지 더 알려주기</button>
      <small className="muted">더 알려주면 정시 퇴근·원장 터치 적음 같은 초록 뱃지가 더 빨리 붙어요.</small></div>

    <div style={show("mood")} className="wz-step"><h3>😶 내부 분위기는 어때요?</h3>
      {MOOD.filter(m => !isField(m) && !isReal(m)).map(m => <div key={m.k} className="hc-q"><b>{m.q}</b><Chips name={m.k} opts={m.opts} values={m.opts.map((_, i) => i)} def={(mine as any)?.[m.k]} big /></div>)}</div>

    <div style={show("field")} className="wz-step"><h3>🏥 현장은 어때요?</h3><p>공고엔 절대 안 나오는, 의료계만의 진짜 근무 조건이에요.</p>
      {MOOD.filter(isField).map(m => <div key={m.k} className="hc-q"><b>{m.q}</b><Chips name={m.k} opts={m.opts} values={m.opts.map((_, i) => i)} def={(mine as any)?.[m.k]} big /></div>)}</div>

    <div style={show("real")} className="wz-step"><h3>💼 공고랑 현실, 얼마나 달라요?</h3><p>다음 지원자가 제일 궁금해하는 것들이에요. 실제 퇴근, 잡무, 인센티브, 연차 방식, 원장 스타일.</p>
      {MOOD.filter(m => isReal(m) && m.k !== "late").map(m => <div key={m.k} className="hc-q"><b>{m.q}</b><Chips name={m.k} opts={m.opts} values={m.opts.map((_, i) => i)} def={(mine as any)?.[m.k]} big /></div>)}
      <div className="hc-q hc-pct"><b>계약직의 정규직 전환율, 체감상 몇 %인가요? <small>(선택)</small></b>
        <div className="hc-pctrow"><input type="number" name="regular_pct" inputMode="numeric" min={0} max={100} step={5} value={rp} onChange={e => setRp(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} placeholder="예: 20" aria-label="체감 정규직 전환율 (%)" /><span>%</span>
          <div className="hc-pctq">{[0, 10, 30, 50, 70, 90].map(v => <button key={v} type="button" className={rp === String(v) ? "on" : ""} onClick={() => setRp(String(v))}>{v}%</button>)}<button type="button" className={rp === "" ? "on" : ""} onClick={() => setRp("")}>잘 몰라요</button></div></div>
        <small className="muted">내 직종 기준으로, 계약직 10명 중 몇 명쯤 정규직이 되는지 느낌대로 적어주세요. 계약직이 없으면 비워두세요.</small></div></div>

    <div style={show("star")} className="wz-step"><h3>⭐ 항목별 별점</h3>
      {EXIT_STARS.map(s => <div key={s.k} className="hc-srow"><span>{s.icon} {s.name}</span><Star5 name={"st_" + s.k} def={mine?.stars?.[s.k]} /></div>)}</div>

    <div style={show("future")} className="wz-step"><h3>🔮 앞으로는요?</h3>
      <div className="hc-q"><b>1년 뒤 이 병원은?</b><Chips name="future" opts={FUTURE} values={[0, 1, 2]} def={mine?.future} big /></div></div>

    <div style={show("risk")} className="wz-step risk"><h3>⚠️ 입사 전에 알았으면 좋았을 것</h3><p>해당하는 것을 모두 골라주세요. 입사해야만 알던 걸 다음 사람은 미리 알 수 있어요.</p>
      <div className="hc-chips multi">{RISKS.map(r => <label key={r.k}><input type="checkbox" name="risk" value={r.k} checked={risk.includes(r.k)} onChange={e => setRisk(x => e.target.checked ? [...x, r.k] : x.filter(y => y !== r.k))} /><span>{r.label}</span></label>)}
        <label className="good"><input type="checkbox" name="good" value="1" checked={!risk.length && good} disabled={risk.length > 0} onChange={e => setGood(e.target.checked)} /><span>{risk.length ? "—" : "딱히 없어요, 괜찮은 곳 👍"}</span></label></div></div>

    <div style={show("pc")} className="wz-step"><h3>👍 좋았던 점, 👎 아쉬운 점 <small>(선택)</small></h3><p>체크만으로는 담기 어려운 이야기를 남겨주세요. 사람이 아니라 병원 이야기만요.</p>
      <label className="hc-q"><b>장점 <small>{pros.length} / 1000</small></b><textarea name="pros" rows={4} maxLength={1000} value={pros} onChange={e => setPros(e.target.value)} placeholder="이 병원을 다니며 좋았던 점 (20자 이상)" /></label>
      <label className="hc-q"><b>단점 <small>{cons.length} / 1000</small></b><textarea name="cons" rows={4} maxLength={1000} value={cons} onChange={e => setCons(e.target.value)} placeholder="아쉬웠던 점, 입사 전에 알았으면 좋았을 것 (20자 이상)" /></label></div>

    <div style={show("word")} className="wz-step">
      {status === "퇴사" && <><h3>🚪 왜 퇴사했나요?</h3><div className="hc-chips multi">{EXIT_REASONS.map(r => <label key={r}><input type="checkbox" name="reason" value={r} defaultChecked={mine?.reasons?.includes(r)} /><span>{r}</span></label>)}</div></>}
      <h3 style={{ marginTop: status === "퇴사" ? 18 : 0 }}>✍️ 한줄평 <small>(선택)</small></h3><p>이 병원 갈까 고민하는 사람에게 한마디. 사람이 아니라 병원 이야기만 해주세요.</p>
      <input name="last" maxLength={100} value={txt} onChange={e => setTxt(e.target.value)} placeholder="예: 배울 건 많지만 신규한텐 버거운 곳" />
      <small className="muted" style={{ textAlign: "right" }}><b style={{ color: "#1F9D63" }}>{txt.length}</b> / 최대 100자</small></div>

    {last && cur !== "fork" && <Pledge />}
    {(err || st?.error) && <div className="error">{err || st?.error}</div>}
    <div className="wz-nav">{i > 0 && <button type="button" className="btn ghost wz-prev" onClick={() => { setErr(""); setI(i - 1); }}>이전으로</button>}
      {cur === "fork" ? null : last ? <Send edit={!!mine} label={more ? (mine ? "✏️ 수정 완료" : "🔎 익명으로 체크 완료") : undefined} /> : <button type="button" className="btn wz-next" onClick={next}>다음</button>}</div>
  </form>;
}
