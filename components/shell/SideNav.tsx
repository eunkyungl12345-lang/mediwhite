"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
/** 💻 PC 왼쪽 사이드바 (1080px 이상에서만 보여요) */
const I: Record<string, JSX.Element> = {
  home: <svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" /></svg>,
  board: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>,
  ssum: <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>,
  games: <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="11" rx="5" /><path d="M8 11v3M6.5 12.5h3M15 11.5h.01M17.5 13.5h.01" /></svg>,
  rest: <svg viewBox="0 0 24 24"><path d="M4 13v5M20 13v5M4 15h16M6 13V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /></svg>,
  bell: <svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>,
  me: <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>,
};
export default function SideNav({ admin, unread }: { admin: boolean; unread: number }) {
  const p = usePathname(); const is = (h: string) => p === h || p.startsWith(h + "/");
  const main: [string, string, string, boolean][] = [["/home", "홈", "home", is("/home")], ["/board", "게시판", "board", ["/board", "/anon", "/jobs", "/hospitals", "/food", "/news", "/guide"].some(is)], ["/ssum", "썸", "ssum", is("/ssum")], ["/games", "게임", "games", is("/games")], ["/rest", "당직실", "rest", is("/rest")], ["/noti", "알림", "bell", is("/noti")], ["/rank", "MY · 내 계급", "me", is("/rank") || is("/u")]];
  const quick: [string, string][] = [["/board?cat=%EA%B3%B5%EC%A7%80", "📢 공지사항"], ["/anon", "🕶️ 익명 게시판"], ["/jobs", "💼 채용공고"], ["/hospitals", "🏥 병원 리뷰"], ["/food", "🍽️ 맛집"], ["/news", "📰 오늘의 뉴스"], ["/badge", "🥇 골드뱃지 인증"], ...(admin ? [["/admin", "🛠️ 관리자"] as [string, string]] : [])];
  return <aside className="side">
    <Link href="/home" className="side-logo">메디화이트웹</Link>
    <nav className="side-nav">{main.map(([h, n, k, on]) => <Link key={h} href={h} className={on ? "on" : ""}><i>{I[k]}</i><span>{n}</span>{k === "bell" && unread > 0 && <b className="side-n">{unread > 99 ? "99+" : unread}</b>}</Link>)}</nav>
    <Link href="/board/new" className="side-write"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>글쓰기</Link>
    <div className="side-sec">바로가기</div>
    <nav className="side-quick">{quick.map(([h, n]) => <Link key={h} href={h}>{n}</Link>)}</nav>
  </aside>;
}
