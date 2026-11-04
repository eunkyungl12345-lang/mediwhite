"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createJob } from "@/lib/jobActions";
import { useState } from "react";
import { JOB_REGIONS, JOB_DEPTS, EMP_TYPES } from "@/lib/jobs";
import { JOB_TAGS } from "@/lib/jobTags";
function Submit({ share }: { share: boolean }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "올리는 중…" : share ? "📢 공고 제보하기 (+30 XP)" : "💼 채용공고 올리기 (+20 XP)"}</button>; }
export default function JobForm({ dept, tip }: { dept?: string; tip?: boolean }) {
  const [st, action] = useFormState(createJob, undefined); const [who, setWho] = useState(tip ? "share" : "own"); const share = who === "share";
  return <form action={action} className="form jb-form">
    <div className="jb-who" role="radiogroup">
      <label className={!share ? "on" : ""}><input type="radio" name="who" value="own" checked={!share} onChange={() => setWho("own")} /><b>🏥 우리 병원 구인</b><small>병원·관리자가 직접 올려요</small></label>
      <label className={share ? "on" : ""}><input type="radio" name="who" value="share" checked={share} onChange={() => setWho("share")} /><b>📢 어디서 본 공고 제보</b><small>단톡방·지인·병원 게시판에서 본 공고</small></label>
    </div>
    {share && <div className="jb-tipnote">메디잡·사람인에 안 올라오는 공고가 여기 모일수록 다들 여기서 찾아요. 받은 공고 내용을 <b>그대로 붙여넣기</b>만 해도 돼요. (개인 번호는 지워주세요)</div>}
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
    <fieldset className="jb-tagpick"><legend>현장 정보 <small>다른 구인사이트엔 잘 없는 정보 — 아는 것만 체크</small></legend>
      {JOB_TAGS.map(t => <label key={t.id}><input type="checkbox" name="tag" value={t.id} /><span>{(t as any).label ?? t.id}</span></label>)}
    </fieldset>
    <label className="jb-lab">복지·혜택<input name="welfare" maxLength={200} placeholder="예: 식대·명절 보너스·연차 15일·기숙사·학자금" /></label>
    <label className="jb-lab">업무 내용 · 자격 요건 *<textarea name="body" maxLength={2000} rows={6} required placeholder={share ? "받은 공고 내용을 그대로 붙여넣어 주세요 (업무·자격·근무조건·지원방법 등)" : "담당 업무, 필요한 자격·경력, 우대사항, 병원 소개 등\n예) 외래 간호 / 신규 가능 / 정형외과 경력 우대 / 주사·드레싱·수술 보조"} /></label>
    <label className="jb-lab">지원 방법·연락처<input name="contact" maxLength={300} placeholder="원문 공고 링크(https://…)를 넣으면 '원문 보고 지원' 버튼이 생겨요 · 또는 이메일·원무과 번호" /></label>
    <div className="muted" style={{ fontSize: 12 }}>✔️ 채용공고는 병원명·연락처가 공개돼요 · 허위 공고·개인 연락처 수집 목적 글은 삭제되고 제재받아요 · 올린 사람은 나중에 "마감" 처리할 수 있어요.</div>
    {st?.error && <div className="error">{st.error}</div>}
    <Submit share={share} />
  </form>;
}
