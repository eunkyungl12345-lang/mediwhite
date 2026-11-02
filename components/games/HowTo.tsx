"use client";
import { useEffect, useState } from "react";
/** 게임 첫 30초 설명 — 그림 3장. 한 번 닫으면 다시 안 보여요(? 버튼으로 다시 열기) */
export type Step = { icon: string; title: string; desc: string };
export default function HowTo({ id, steps, title = "이렇게 해요" }: { id: string; steps: Step[]; title?: string }) {
  const [open, setOpen] = useState(false); const [ready, setReady] = useState(false);
  useEffect(() => { try { setOpen(localStorage.getItem("mw-howto-" + id) !== "1"); } catch { setOpen(true); } setReady(true); }, [id]);
  const close = () => { setOpen(false); try { localStorage.setItem("mw-howto-" + id, "1"); } catch {} };
  if (!ready) return null;
  if (!open) return <button type="button" className="howto-q" onClick={() => setOpen(true)} aria-label="조작법 보기">? 조작법</button>;
  return <div className="howto">
    <div className="howto-t"><b>{title}</b><span className="muted">30초면 충분해요</span></div>
    <div className="howto-steps">{steps.map((s, i) => <div key={i} className="howto-s"><span className="howto-n">{i + 1}</span><span className="howto-i">{s.icon}</span><b>{s.title}</b><small>{s.desc}</small></div>)}</div>
    <button type="button" className="btn" onClick={close}>알겠어요 👍</button>
  </div>;
}
