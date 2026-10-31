"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { notiUnread } from "@/lib/noti.actions";
/** 🔔 알림센터 버튼 — 안 읽은 수 배지, 60초마다 갱신 */
export default function Bell({ initial }: { initial: number }) {
  const [n, setN] = useState(initial); const path = usePathname();
  useEffect(() => { setN(initial); }, [initial]);
  useEffect(() => { if (path === "/noti") setN(0); const t = setInterval(() => { if (document.visibilityState === "visible") notiUnread().then(setN).catch(() => {}); }, 60000); return () => clearInterval(t); }, [path]);
  return <Link href="/noti" className={"bell" + (n > 0 ? " on" : "")} aria-label={`알림 ${n}개`} title="알림">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
    {n > 0 && <span className="bell-n">{n > 99 ? "99+" : n}</span>}
  </Link>;
}
