"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const TABS = [["/chat", "채팅"], ["/board", "게시판"], ["/games", "게임"], ["/rank", "계급"]] as const;
export default function Tabs() {
  const p = usePathname();
  return <nav className="tabs">{TABS.map(([href, label]) => <Link key={href} href={href} aria-current={p.startsWith(href) ? "page" : undefined}>{label}</Link>)}</nav>;
}
