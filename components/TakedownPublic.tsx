"use client";
import { useFormState, useFormStatus } from "react-dom";
import { requestTakedown } from "@/lib/growth.actions";
function Send() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending} style={{ width: "100%" }}>{pending ? "보내는 중…" : "게시중단·반론 요청 보내기"}</button>; }
/** 🏥 비회원도 쓰는 게시중단·반론 요청 폼 (정보통신망법 제44조의2) */
export default function TakedownPublic({ hname, url }: { hname?: string; url?: string }) {
  const [st, act] = useFormState(requestTakedown, undefined);
  if (st?.ok) return <div className="td-ok">✅ {st.ok}</div>;
  return <form action={act} className="form td-form">
    <label>병원 이름<input name="hname" maxLength={60} required defaultValue={hname} placeholder="예) ○○정형외과의원" /></label>
    <label><span>문제 되는 글 주소 <small className="muted">(선택)</small></span><input name="url" maxLength={300} defaultValue={url} placeholder="https://mediwhite.vercel.app/hospitals/…" /></label>
    <label>대상<select name="what" defaultValue="리뷰"><option>리뷰</option><option>면접 후기</option><option>실체 체크 집계</option><option>급여·알바 후기</option><option>퇴사자 한마디</option><option>게시판 글·댓글</option><option>기타</option></select></label>
    <label>요청하시는 분<input name="who" maxLength={40} required placeholder="소속·직책 (예: ○○병원 원무과장 / 본인)" /></label>
    <label>회신받을 연락처<input name="contact" maxLength={80} required placeholder="이메일 또는 병원 대표번호" /></label>
    <label>요청 내용<textarea name="detail" rows={5} maxLength={1000} required placeholder="어떤 내용이, 왜 사실과 다르거나 권리를 침해하는지 적어주세요. 근거가 있으면 함께 적어주시면 빨리 처리돼요." /></label>
    <label className="td-agree"><input type="checkbox" name="agree" required /><span>회신을 위한 개인정보(소속·직책, 연락처) 수집·이용에 동의해요. <small className="muted">처리 후 1년 보관 뒤 삭제</small></span></label>
    {st?.error && <div className="error">{st.error}</div>}
    <Send />
  </form>;
}
