"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ChatRoom, { type Msg } from "./ChatRoom";
import type { Session } from "@/lib/auth";
import { display } from "@/lib/depts";

export default function ChatDock({ me, initial, online, myRank, official }: { me: Session; initial: Msg[]; online: React.ReactNode; myRank?: string; official?: Record<string, string> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [last, setLast] = useState<Msg | null>(initial[initial.length - 1] ?? null);
  // 기본은 항상 열림(게임 화면만 접힘). 사용자가 접었다 폈으면 그 선택을 기억.
  useEffect(() => { let v: string | null = null; try { v = localStorage.getItem("mw-chat-open"); } catch {} setOpen(v != null ? v === "1" : !path.startsWith("/games")); }, [path]);
  const toggle = () => { setOpen(o => { try { localStorage.setItem("mw-chat-open", o ? "0" : "1"); } catch {} ; return !o; }); setUnread(0); };
  return (
    <div className={"dock" + (open ? " open" : "")}>
      <button type="button" className="dock-bar" onClick={toggle} aria-expanded={open}>
        <span className="dock-handle" aria-hidden="true" />
        <span className="dock-row">
          <span className="dock-title">💬 실시간 채팅 {online}</span>
          {!open && unread > 0 && <span className="dock-unread">{unread}</span>}
          <span className="dock-caret">{open ? "접기 ▾" : "펼치기 ▴"}</span>
        </span>
        {!open && last && <span className="dock-last"><b>{display(last.dept, last.nickname)}</b> {last.text}</span>}
      </button>
      <div className="dock-body" hidden={!open}>
        <ChatRoom me={me} initial={initial} myRank={myRank} official={official} onNew={m => { setLast(m); if (!open && m.user_id !== me.id) setUnread(n => n + 1); }} />
      </div>
    </div>
  );
}
