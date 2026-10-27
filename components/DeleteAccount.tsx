"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { deleteAccount, type FormState } from "@/lib/actions";
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [st, action] = useFormState<FormState, FormData>(deleteAccount, undefined);
  return (
    <div className="card" style={{ borderStyle: "dashed" }}>
      <div className="bar"><span className="muted">소속을 바꾸려면 탈퇴 후 다시 가입해야 해요. 경험치·계급·게임 기록은 사라지고, 쓴 글은 익명으로 남아요.</span><button className="link" type="button" onClick={() => setOpen(o => !o)}>회원탈퇴</button></div>
      {open && (
        <form action={action} className="row">
          <input name="confirm" placeholder="확인을 위해 '탈퇴' 입력" autoComplete="off" />
          <button className="btn" style={{ background: "var(--signal)" }}>탈퇴하기</button>
          {st?.error && <div className="error" style={{ width: "100%" }}>{st.error}</div>}
        </form>
      )}
    </div>
  );
}
