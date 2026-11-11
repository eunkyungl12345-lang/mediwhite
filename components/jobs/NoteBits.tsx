"use client";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveNote, adminDeleteNote, saveOpsNote } from "@/lib/handover.actions";
function Btn({ t }: { t: string }) { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "저장 중…" : t}</button>; }
/** 칸마다 '내 인계 남기기' — 1인 1칸 1노트, 비우고 저장하면 삭제 */
export function NoteForm({ hid, sec, ph, mine }: { hid: number; sec: string; ph: string; mine?: { text: string; status?: string } | null }) {
  const [open, setOpen] = useState(false), [st, act] = useFormState(saveNote, undefined), [txt, setTxt] = useState(mine?.text ?? "");
  useEffect(() => { if (st?.ok) setOpen(false); }, [st]);
  if (!open) return <button type="button" className="hn-add" onClick={() => setOpen(true)}>{mine ? "✏️ 내 인계 고치기" : "＋ 내 인계 남기기"}</button>;
  return <form action={act} className="hn-form"><input type="hidden" name="hid" value={hid} /><input type="hidden" name="sec" value={sec} />
    <textarea name="text" rows={3} maxLength={300} value={txt} onChange={e => setTxt(e.target.value)} placeholder={ph} autoFocus />
    <div className="hn-row"><select name="status" defaultValue={mine?.status ?? "재직"}><option value="재직">지금 다녀요</option><option value="퇴사">다녔어요</option></select><small className="muted">{txt.length}/300{mine ? " · 비우고 저장하면 지워져요" : ""}</small>
      <button type="button" className="btn ghost" onClick={() => setOpen(false)}>닫기</button><Btn t="저장" /></div>
    {st?.error && <div className="error">{st.error}</div>}</form>;
}
export function NoteDel({ hid, sec, k }: { hid: number; sec: string; k: string }) {
  const [gone, setGone] = useState(false); if (gone) return <small className="muted">삭제됨</small>;
  return <button type="button" className="link" style={{ color: "var(--muted)", fontSize: 12.5 }} onClick={async () => { if (!confirm("이 노트를 지울까요?")) return; const r = await adminDeleteNote(hid, sec, k); if (r?.ok) setGone(true); else alert(r?.error); }}>🗑 삭제(관리자)</button>;
}
export function OpsForm({ text }: { text: string }) {
  const [st, act] = useFormState(saveOpsNote, undefined);
  return <form action={act} className="hn-form"><textarea name="text" rows={5} maxLength={2000} defaultValue={text} placeholder={"이번 주 운영팀 인계\n- 새 기능: …\n- 부탁드려요: …"} /><div className="hn-row"><small className="muted">{st?.ok ? "저장됐어요" : st?.error ?? "관리자만 보여요"}</small><Btn t="운영팀 인계 저장" /></div></form>;
}
