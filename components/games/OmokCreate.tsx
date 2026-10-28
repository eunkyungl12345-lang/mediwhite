"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createOmok } from "@/lib/omok";
function Btn() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "…" : "방 만들기"}</button>; }
export default function OmokCreate() {
  const [st, act] = useFormState(createOmok, undefined);
  return (
    <form action={act} className="ss-form">
      <input name="title" maxLength={30} placeholder="방 제목 (예: 점심 내기 한 판)" />
      <input name="bet" maxLength={40} placeholder="내기 (선택, 예: 진 팀이 커피 쏘기 ☕)" />
      <div className="om-mode">{[1, 2, 3, 4, 5].map(n => <label key={n}><input type="radio" name="per_team" value={n} defaultChecked={n === 1} /><span>{n === 1 ? "1:1" : `${n}:${n} 팀전`}</span></label>)}</div>
      {st?.error && <div className="error">{st.error}</div>}
      <Btn />
    </form>
  );
}
