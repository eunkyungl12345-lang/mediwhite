"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const I = {
  home: <svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" /></svg>,
  board: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>,
  ssum: <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>,
  games: <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="11" rx="5" /><path d="M8 11v3M6.5 12.5h3M15 11.5h.01M17.5 13.5h.01" /></svg>,
  me: <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>,
};
/** 모바일 하단 네비 (라인 아이콘) — 데스크톱에선 상단 탭 사용 */
export default function BottomNav() {
  const p = usePathname();
  const is = (h: string) => p === h || p.startsWith(h + "/") || p.startsWith(h + "?");
  const boardOn = ["/board", "/anon", "/jobs", "/hospitals", "/food", "/news", "/guide"].some(is);
  const items: [string, string, keyof typeof I, boolean][] = [["/home", "홈", "home", is("/home")], ["/board", "게시판", "board", boardOn], ["/ssum", "썸", "ssum", is("/ssum")], ["/games", "게임", "games", is("/games")], ["/rank", "MY", "me", is("/rank") || is("/u") || is("/noti")]];
  return <nav className="bnav" aria-label="메인">
    {items.map(([href, label, k, on]) => <Link key={href} href={href} className={"bnav-i" + (on ? " on" : "")} aria-current={on ? "page" : undefined}><i>{I[k]}</i><span>{label}</span></Link>)}
  </nav>;
}
