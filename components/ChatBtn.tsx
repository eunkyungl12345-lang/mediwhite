"use client";
import { useEffect, useState } from "react";
/** 📱 상단 채팅 아이콘 (휴대폰) — 누르면 아래 채팅창이 열려요 */
export default function ChatBtn() {
  const [n, setN] = useState(0);
  useEffect(() => { const f = (e: Event) => setN((e as CustomEvent).detail ?? 0); window.addEventListener("mw-chat-unread", f); return () => window.removeEventListener("mw-chat-unread", f); }, []);
  return <button type="button" className="ico-btn hd-chat" aria-label="실시간 채팅" onClick={() => window.dispatchEvent(new Event("mw-chat"))}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /></svg>{n > 0 && <i className="hd-dot">{n > 9 ? "9+" : n}</i>}</button>;
}
