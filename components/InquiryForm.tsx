"use client";
import { useFormState, useFormStatus } from "react-dom";
import { submitInquiry, type FormState } from "@/lib/actions";
function Btn() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "보내는 중…" : "문의 보내기"}</button>; }
export default function InquiryForm({ defaultName }: { defaultName: string }) {
  const [st, action] = useFormState<FormState, FormData>(submitInquiry, undefined);
  if (st?.ok) return <div className="card"><b>접수 완료</b><div className="muted">{st.ok}</div></div>;
  return (
    <form action={action} className="form">
      <select name="kind" defaultValue="" required><option value="" disabled>문의 종류</option><option value="ad">광고 · 파워광고 문의</option><option value="partner">협업 · 제휴 제안</option><option value="bug">오류 · 불편 신고</option><option value="other">기타</option></select>
      <div className="row"><input name="name" defaultValue={defaultName} maxLength={30} placeholder="이름 또는 업체명" required /><input name="contact" maxLength={80} placeholder="답변 받을 이메일 또는 전화" required /></div>
      <textarea name="body" maxLength={2000} placeholder="내용을 적어주세요" required />
      <div className="row"><Btn />{st?.error && <span className="error">{st.error}</span>}</div>
    </form>
  );
}
