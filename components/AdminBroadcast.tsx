"use client";
import { useFormState } from "react-dom";
import { adminBroadcast, type FormState } from "@/lib/actions";
export default function AdminBroadcast() {
  const [st, action] = useFormState<FormState, FormData>(adminBroadcast, undefined);
  return (
    <form action={action} className="form">
      <div className="row"><input name="title" maxLength={40} placeholder="제목 (예: 오늘 저녁 파트 대항전!)" /><input name="url" maxLength={200} placeholder="열릴 주소 (기본 /board)" /></div>
      <input name="body" maxLength={140} placeholder="내용 (140자)" required />
      <div className="row"><button className="btn">알림 보내기</button>{st?.ok && <span className="muted">{st.ok}</span>}{st?.error && <span className="error">{st.error}</span>}</div>
    </form>
  );
}
