"use client";
import { useFormState } from "react-dom";
import { adminResetPassword, type FormState } from "@/lib/actions";
export default function AdminResetPw({ userId }: { userId: string }) {
  const [st, action] = useFormState<FormState, FormData>(adminResetPassword, undefined);
  return (
    <form action={action} className="row" style={{ alignItems: "center" }}>
      <input type="hidden" name="user_id" value={userId} />
      <input name="next" type="text" placeholder="새 비번" style={{ width: 110, padding: "4px 8px", fontSize: 13 }} />
      <button className="link">비번 초기화</button>{st?.ok && <span className="muted">{st.ok}</span>}{st?.error && <span className="error">{st.error}</span>}
    </form>
  );
}
