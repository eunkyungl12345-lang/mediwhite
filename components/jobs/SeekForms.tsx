"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveSeek, sendOffer } from "@/lib/seek.actions";
import { SEEK_WANT, SEEK_YEARS, type Seek } from "@/lib/seek";
const Btn = ({ t }: { t: string }) => { const { pending } = useFormStatus(); return <button className="btn" disabled={pending} style={{ width: "100%" }}>{pending ? "저장 중…" : t}</button>; };
const Pick = ({ name, opts, v }: { name: string; opts: readonly string[]; v?: string }) => <select name={name} defaultValue={v ?? ""} required><option value="" disabled>선택</option>{opts.map(o => <option key={o}>{o}</option>)}</select>;
/** 🙋 내 구직 프로필 작성/수정 */
export function SeekForm({ v, depts, regions, myDept }: { v: Seek | null; depts: readonly string[]; regions: readonly string[]; myDept: string }) {
  const [st, act] = useFormState(saveSeek, undefined);
  return <form action={act} className="sk-form">
    <div className="sk-grid">
      <label>직종<Pick name="dept" opts={depts} v={v?.dept ?? (depts.includes(myDept) ? myDept : "")} /></label>
      <label>연차<Pick name="years" opts={SEEK_YEARS} v={v?.years} /></label>
      <label>희망 지역<Pick name="region" opts={regions} v={v?.region} /></label>
      <label>근무 형태<Pick name="want" opts={SEEK_WANT} v={v?.want} /></label>
    </div>
    <label><span>잘하는 것 <small className="muted">(60자)</small></span><input name="skills" maxLength={60} defaultValue={v?.skills} placeholder="예) C-arm·CT 가능, 척추 수술방 3년" /></label>
    <label><span>한 줄 소개 <small className="muted">(200자)</small></span><textarea name="intro" maxLength={200} rows={3} defaultValue={v?.intro} placeholder="예) 출퇴근 1시간 이내, 정규직 전환 되는 곳이면 좋겠어요" /></label>
    <label className="sk-chk"><input type="checkbox" name="open" defaultChecked={v ? v.open : true} />병원에 공개하고 제안 받기</label>
    {st?.error && <div className="error">{st.error}</div>}{st?.ok && <div className="sk-ok">{st.ok}</div>}
    <Btn t={v ? "프로필 수정" : "🙋 익명 프로필 올리기"} />
    <p className="muted" style={{ fontSize: 12, margin: 0 }}>이름·연락처·닉네임은 병원에 보이지 않아요. 제안이 오면 병원이 남긴 연락처를 보고 내가 연락할지 정하면 돼요.</p>
  </form>;
}
/** 📨 채용 제안 보내기 */
export function OfferForm({ k }: { k: string }) {
  const [open, setOpen] = useState(false); const [st, act] = useFormState(sendOffer, undefined);
  if (st?.ok) return <span className="sk-ok">✅ 제안 보냄</span>;
  if (!open) return <button type="button" className="btn" onClick={() => setOpen(true)}>📨 채용 제안하기</button>;
  return <form action={act} className="sk-form sk-offer">
    <input type="hidden" name="key" value={k} />
    <input name="hosp" maxLength={40} required placeholder="병원명 (예: ○○정형외과의원)" />
    <textarea name="msg" maxLength={300} rows={3} required placeholder="근무 조건·급여·근무시간 등 제안 내용" />
    <input name="contact" maxLength={60} required placeholder="채용 담당 연락처 (병원 대표번호·채용 메일 권장)" />
    {st?.error && <div className="error">{st.error}</div>}
    <div className="row" style={{ gap: 8 }}><Btn t="제안 보내기" /><button type="button" className="link" onClick={() => setOpen(false)}>취소</button></div>
  </form>;
}
