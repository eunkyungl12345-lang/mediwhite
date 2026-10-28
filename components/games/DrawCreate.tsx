"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createDraw } from "@/lib/draw";
function Btn() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "…" : "방 만들기"}</button>; }
export default function DrawCreate() {
  const [st, act] = useFormState(createDraw, undefined);
  return <form action={act} className="ss-form"><input name="title" maxLength={30} placeholder="방 제목 (예: 점심시간 그림 한 판)" />{st?.error && <div className="error">{st.error}</div>}<Btn /></form>;
}
