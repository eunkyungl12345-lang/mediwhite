"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function Tabs({ admin }: { admin: boolean }) {
  const p = usePathname();
  const TABS: [string, string][] = [["/board", "게시판"], ["/games", "게임"], ["/rank", "내 계급"], ...(admin ? [["/admin", "관리"] as [string, string]] : [])];
  // 문의는 탭이 아니라 공지 글과 로그인 화면에서 연결
  return <nav className="tabs">{TABS.map(([href, label]) => <Link key={href} href={href} aria-current={p.startsWith(href) ? "page" : undefined}>{label}</Link>)}</nav>;
}
