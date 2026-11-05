"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MENU_GROUPS } from "@/lib/menu";
/** 💻 PC 왼쪽 사이드바 — 모바일 ☰ 메뉴와 같은 카테고리 구조. 지금 있는 곳의 묶음은 펼쳐두고, 나머지는 눌러서 펼쳐요 */
export default function SideNav({ admin, unread, fresh = [] }: { admin: boolean; unread: number; fresh?: string[] }) {
  const p = usePathname(), sp = useSearchParams(), full = p + (sp?.toString() ? "?" + sp.toString() : "");
  const all = MENU_GROUPS.flatMap(g => g.items.flatMap(it => [it.href, ...(it.sub ?? []).map(x => x.href)])), exact = all.includes(full);
  const F = new Set(fresh), match = (h: string) => h.includes("?") ? full === h : exact ? full === h : p === h || new RegExp(`^${h}/\\d+$`).test(p);
  const cur = MENU_GROUPS.findIndex(g => g.items.some(it => match(it.href) || it.sub?.some(x => match(x.href))));
  const [open, setOpen] = useState<Set<number>>(() => new Set(cur >= 0 ? [cur, 0, 1] : [0, 1]));
  const tog = (i: number) => setOpen(o => { const n = new Set(o); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const New = ({ k }: { k?: string }) => k && F.has(k) ? <em className="side-new">N</em> : null;
  return <aside className="side">
    <div className="side-head"><Link href="/home" className="side-logo">메디화이트웹</Link>
    <nav className="side-top"><Link href="/home" className={p === "/home" ? "on" : ""}>🏠 홈</Link><Link href="/noti" className={p === "/noti" ? "on" : ""}>🔔 알림{unread > 0 && <b className="side-n">{unread > 99 ? "99+" : unread}</b>}</Link></nav>
    <Link href="/board/new" className="side-write"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>글쓰기</Link></div>
    {MENU_GROUPS.map((g, i) => <section key={g.title} className={"side-g" + (open.has(i) ? " open" : "")}>
      <button type="button" className="side-gh" onClick={() => tog(i)} aria-expanded={open.has(i)}><span>{g.icon}</span>{g.title}{!open.has(i) && g.items.some(it => it.k && F.has(it.k)) && <em className="side-dot" />}<i>⌄</i></button>
      {open.has(i) && <div className="side-gl">{g.items.map(it => <div key={it.href}>
        <Link href={it.href} className={match(it.href) ? "on" : ""}>{it.name}<New k={it.k} /></Link>
        {it.sub && (match(it.href) || it.sub.some(x => match(x.href))) && <div className="side-sub">{it.sub.map(x => <Link key={x.href} href={x.href} className={match(x.href) ? "on" : ""}>{x.name}<New k={x.k} /></Link>)}</div>}
      </div>)}{g.title === "MY" && admin && <Link href="/admin" className={p.startsWith("/admin") ? "on" : ""}>🛠️ 관리자</Link>}</div>}
    </section>)}
    <nav className="side-foot"><Link href="/board?cat=%EA%B3%B5%EC%A7%80">📢 알리는 말씀</Link><Link href="/about">ℹ️ 소개</Link><Link href="/contact">✉️ 문의·제안</Link></nav>
  </aside>;
}
