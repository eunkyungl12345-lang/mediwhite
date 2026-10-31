"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createJob } from "@/lib/jobActions";
import { JOB_REGIONS, JOB_DEPTS, EMP_TYPES } from "@/lib/jobs";
function Submit() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "올리는 중…" : "💼 채용공고 올리기 (+20 XP)"}</button>; }
export default function JobForm({ dept }: { dept?: string }) {
  const [st, action] = useFormState(createJob, undefined);
  return <form action={action} className="form jb-form">
    <label className="jb-lab">병원명 *<input name="hospital" maxLength={40} placeholder="예: 동탄○○정형외과 (실제 병원명 — 채용공고라 공개돼요)" required /></label>
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      <label className="jb-lab">지역 *<select name="region" required defaultValue="경기 남부">{JOB_REGIONS.map(r => <option key={r}>{r}</option>)}</select></label>
      <label className="jb-lab">모집 직종 *<select name="dept" required defaultValue={JOB_DEPTS.includes(dept as any) ? dept : "간호사"}>{JOB_DEPTS.map(r => <option key={r}>{r}</option>)}</select></label>
      <label className="jb-lab">고용 형태 *<select name="emp_type" required defaultValue="정규직">{EMP_TYPES.map(r => <option key={r}>{r}</option>)}</select></label>
    </div>
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
      <label className="jb-lab">급여<input name="pay" maxLength={60} placeholder="예: 연 3,600~4,000 / 월 280 / 면접 후 협의" /></label>
      <label className="jb-lab">근무 시간<input name="hours" maxLength={60} placeholder="예: 평일 9-18, 토 격주 / 3교대" /></label>
      <label className="jb-lab">마감일<input name="deadline" type="date" /></label>
    </div>
    <label className="jb-lab">복지·혜택<input name="welfare" maxLength={200} placeholder="예: 식대·명절 보너스·연차 15일·기숙사·학자금" /></label>
    <label className="jb-lab">업무 내용 · 자격 요건 *<textarea name="body" maxLength={2000} rows={6} required placeholder={"담당 업무, 필요한 자격·경력, 우대사항, 병원 소개 등\n예) 외래 간호 / 신규 가능 / 정형외과 경력 우대 / 주사·드레싱·수술 보조"} /></label>
    <label className="jb-lab">지원 방법·연락처<input name="contact" maxLength={120} placeholder="예: 이력서 → abc@hospital.com / 원무과 031-000-0000 / 메디화이트 1:1 문의" /></label>
    <div className="muted" style={{ fontSize: 12 }}>✔️ 채용공고는 병원명·연락처가 공개돼요 · 허위 공고·개인 연락처 수집 목적 글은 삭제되고 제재받아요 · 올린 사람은 나중에 "마감" 처리할 수 있어요.</div>
    {st?.error && <div className="error">{st.error}</div>}
    <Submit />
  </form>;
}
