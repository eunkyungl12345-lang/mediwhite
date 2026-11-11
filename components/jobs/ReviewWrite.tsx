"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import HospCheck from "./HospCheck";
import RegionPick from "./RegionPick";
import { submitHospExtra, submitQuickReview } from "@/lib/hospExtra.actions";
import { searchHospitals } from "@/lib/jobActions";
import { JOB_DEPTS, HOSP_KINDS } from "@/lib/jobs";
import { X_YEARS, CONTRACT, PAY_YEAR, ALBA_UNIT, ALBA_TAX, ALBA_MEAL, ALBA_LOAD, HOBONG, WORK_AREA, PAY_SUB, HIRE_PILLS, AFTER2 } from "@/lib/hospExtra";
import { netMonthly } from "./PayCalc";
import type { HFact } from "@/lib/hospFacts";
type Hosp = { id: number; name: string; region: string; kind?: string };
type T = "hosp" | "pay" | "alba";
const TABS: { k: T; icon: string; n: string; tip: string }[] = [
  { k: "hosp", icon: "🛡️", n: "고용안정성", tip: "공고만 믿고 2년 희망고문 당하는 후배가 없도록, 탭 한 번만 남겨주세요." },
  { k: "pay", icon: "💰", n: "통장 실수령", tip: "연봉과 연차만 적으면 실수령이 계산돼요. 처음엔 “4,000만 원대”처럼만 보여요." },
  { k: "alba", icon: "⏰", n: "당직·업무환경", tip: "실제 퇴근 시간·오버타임·잡무를 탭 몇 번으로 알려주세요." },
];
function Send({ label }: { label: string }) { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "저장 중…" : label}</button>; }
const Chips = ({ name, opts, values, def }: { name: string; opts: readonly string[]; values?: (string | number)[]; def?: string | number }) =>
  <div className="hc-chips">{opts.map((o, i) => { const v = values ? values[i] : o; return <label key={o}><input type="radio" name={name} value={v} defaultChecked={def !== undefined && String(def) === String(v)} /><span>{o}</span></label>; })}</div>;
function Stars({ name, small, def }: { name: string; small?: boolean; def?: number }) { const [v, setV] = useState(def ?? 0); const W = ["", "많이 아쉬워요", "아쉬워요", "보통", "만족", "아주 만족"];
  return <span className={"hc-stars" + (small ? "" : " big")}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={v >= n ? "on" : ""} onClick={() => setV(n)} aria-label={`${n}점`}>★</button>)}<em className="hc-sw">{W[v]}</em><input type="hidden" name={name} value={v || ""} /></span>; }
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
      <div className="rw-2"><div className="rw-f"><label htmlFor="rw-hb">호봉 <small>(선택)</small></label><select id="rw-hb" name="hobong" defaultValue=""><option value="">선택 안 함</option>{HOBONG.map(x => <option key={x}>{x}</option>)}</select></div>
        <div className="rw-f"><label htmlFor="rw-ar">근무 영역 <small>(선택)</small></label><select id="rw-ar" name="area" defaultValue=""><option value="">선택 안 함</option>{WORK_AREA.map(x => <option key={x}>{x}</option>)}</select></div></div>
      <div className="rw-f"><span className="rw-l">연봉 만족도</span><Stars name="star" /></div>
      <fieldset className="rw-sub"><legend>세부 평가 <small>(선택 · 아는 것만)</small></legend>
        <div className="rw-subg">{PAY_SUB.map(p => <div key={p.k} className="rw-subi"><span>{p.n}</span><Stars name={"sub_" + p.k} small /></div>)}</div>
        <div className="rw-f"><span className="rw-l">이 병원 취업, 추천하나요?</span><Chips name="rec" opts={["👍 추천해요", "👎 비추천"]} values={[1, 0]} /></div></fieldset>
      <div className="rw-f"><label htmlFor="rw-w">한마디 <small>(선택)</small></label><textarea id="rw-w" name="word" rows={3} maxLength={200} placeholder="예: 기본급은 낮은데 인센티브가 매달 나와요. 연봉 협상은 1월에 해요." /></div>
    </> : <>
      {D}
      <div className="rw-f"><span className="rw-l">급여</span><div className="hc-chips">{ALBA_UNIT.map(u => <label key={u}><input type="radio" name="unit" value={u} checked={unit === u} onChange={() => setUnit(u)} /><span>{u}</span></label>)}</div>
        <div className="rw-amt"><input name="amount" type="number" inputMode="numeric" min={1} max={200} placeholder={unit === "일급" ? "예: 15" : "예: 2"} aria-label={`${unit} (만 원)`} /><span>만 원</span></div></div>
      <div className="rw-2"><div className="rw-f"><label htmlFor="rw-t">근무 시간</label><input id="rw-t" name="time" maxLength={30} placeholder="예: 09~18시" /></div><div className="rw-f"><label htmlFor="rw-dy">근무한 날 <small>(선택)</small></label><input id="rw-dy" name="days" maxLength={30} placeholder="예: 토요일 하루, 3일" /></div></div>
      <div className="rw-f"><label htmlFor="rw-cs">하루 검사·환자 건수 <small>(선택 · 대략)</small></label><input id="rw-cs" name="cases" type="number" inputMode="numeric" min={1} max={2000} placeholder="예: 80" /></div>
      <div className="rw-f"><span className="rw-l">세금·신고는 어떻게 했나요?</span><Chips name="tax" opts={ALBA_TAX} /></div>
      <div className="rw-f"><span className="rw-l">식사</span><Chips name="meal" opts={ALBA_MEAL} /></div>
      <div className="rw-f"><span className="rw-l">근무 강도</span><Chips name="load" opts={ALBA_LOAD} /></div>
      <div className="rw-f"><span className="rw-l">또 갈 의향이 있나요?</span><Chips name="again" opts={["👍 또 갈래요", "👎 안 갈래요"]} values={[1, 0]} /></div>
      <div className="rw-f"><span className="rw-l">총평 <small>(선택)</small></span><Stars name="star" /></div>
      <div className="rw-f"><label htmlFor="rw-wk">주로 한 일 <small>(선택)</small></label><textarea id="rw-wk" name="work" rows={3} maxLength={500} placeholder="예: 검진 채혈, 접수 보조, 판독 준비" /></div>
      <div className="rw-f"><label htmlFor="rw-nt">다음 사람에게 인계 한마디 <small>(선택)</small></label><textarea id="rw-nt" name="note" rows={3} maxLength={500} placeholder="예: 주차 안 돼요. 점심은 12시 반, 장비는 ○○ 써요." /></div>
    </>}
    <div className="wz-safe">🔒 닉네임 없이 <b>익명</b>으로 올라가요. 19금·욕설과 전화번호만 막아요.</div>
    {st?.error && <div className="error" role="alert">{st.error}</div>}
    <Send label={kind === "pay" ? "💰 연봉 후기 올리기 (+30 XP)" : "⏰ 알바·당직 후기 올리기 (+30 XP)"} />
  </form>;
}
const MAIN_DEPTS: [string, string][] = [["간호사", "간호사"], ["방사선", "방사선사"], ["임상병리", "임상병리사"], ["물리치료", "물리치료사"]];
const Pills = ({ name, items, def, wide }: { name: string; items: { v: string | number; n: string; sub?: string; tone?: string }[]; def?: string | number | null; wide?: boolean }) =>
  <div className={"fq-pills" + (wide ? " wide" : "")} role="radiogroup">{items.map(o => <label key={o.v} className={"fq-pill" + (o.tone ? " t-" + o.tone : "")}><input type="radio" name={name} value={o.v} defaultChecked={def !== undefined && def !== null && String(def) === String(o.v)} /><span><b>{o.n}</b>{o.sub && <small>{o.sub}</small>}</span></label>)}</div>;
/** 🛡️ 고용안정성 — 병원 고르고 칩 하나 누르면 끝. 직종·현직은 가입 정보로 채워두고, 나머지는 '더 남기기'에 접어둠 */
function QuickForm({ hospital, dept, mine }: { hospital?: Hosp | null; dept?: string; mine?: any }) {
  const [st, act] = useFormState(submitQuickReview, undefined); const d0: string = mine?.dept ?? (JOB_DEPTS.includes(dept as any) ? dept : "") ?? "";
  const [dp, setDp] = useState<string>(d0), [status, setStatus] = useState<string>(mine?.status ?? "재직"), [edit, setEdit] = useState(!d0);
  const dn = MAIN_DEPTS.find(m => m[0] === dp)?.[1] ?? dp;
  return <form action={act} className="form rw-form q1">
    <HospPick hospital={hospital} />
    <div className="rw-f"><span className="q1-q">계약직 → 정규직, 얼마나 되나요?</span>
      <Pills name="hire" wide items={HIRE_PILLS.map(p => ({ v: p.v, n: p.n, sub: p.sub, tone: p.tone }))} def={mine?.regular} /></div>
    <input type="hidden" name="dept" value={dp} /><input type="hidden" name="status" value={status} />
    {!edit ? <p className="q1-me"><b>{dn} · {status === "재직" ? "현직" : "전직"}</b>으로 올라가요 <button type="button" onClick={() => setEdit(true)}>바꾸기</button></p>
      : <div className="q1-edit"><select aria-label="내 직종" value={dp} onChange={e => setDp(e.target.value)}><option value="" disabled>내 직종 선택</option>{JOB_DEPTS.map(d => <option key={d} value={d}>{MAIN_DEPTS.find(m => m[0] === d)?.[1] ?? d}</option>)}</select>
        <div className="rw-seg" role="radiogroup" aria-label="재직 상태">{[["재직", "현직"], ["퇴사", "전직"]].map(([v, n]) => <button key={v} type="button" role="radio" aria-checked={status === v} className={status === v ? "on" : ""} onClick={() => setStatus(v)}>{n}</button>)}</div></div>}
    <details className="q1-more" open={!!(mine?.pros || mine?.cons || typeof mine?.after2 === "number")}><summary>✍️ 한마디 더 남기기 <small>(선택)</small></summary>
      <div className="rw-f"><span className="rw-l">2년 채우면 어떻게 되나요?</span><Pills name="after2" items={AFTER2.map((n, i) => ({ v: i, n }))} def={mine?.after2} /></div>
      <div className="rw-f"><label htmlFor="rq-pr">장점</label><textarea id="rq-pr" name="pros" rows={2} maxLength={500} defaultValue={mine?.pros ?? ""} placeholder="예: 2년 차에 대부분 정규직 면접 기회를 줘요." /></div>
      <div className="rw-f"><label htmlFor="rq-cn">지원 전에 꼭 알아야 할 점</label><textarea id="rq-cn" name="cons" rows={2} maxLength={500} defaultValue={mine?.cons ?? ""} placeholder="예: 공고엔 “전환 가능”인데 최근 3년간 전환된 사람을 못 봤어요." /></div>
    </details>
    {st?.error && <div className="error" role="alert">{st.error}</div>}
    <Send label={mine ? "✏️ 수정하기" : "제보하기 (+50 XP)"} />
    <p className="q1-safe">🔒 익명 · 병원·직종·현직/전직만 보여요</p>
  </form>;
}
/** ✍️ 팩트 제보 — 🛡️ 고용안정성(메인) / 💰 실수령 / ⏰ 당직·업무환경(근무 중 병원 체크 ↔ 단기 알바·당직 후기) */
export default function ReviewWrite({ hospital, dept, mine, t0 }: { hospital?: Hosp | null; dept?: string; mine?: HFact | null; t0?: T }) {
  const [t, setT] = useState<T>(t0 ?? "hosp"), [alba, setAlba] = useState(t0 === "alba"); const cur = TABS.find(x => x.k === t)!;
  return <div className="rw fx">
    <div className="q1-tabs" role="tablist" aria-label="제보 종류">{TABS.map(x => <button key={x.k} type="button" role="tab" aria-selected={t === x.k} className={t === x.k ? "on" : ""} onClick={() => setT(x.k)}>{x.icon} {x.n}</button>)}</div>
    <p className="q1-tip">{cur.tip}</p>
    <div className="card fx-card">{t === "hosp" ? <QuickForm hospital={hospital} dept={dept} mine={mine} /> : t === "pay" ? <ExtraForm kind="pay" hospital={hospital} dept={dept} /> : alba ? <ExtraForm kind="alba" hospital={hospital} dept={dept} /> : <HospCheck hospital={hospital} dept={dept} mine={mine} />}</div>
    {t === "alba" && <button type="button" className="rw-full" onClick={() => setAlba(a => !a)}>{alba ? "‹ 다니는(다녔던) 병원 체크로 돌아가기" : "⏱ 단기 알바·당직 알바였다면 → 알바 후기 쓰기 ›"}</button>}
  </div>;
}
