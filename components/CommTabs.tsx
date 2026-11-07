"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
/** 💬 커뮤니티 탭 줄 — 게시판 · 익명 · 게임 · 당직실 · 썸 (하단 '커뮤니티' 안의 쉬는 공간들) */
const TABS: [string, string][] = [["/board", "💬 게시판"], ["/anon", "🕶️ 익명"], ["/study", "📚 공부방"], ["/handover", "📋 인수인계"], ["/rest", "🛋️ 당직실"]];
export default function CommTabs() {
  const p = usePathname();
  if (!TABS.some(([h]) => p === h) || p === "/rest") return null; // 당직실은 전체화면이라 제외 // 목록 화면에서만 (글 상세·작성 화면엔 안 보여요)
  return <nav className="ctabs" aria-label="커뮤니티">{TABS.map(([h, n]) => <Link key={h} href={h} className={p === h ? "on" : ""} aria-current={p === h ? "page" : undefined}>{n}</Link>)}</nav>;
}
