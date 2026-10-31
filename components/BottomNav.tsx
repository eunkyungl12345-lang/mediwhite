"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
/** 모바일 하단 네비 (앱처럼) — 데스크톱에선 상단 탭 사용 */
export default function BottomNav() {
  const p = usePathname();
  const is = (h: string) => p === h || p.startsWith(h + "/") || p.startsWith(h + "?");
  const on = (h: string) => (is(h) ? " on" : "");
  const boardOn = ["/board", "/anon", "/jobs", "/hospitals", "/food", "/news", "/guide"].some(is) && !is("/board/new");
  return <nav className="bnav" aria-label="메인">
    <Link href="/home" className={"bnav-i" + on("/home")}><i>🏠</i><span>홈</span></Link>
    <Link href="/board" className={"bnav-i" + (boardOn ? " on" : "")}><i>📋</i><span>게시판</span></Link>
    <Link href="/board/new" className="bnav-w" aria-label="글쓰기"><b>✏️</b></Link>
    <Link href="/ssum" className={"bnav-i" + on("/ssum")}><i>💘</i><span>썸</span></Link>
    <Link href="/games" className={"bnav-i" + on("/games")}><i>🎮</i><span>게임</span></Link>
  </nav>;
}
