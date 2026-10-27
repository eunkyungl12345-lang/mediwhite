"use client";
import { useEffect, useState } from "react";
import ChatRoom, { type Msg } from "./ChatRoom";
import type { Session } from "@/lib/auth";
import { display } from "@/lib/depts";

export default function ChatDock({ me, initial, online }: { me: Session; initial: Msg[]; online: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [unread, setUnread] = useState(0);
  const [last, setLast] = useState<Msg | null>(initial[initial.length - 1] ?? null);
  useEffect(() => { try { const v = localStorage.getItem("mw-chat-open"); if (v != null) setOpen(v === "1"); } catch {} }, []);
  const toggle = () => { setOpen(o => { try { localStorage.setItem("mw-chat-open", o ? "0" : "1"); } catch {} ; return !o; }); setUnread(0); };
  return (
    <div className={"dock" + (open ? " open" : "")}>
      <button type="button" className="dock-bar" onClick={toggle} aria-expanded={open}>
        <span className="dock-title">💬 실시간 채팅 {online}</span>
        {!open && last && <span className="dock-last">{display(last.dept, last.nickname)}: {last.text}</span>}
        {!open && unread > 0 && <span className="dock-unread">{unread}</span>}
        <span className="dock-caret">{open ? "▾" : "▴"}</span>
      </button>
      <div className="dock-body" hidden={!open}>
        <ChatRoom me={me} initial={initial} onNew={m => { setLast(m); if (!open && m.user_id !== me.id) setUnread(n => n + 1); }} />
      </div>
    </div>
  );
}
