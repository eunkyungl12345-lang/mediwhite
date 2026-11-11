"use client";
import RegionPick from "./RegionPick";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { submitBrag } from "@/lib/bragActions";
import { searchHospitals } from "@/lib/jobActions";
import { JOB_REGIONS, HOSP_KINDS } from "@/lib/jobs";
import { BRAG_TAGS } from "@/lib/brag";
import { shrinkImage } from "@/lib/shrink";
function Send() { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "올리는 중…" : "🏆 우리 병원 자랑 올리기"}</button>; }
export default function BragForm({ hospital, mine }: { hospital?: { id: number; name: string; region: string } | null; mine?: { tags: string[]; text: string; urls: string[] } | null }) {
  const [st, act] = useFormState(submitBrag, undefined);
  const [q, setQ] = useState(""), [hits, setHits] = useState<any[]>([]), [picked, setPicked] = useState(hospital ?? null), [isNew, setIsNew] = useState(false), [prev, setPrev] = useState<string[]>(mine?.urls ?? []);
  const search = async (v: string) => { setQ(v); setPicked(null); setIsNew(false); setHits(v.trim() ? await searchHospitals(v) : []); };
  return <form action={act} className="form hc">
    {!hospital && <div className="rv-pick">
      <label className="jb-lab">우리 병원 이름<input value={picked ? `${picked.name} (${picked.region})` : q} onChange={e => search(e.target.value)} placeholder="병원 이름 검색 — 없으면 새로 등록" autoComplete="off" /></label>
      {!picked && !isNew && q && <div className="rv-hits">{hits.map(h => <button key={h.id} type="button" className="rv-hit" onClick={() => { setPicked(h); setHits([]); }}>🏥 {h.name} <small className="muted">{h.region} · {h.kind}</small></button>)}
        <button type="button" className="rv-hit new" onClick={() => { setIsNew(true); setHits([]); }}>➕ “{q}” 새 병원으로 등록</button></div>}
      {isNew && !picked && <div className="row" style={{ gap: 6, flexWrap: "wrap" }}><input type="hidden" name="name" value={q} />
        <RegionPick />
        <label className="jb-lab">종류<select name="kind" defaultValue="병원">{HOSP_KINDS.map(r => <option key={r}>{r}</option>)}</select></label></div>}
    </div>}
    <input type="hidden" name="hospital_id" value={picked?.id ?? ""} />
    <div className="hc-q"><b>📸 병원 사진 <small>(최대 3장 · 휴게실·식당·뷰·시설 등)</small></b>
      <label className="bg-up">{prev.length ? <span className="bg-prev">{prev.map((u, i) => <img key={i} src={u} alt="" />)}</span> : <span>＋ 사진 고르기</span>}
        <input type="file" name="photo" accept="image/*" multiple onChange={async e => { const inp = e.target; const fs = Array.from(inp.files ?? []).slice(0, 3); if (!fs.length) return; const small = await Promise.all(fs.map(f => shrinkImage(f, 1400, .82))); try { const dt = new DataTransfer(); small.forEach(f => dt.items.add(f)); inp.files = dt.files; } catch {} setPrev(small.map(f => URL.createObjectURL(f))); }} /></label>
      <small className="muted">⚠️ 환자·동료 얼굴, 차트·모니터 화면, 이름표가 나오면 안 돼요. 사진 위치정보는 자동으로 지워져요.</small></div>
    <div className="hc-q"><b>✨ 자랑 포인트</b><div className="hc-chips multi">{BRAG_TAGS.map(t => <label key={t}><input type="checkbox" name="tag" value={t} defaultChecked={mine?.tags.includes(t)} /><span>{t}</span></label>)}</div></div>
    <label className="hc-q"><b>💬 자랑 한마디</b><textarea name="text" rows={3} maxLength={300} defaultValue={mine?.text ?? ""} placeholder="예: 점심 뷔페가 호텔급이에요. 신규 때 프리셉터 선생님이 진짜 천사였어요 🥹" /></label>
    {st?.error && <div className="error">{st.error}</div>}
    <Send />
  </form>;
}
