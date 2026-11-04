"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
/** 상단 ☰ 메뉴 — 내 계급·관리·도움말·나가기 (모바일 깔끔 헤더용) */
export default function HeaderMenu({ admin, logout, name }: { admin: boolean; logout: () => Promise<void>; name: React.ReactNode }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("pointerdown", f); return () => document.removeEventListener("pointerdown", f); }, [open]);
  return <div className="hmenu" ref={ref}>
    <button type="button" className="ico-btn" aria-label="메뉴" aria-expanded={open} onClick={() => setOpen(o => !o)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
    {open && <div className="hmenu-pop" role="menu">
      <div className="hmenu-me">{name}</div>
      <Link href="/games" role="menuitem" onClick={() => setOpen(false)}>🎮 게임</Link>
      <Link href="/ssum" role="menuitem" onClick={() => setOpen(false)}>💘 썸</Link>
      <Link href="/rest" role="menuitem" onClick={() => setOpen(false)}>🛋️ 당직실</Link>
      <Link href="/rank" role="menuitem" onClick={() => setOpen(false)}>🎖️ 내 계급 · 프로필</Link>
      <Link href="/noti" role="menuitem" onClick={() => setOpen(false)}>🔔 알림</Link>
      <Link href="/badge" role="menuitem" onClick={() => setOpen(false)}>🥇 골드뱃지 인증</Link>
      {admin && <Link href="/admin" role="menuitem" onClick={() => setOpen(false)}>🛠️ 관리자</Link>}
      <button type="button" role="menuitem" onClick={() => { setOpen(false); window.dispatchEvent(new Event("mw-tour")); }}>❓ 사용법</button>
      <Link href="/about" role="menuitem" onClick={() => setOpen(false)}>ℹ️ 메디화이트웹 소개</Link>
      <form action={logout}><button type="submit" role="menuitem" className="hmenu-out">나가기</button></form>
    </div>}
  </div>;
}
