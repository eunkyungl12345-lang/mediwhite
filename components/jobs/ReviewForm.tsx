"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { createReview, searchHospitals } from "@/lib/jobActions";
import { JOB_REGIONS, JOB_DEPTS, HOSP_KINDS, RATING_KEYS } from "@/lib/jobs";
import { shrinkImage } from "@/lib/shrink";

function Stars({ name, label, icon }: { name: string; label: string; icon: string }) {
  const [v, setV] = useState(0), [h, setH] = useState(0);
  return <div className="rv-star-row"><span className="rv-star-lab">{icon} {label}</span>
    <span className="rv-stars" onMouseLeave={() => setH(0)}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={"rv-star" + ((h || v) >= n ? " on" : "")} onMouseEnter={() => setH(n)} onClick={() => setV(n)} aria-label={`${n}점`}>★</button>)}</span>
    <span className="rv-star-val">{v ? ["", "별로", "아쉬움", "보통", "좋음", "최고"][v] : ""}</span>
    <input type="hidden" name={name} value={v || ""} /></div>;
}
function Submit() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "저장 중…" : "⭐ 리뷰 남기기 (+40 XP)"}</button>; }
export default function ReviewForm({ hospital, dept, mine, proofState }: { hospital?: { id: number; name: string; region: string } | null; dept?: string; mine?: any; proofState?: "pending" | "verified" | null }) {
  const [st, action] = useFormState(createReview, undefined);
  const [q, setQ] = useState(""), [hits, setHits] = useState<any[]>([]), [picked, setPicked] = useState<{ id: number; name: string; region: string } | null>(hospital ?? null), [isNew, setIsNew] = useState(false);
  const search = async (v: string) => { setQ(v); setPicked(null); setIsNew(false); if (v.trim().length >= 1) setHits(await searchHospitals(v)); else setHits([]); };
  return <form action={action} className="form rv-form">
    {!hospital && <div className="rv-pick">
      <label className="jb-lab">병원 찾기 *<input value={picked ? `${picked.name} (${picked.region})` : q} onChange={e => search(e.target.value)} placeholder="병원명 검색 — 없으면 새로 등록" autoComplete="off" /></label>
      {!picked && q && <div className="rv-hits">{hits.map(h => <button key={h.id} type="button" className="rv-hit" onClick={() => { setPicked(h); setHits([]); }}>🏥 {h.name} <small className="muted">{h.region} · {h.kind}</small></button>)}
        <button type="button" className="rv-hit new" onClick={() => { setIsNew(true); setHits([]); }}>➕ “{q}” 새 병원으로 등록</button></div>}
      {isNew && !picked && <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
        <input type="hidden" name="name" value={q} />
        <label className="jb-lab">지역 *<select name="region" defaultValue="경기 남부">{JOB_REGIONS.map(r => <option key={r}>{r}</option>)}</select></label>
        <label className="jb-lab">종류 *<select name="kind" defaultValue="병원">{HOSP_KINDS.map(r => <option key={r}>{r}</option>)}</select></label>
      </div>}
    </div>}
    <input type="hidden" name="hospital_id" value={picked?.id ?? ""} />
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      <label className="jb-lab">내 직종 *<select name="dept" defaultValue={mine?.dept ?? (JOB_DEPTS.includes(dept as any) ? dept : "간호사")}>{JOB_DEPTS.map(r => <option key={r}>{r}</option>)}</select></label>
      <label className="jb-lab">상태 *<select name="status" defaultValue={mine?.status ?? "재직"}><option>재직</option><option>퇴사</option></select></label>
    </div>
    <div className="rv-starbox">{RATING_KEYS.map(k => <Stars key={k.key} name={k.key} label={k.name} icon={k.icon} />)}</div>
    <label className="jb-lab">👍 장점 *<textarea name="pros" maxLength={600} rows={3} required defaultValue={mine?.pros ?? ""} placeholder="예: 연차 눈치 안 보고 씀, 점심 제공, 선배들이 잘 가르쳐줌" /></label>
    <label className="jb-lab">👎 단점 *<textarea name="cons" maxLength={600} rows={3} required defaultValue={mine?.cons ?? ""} placeholder="예: 토요일 격주 근무, 인력이 빠듯해서 연차 겹치면 힘듦" /></label>
    {proofState === "verified" ? <div className="rv-proof ok">✅ 이 리뷰는 재직 인증이 완료됐어요</div> : proofState === "pending" ? <div className="rv-proof wait">⏳ 재직 인증 심사 중 — 운영팀 확인 후 ✅ 마크가 붙어요</div> : <label className="rv-proof"><b>📎 재직 인증 서류 (선택 · 강력 추천)</b><small className="muted">건강보험 자격득실확인서 · 재직증명서 · 사원증 · 급여명세서(금액 가려도 OK) 중 1장. 운영팀만 보고 심사 즉시 삭제돼요. 인증되면 리뷰에 <b>✅ 재직 인증</b> 마크가 붙고 더 신뢰받아요.</small><input type="file" name="proof" accept="image/*" onChange={async e => { const inp = e.target, f = inp.files?.[0]; if (!f) return; const small = await shrinkImage(f); try { const dt = new DataTransfer(); dt.items.add(small); inp.files = dt.files; } catch {} }} /></label>}
    <label className="jb-lab">💡 면접·입사 팁 (선택)<textarea name="tip" maxLength={300} rows={2} defaultValue={mine?.tip ?? ""} placeholder="예: 면접 때 교대 가능 여부 꼭 물어봄, 수습 3개월" /></label>
    <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>🕶️ 리뷰는 <b>닉네임 없이 직종·재직여부만</b> 표시돼요 · 병원 1곳당 1개(다시 쓰면 덮어써요) · 사람 이름·호칭(○○실장님 등)은 금지 — 사람이 아니라 병원·제도에 대한 후기만 · 허위·비방은 신고 시 블라인드 처리돼요.</div>
    {st?.error && <div className="error">{st.error}</div>}
    <Submit />
  </form>;
}
