"use client";
import { useFormState, useFormStatus } from "react-dom";
import { requestTakedown } from "@/lib/growth.actions";
function Send() { const { pending } = useFormStatus(); return <button className="btn ghost" disabled={pending}>{pending ? "보내는 중…" : "요청 보내기"}</button>; }
/** 🏥 병원 관계자 반론·게시중단 요청 */
export default function Takedown({ hid }: { hid: number }) {
  const [st, act] = useFormState(requestTakedown, undefined);
  return <details className="td"><summary>🏥 병원 관계자이신가요? 반론·게시중단 요청</summary>
    {st?.ok ? <div className="fb-thanks">{st.ok}</div> : <form action={act} className="form" style={{ gap: 8 }}>
      <input type="hidden" name="hid" value={hid} />
      <input name="who" maxLength={40} placeholder="소속·직책 (예: ○○병원 원무과장)" />
      <input name="contact" maxLength={80} placeholder="회신받을 연락처 (이메일·병원 대표번호)" />
      <select name="what" defaultValue="리뷰"><option>리뷰</option><option>실체 체크 집계</option><option>퇴사자 한마디</option><option>자랑 글·사진</option><option>기타</option></select>
      <textarea name="detail" rows={4} maxLength={1000} placeholder="어떤 내용이, 왜 사실과 다르거나 권리를 침해하는지 적어주세요. 근거가 있으면 함께 적어주시면 빨리 처리돼요." />
      {st?.error && <div className="error">{st.error}</div>}
      <Send /><small className="muted">정보통신망법 제44조의2에 따른 임시조치 요청 창구예요. 운영팀이 검토 후 회신해요.</small>
    </form>}
  </details>;
}
