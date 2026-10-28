"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ChatRoom, { type Msg } from "./ChatRoom";
import type { Session } from "@/lib/auth";
import { display } from "@/lib/depts";
import { roomsFor } from "@/lib/chatRooms";

export default function ChatDock({ me, initial, online, myRank, official, roomsOn = false }: { me: Session; initial: Msg[]; online: React.ReactNode; myRank?: string; official?: Record<string, string>; roomsOn?: boolean }) {
  const [room, setRoom] = useState("all");
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [last, setLast] = useState<Msg | null>(initial[initial.length - 1] ?? null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y0: number; t0: number; dy: number; h: number; moved: boolean } | null>(null);
  const [bodyH, setBodyH] = useState(0);

  useEffect(() => { let v: string | null = null; try { v = localStorage.getItem("mw-chat-open"); } catch {} setOpen(path.startsWith("/games") ? false : v === "1"); }, [path]);
  useEffect(() => {
    const el = bodyRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setBodyH(el.offsetHeight)); ro.observe(el); setBodyH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  const setOpenPersist = (v: boolean) => { setOpen(v); try { localStorage.setItem("mw-chat-open", v ? "1" : "0"); } catch {} if (v) setUnread(0); };

  // 손가락 따라오는 스와이프: 바를 잡고 위/아래로 끌면 그만큼 열리고, 놓을 때 속도/거리로 판정
  const onDown = (e: React.PointerEvent) => {
    drag.current = { y0: e.clientY, t0: performance.now(), dy: 0, h: dockRef.current?.offsetHeight ?? bodyH, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dockRef.current?.classList.add("dragging");
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !dockRef.current) return;
    d.dy = e.clientY - d.y0; if (Math.abs(d.dy) > 6) d.moved = true;
    const base = open ? 0 : d.h; // 현재 translateY
    let y = base + d.dy;
    if (y < 0) y = -Math.pow(-y, 0.6) * 1.2; // 끝에서 고무줄
    if (y > d.h) y = d.h + Math.pow(y - d.h, 0.6);
    dockRef.current.style.transform = `translateY(${y}px)`;
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d || !dockRef.current) return;
    dockRef.current.classList.remove("dragging");
    const settle = (o: boolean) => { if (dockRef.current) dockRef.current.style.transform = o ? "translateY(0px)" : `translateY(calc(100% + 20px))`; };
    if (!d.moved) { settle(!open); setOpenPersist(!open); return; } // 탭 = 토글
    const v = d.dy / Math.max(1, performance.now() - d.t0); // px/ms
    const base = open ? 0 : d.h; const y = base + d.dy;
    const next = Math.abs(v) > 0.5 ? v < 0 : y < d.h / 2;
    settle(next); // React가 같은 값이라 다시 안 써줄 수 있으니 직접 복귀
    if (next !== open) setOpenPersist(next); else if ("vibrate" in navigator) try { navigator.vibrate(5); } catch {}
  };

  return (
    <>
      {!open && (
        <button type="button" className="chat-fab" onClick={() => setOpenPersist(true)} aria-label="실시간 채팅 열기">
          <span className="chat-fab-ico">💬</span>
          <span>채팅</span>
          {unread > 0 && <span className="dock-unread chat-fab-badge">{unread}</span>}
        </button>
      )}
      <div ref={dockRef} className={"dock" + (open ? " open" : "")} style={{ transform: open ? "translateY(0px)" : `translateY(calc(100% + 20px))` }} aria-hidden={!open}>
        <div className="dock-bar" role="button" tabIndex={0} aria-expanded={open}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenPersist(!open); } }}>
          <span className="dock-handle" aria-hidden="true" />
          <span className="dock-row">
            <span className="dock-title">💬 실시간 채팅 {online}</span>
            <span className="dock-caret">접기 ▾</span>
          </span>
        </div>
        {roomsOn && <div className="dock-rooms">{roomsFor(me.dept).map(r => <button key={r.key} type="button" className={room === r.key ? "on" : ""} onClick={() => setRoom(r.key)}>{r.icon} {r.name}</button>)}</div>}
        <div className="dock-body" ref={bodyRef}>
          <ChatRoom me={me} initial={initial} myRank={myRank} official={official} room={room} onNew={m => { setLast(m); if (!open && m.user_id !== me.id) setUnread(n => n + 1); }} />
        </div>
      </div>
    </>
  );
}
