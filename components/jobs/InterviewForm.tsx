"use client";
import { useFormState, useFormStatus } from "react-dom";
import { submitInterview } from "@/lib/interview.actions";
import { JOB_DEPTS } from "@/lib/jobs";
import { IV_ROUTE, IV_STEPS, IV_RESULT, IV_FEEL, IV_LEVEL, type Interview } from "@/lib/interview";
function Send({ edit }: { edit: boolean }) { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "저장 중…" : edit ? "✏️ 수정 완료" : "🎤 면접 후기 남기기 (+30 XP)"}</button>; }
const R = ({ name, opts, def, values }: { name: string; opts: readonly string[]; def?: string | number; values?: (string | number)[] }) => <div className="hc-chips">{opts.map((o, i) => { const v = values ? values[i] : o; return <label key={o}><input type="radio" name={name} value={v} defaultChecked={def != null && String(def) === String(v)} /><span>{o}</span></label>; })}</div>;
export default function InterviewForm({ hid, dept, mine }: { hid: number; dept: string; mine?: Interview | null }) {
  const [st, act] = useFormState(submitInterview, undefined); const yr = new Date().getFullYear();
  return <form action={act} className="form hc"><input type="hidden" name="hid" value={hid} />
    <div className="wz-safe">🔒 닉네임은 안 보이고 직종·연도만 표시돼요. 면접관 이름 등 특정인을 알 수 있는 내용은 빼주세요.</div>
    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}><label className="jb-lab">지원 직종<select name="dept" defaultValue={mine?.dept ?? (JOB_DEPTS.includes(dept as any) ? dept : "간호사")}>{JOB_DEPTS.map(d => <option key={d}>{d}</option>)}</select></label>
      <label className="jb-lab">면접 연도<select name="year" defaultValue={mine?.year ?? String(yr)}>{[0, 1, 2, 3, 4].map(k => <option key={k}>{yr - k}</option>)}</select></label></div>
    <div className="hc-q"><b>지원 경로</b><R name="route" opts={IV_ROUTE} def={mine?.route} /></div>
    <div className="hc-q"><b>전형 단계 <small>(거친 것 모두)</small></b><div className="hc-chips multi">{IV_STEPS.map(x => <label key={x}><input type="checkbox" name="step" value={x} defaultChecked={mine?.steps.includes(x)} /><span>{x}</span></label>)}</div></div>
    <div className="hc-q"><b>난이도</b><R name="level" opts={IV_LEVEL} values={[1, 2, 3, 4, 5]} def={mine?.level} /></div>
    <div className="hc-q"><b>결과</b><R name="result" opts={IV_RESULT} def={mine?.result} /></div>
    <div className="hc-q"><b>면접 경험</b><R name="feel" opts={IV_FEEL} values={[0, 1, 2]} def={mine?.feel} /></div>
    <label className="hc-q"><b>받은 면접 질문 <small>(20자 이상)</small></b><textarea name="q" rows={4} maxLength={1000} defaultValue={mine?.q} placeholder={"예) 1분 자기소개 / 간호사가 된 이유 / 투약 5Right / 갈등 상황에서 어떻게 할지 / 3교대 괜찮은지"} /></label>
    <label className="hc-q"><b>합격 팁·면접 분위기 <small>(선택)</small></b><textarea name="tip" rows={3} maxLength={500} defaultValue={mine?.tip} placeholder="예) 압박 질문은 없었고 술기 시험은 활력징후·IV 위주였어요" /></label>
    {st?.error && <div className="error">{st.error}</div>}<Send edit={!!mine} /></form>;
}
