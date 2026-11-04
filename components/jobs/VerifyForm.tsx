"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { requestHVerify } from "@/lib/hverify.actions";
import { shrinkImage } from "@/lib/shrink";
function Send() { const { pending } = useFormStatus(); return <button className="btn hc-send" disabled={pending}>{pending ? "올리는 중…" : "📮 인증 신청하기"}</button>; }
const GUIDE = {
  work: { t: "🪪 명찰 + 닉네임 포스트잇", steps: ["병원 명찰을 준비해요 (사원증·출입증도 OK)", "포스트잇에 메디화이트 닉네임을 손글씨로 써요", "명찰과 포스트잇이 한 장에 같이 나오게 찍어요"], hide: "사진·얼굴은 가려도 돼요. 병원 이름만 보이면 돼요." },
  exit: { t: "📄 자격득실확인서 + 닉네임 포스트잇", steps: ["The건강보험 앱(또는 정부24)에서 '자격득실확인서'를 띄워요 — 무료·1분", "포스트잇에 메디화이트 닉네임을 손글씨로 써요", "화면(또는 출력물)과 포스트잇이 한 장에 같이 나오게 찍어요"], hide: "주민번호·다른 직장은 가려도 돼요. 병원 이름과 근무 기간만 보이면 돼요. 경력증명서·퇴직증명서도 OK." },
} as const;
/** ✅ 병원 재직/퇴사 인증 신청 */
export default function VerifyForm({ hid, nick, kind0 }: { hid: number; nick: string; kind0: "work" | "exit" }) {
  const [st, act] = useFormState(requestHVerify, undefined); const [kind, setKind] = useState(kind0), [prev, setPrev] = useState(""); const g = GUIDE[kind];
  if (st?.ok) return <div className="fb-thanks">📮 {st.ok}</div>;
  return <form action={act} className="form hc">
    <input type="hidden" name="hid" value={hid} /><input type="hidden" name="kind" value={kind} />
    <div className="jb-who"><label className={kind === "work" ? "on" : ""} onClick={() => setKind("work")}><b>🏥 지금 다녀요</b><small>명찰로 인증</small></label><label className={kind === "exit" ? "on" : ""} onClick={() => setKind("exit")}><b>🚪 퇴사했어요</b><small>자격득실확인서로 인증</small></label></div>
    <div className="vf-guide"><b>{g.t}</b><ol>{g.steps.map(x => <li key={x}>{x}</li>)}</ol>
      <div className="vf-postit">포스트잇에 이렇게 써주세요<span>메디화이트 {nick}</span></div>
      <small>🙈 {g.hide}</small></div>
    <label className="bg-up">{prev ? <span className="bg-prev"><img src={prev} alt="" style={{ width: "60%" }} /></span> : <span>📷 인증 사진 고르기</span>}
      <input type="file" name="photo" accept="image/*" onChange={async e => { const inp = e.target, f = inp.files?.[0]; if (!f) return; const sm = await shrinkImage(f, 1600, .85); try { const dt = new DataTransfer(); dt.items.add(sm); inp.files = dt.files; } catch {} setPrev(URL.createObjectURL(sm)); }} /></label>
    <label className="vf-agree"><input type="checkbox" name="agree" /> 사진은 운영자 1명만 확인하고, 승인·거절 즉시 삭제되는 데 동의해요. 인증 후엔 닉네임 대신 <b>{kind === "work" ? "✅ 재직 인증" : "✅ 퇴사 인증"}</b> 마크만 보여요.</label>
    {st?.error && <div className="error">{st.error}</div>}
    <Send />
  </form>;
}
