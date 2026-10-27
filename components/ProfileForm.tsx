"use client";
import { useFormState, useFormStatus } from "react-dom";
import { updateProfile, type FormState } from "@/lib/actions";
function Btn() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>저장</button>; }
export default function ProfileForm({ nickname, bio, dept }: { nickname: string; bio: string; dept: string }) {
  const [st, action] = useFormState<FormState, FormData>(updateProfile, undefined);
  return (
    <form action={action} className="form">
      <div className="row"><span className="cats-btn" aria-pressed="true" style={{ cursor: "default" }}>[{dept}]</span><input name="nickname" defaultValue={nickname} maxLength={12} placeholder="닉네임" required /></div>
      <input name="bio" defaultValue={bio} maxLength={80} placeholder="한줄소개 (프로필에 보여요, 처음 쓰면 +50 XP)" />
      <div className="row"><Btn />{st?.error && <span className="error">{st.error}</span>}{st?.ok && <span className="muted">{st.ok}</span>}</div>
    </form>
  );
}
