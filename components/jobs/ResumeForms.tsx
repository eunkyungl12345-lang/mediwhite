"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { saveResume, applyWithResume, cancelApply, setAppStatus } from "@/lib/resume.actions";
import { SEEK_WANT, SEEK_YEARS } from "@/lib/seek";
import { AUTHOR_STATUS, statusOf, type Apply, type Resume } from "@/lib/resume";
import { deptLabel } from "@/lib/depts";

const Btn = ({ t, note }: { t: string; note?: string }) => { const { pending } = useFormStatus(); return <button className="btn" disabled={pending} style={{ width: "100%" }}>{pending ? (note ?? "저장 중…") : t}</button>; };
const Pick = ({ name, opts, v }: { name: string; opts: readonly string[]; v?: string }) => <select name={name} defaultValue={v ?? ""} required><option value="" disabled>선택</option>{opts.map(o => <option key={o}>{o}</option>)}</select>;

/** 📄 내 이력서 작성·수정 (1분 폼) */
export function ResumeForm({ v, depts, regions, myDept, back }: { v: Resume | null; depts: readonly string[]; regions: readonly string[]; myDept: string; back?: string }) {
  const [st, act] = useFormState(saveResume, undefined);
  return <form action={act} className="sk-form cv-form">
    <div className="sk-grid">
      <label>이름<input name="name" required maxLength={30} defaultValue={v?.name} placeholder="예) 이은경" autoComplete="name" /></label>
      <label>연락처<input name="contact" required maxLength={60} defaultValue={v?.contact} placeholder="010-0000-0000 또는 메일" autoComplete="tel" inputMode="tel" /></label>
      <label>직종<Pick name="dept" opts={depts} v={v?.dept ?? (depts.includes(myDept) ? myDept : "")} /></label>
      <label>경력<Pick name="years" opts={SEEK_YEARS} v={v?.years} /></label>
      <label>희망 근무<Pick name="want" opts={SEEK_WANT} v={v?.want} /></label>
      <label>희망 지역<Pick name="region" opts={regions} v={v?.region} /></label>
    </div>
    <label><span>보유 술기·장비·자격 <small className="muted">(100자)</small></span><input name="skills" maxLength={100} defaultValue={v?.skills} placeholder="예) C-arm·CT 가능, 척추 수술방 4년, 방사선사 면허" /></label>
    <label><span>경력 요약·자기소개 <small className="muted">(800자)</small></span><textarea name="career" maxLength={800} rows={6} defaultValue={v?.career} placeholder={"예)\n2021~2025 ○○정형외과 영상의학과 — X-ray·CT·C-arm\n수술실 이동형 촬영, 신규 선생님 장비 교육 담당\n장기 근무 가능하고 야간·당직은 협의 가능해요"} /></label>
    <label className="sk-chk"><input type="checkbox" name="agree" defaultChecked={!!v} />지원할 때 이 이력서를 그 공고 작성자(병원)에게 전달하는 데 동의해요 <b className="muted">(필수)</b></label>
    {st?.error && <div className="error">{st.error}</div>}{st?.ok && <div className="sk-ok">{st.ok}</div>}
    <Btn t={v ? "이력서 수정 저장" : "📄 이력서 저장 (1분)"} />
    {st?.ok && back && <Link href={back} className="btn ghost" style={{ textAlign: "center" }}>← 공고로 돌아가서 바로 지원하기</Link>}
    <p className="muted" style={{ fontSize: 12, margin: 0 }}>이름·연락처는 <b>내가 지원한 공고의 작성자에게만</b> 보여요. 익명 구직 프로필과는 별개이고, 언제든 수정·삭제할 수 있어요.</p>
  </form>;
}

/** 🚀 공고 페이지의 간편 지원 카드 */
export function ApplyBox({ jobId, resume, apply }: { jobId: number; resume: Resume | null; apply: Apply | null }) {
  const r = useRouter(); const [p, start] = useTransition();
  const [st, act] = useFormState(applyWithResume, undefined);
  useEffect(() => { if (st?.ok) r.refresh(); }, [st?.ok, r]);
  if (apply) return <div className="jd-ap-in">
    <div className="jd-ap-done"><b>{statusOf(apply.status).seeker}</b><span>{apply.at?.slice(0, 10).replaceAll("-", ".")} 지원 · {deptLabel(apply.dept)} {apply.years}</span></div>
    {apply.msg && <p className="jd-ap-msg">“{apply.msg}”</p>}
    <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 0" }}>지원서가 공고 작성자에게 전달됐어요. 상태가 바뀌면 알림으로 알려드려요.</p>
    <div className="jd-ap-foot">
      <Link href="/jobs/resume#apps" className="link">📄 내 지원 현황 보기</Link>
      <button type="button" className="link" disabled={p} onClick={() => { if (confirm("지원을 취소할까요? 작성자 목록에서도 사라져요.")) start(async () => { await cancelApply(jobId); r.refresh(); }); }}>지원 취소</button>
    </div>
  </div>;
  if (!resume) return <div className="jd-ap-in">
    <p style={{ margin: "0 0 10px", fontSize: 14 }}>이 공고는 <b>메디화이트에서 바로 지원</b>할 수 있어요. 이력서만 한 번 만들어두면 끝!</p>
    <Link href={`/jobs/resume?back=/jobs/${jobId}`} className="btn" style={{ display: "block", textAlign: "center" }}>📄 이력서 1분 작성하고 바로 지원하기</Link>
    <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>이름·연락처·경력만 적으면 돼요. 보낸 이력서는 지원한 공고 작성자에게만 전달돼요.</p>
  </div>;
  return <form action={act} className="jd-ap-in">
    <input type="hidden" name="jobId" value={jobId} />
    <div className="jd-ap-who"><b>{resume.name}</b><span>{deptLabel(resume.dept)} · {resume.years} · {resume.want}</span><Link href={`/jobs/resume?back=/jobs/${jobId}`} className="link">수정</Link></div>
    {resume.skills && <div className="jd-ap-sk">💪 {resume.skills}</div>}
    {resume.career && <p className="jd-ap-career">{resume.career.length > 180 ? resume.career.slice(0, 180) + "…" : resume.career}</p>}
    <input type="text" name="msg" maxLength={200} placeholder="한 줄 어필 (선택) — 예) 출퇴근 20분, 바로 근무 가능해요" className="jd-ap-msg-in" />
    {st?.error && <div className="error">{st.error}</div>}{st?.ok && <div className="sk-ok">{st.ok}</div>}
    <Btn t="🚀 내 이력서로 바로 지원하기" note="지원 중…" />
    <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>지원하면 위 이력서가 이 공고 작성자에게 전달돼요. [지원 취소]를 누르면 바로 지워져요.</p>
  </form>;
}

/** 📩 작성자: 지원자 상태 토글 */
export function ApplicantStatus({ jobId, k, status }: { jobId: number; k: string; status: string }) {
  const r = useRouter(); const [p, start] = useTransition(); const [err, setErr] = useState<string>();
  const cur = statusOf(status);
  return <div className="jd-app-st">
    {AUTHOR_STATUS.map(s => <button key={s.k} type="button" disabled={p} className={"jd-st" + (cur.k === s.k ? " on" : "")}
      onClick={() => start(async () => { const res = await setAppStatus(jobId, k, s.k); if (res?.error) setErr(res.error); else { setErr(undefined); r.refresh(); } })}>{s.author}</button>)}
    {err && <span className="error" style={{ fontSize: 12 }}>{err}</span>}
  </div>;
}

/** 📋 외부 공고: 내 이력서 내용 복사 */
export function ResumeCopy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return <div className="cv-copy">
    <pre className="cv-pre">{text}</pre>
    <button type="button" className="btn ghost sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2500); } catch { setDone(false); }
    }}>{done ? "✅ 복사됐어요" : "📋 이력서 내용 복사"}</button>
  </div>;
}
