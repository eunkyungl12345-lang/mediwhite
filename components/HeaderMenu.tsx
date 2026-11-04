"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TOPICS } from "@/lib/depts";
type Item = { href: string; name: string; k?: string; sub?: { href: string; name: string; k?: string }[] };
/** ☰ 전체 메뉴 — 카테고리별 카드(필커식). 최근 24시간 새 소식이 있으면 NEW */
const GROUPS: { icon: string; title: string; items: Item[] }[] = [
  { icon: "🏥", title: "병원 리뷰", items: [{ href: "/hospitals", name: "병원 리뷰", k: "rev" }, { href: "/hospitals?tab=rank", name: "병원 순위" }, { href: "/hospitals/check", name: "리뷰 쓰기 (실체 체크)" }, { href: "/salary", name: "급여 비교" }, { href: "/hospitals/brag", name: "우리 병원 자랑대회", k: "brag" }] },
  { icon: "💼", title: "채용", items: [{ href: "/jobs", name: "전체 공고", k: "jobs" }, { href: "/jobs/day", name: "3교대 탈출 (상근·로컬)" }, { href: "/jobs?soon=1", name: "마감 임박" }, { href: "/jobs/new", name: "공고 올리기" }] },
  { icon: "💬", title: "커뮤니티", items: [{ href: "/board", name: "게시판", k: "board", sub: TOPICS.filter(t => !["data", "req", "study"].includes(t.key)).map(t => ({ href: `/board?topic=${t.key}`, name: `${t.icon} ${t.name}`, k: "t:" + t.key })) }, { href: "/anon", name: "익명 게시판", k: "anon" }, { href: "/handover", name: "인수인계", k: "note" }] },
  { icon: "📚", title: "공부방·자료실", items: [{ href: "/study", name: "공부방 홈" }, { href: "/board?topic=data", name: "자료실", k: "t:data" }, { href: "/board?topic=req", name: "자료 요청", k: "t:req" }, { href: "/study/terms", name: "의료 약어 사전" }, { href: "/study/interview", name: "면접 질문 모음" }, { href: "/board?topic=study", name: "공부·시험", k: "t:study" }] },
  { icon: "🛋️", title: "쉬는 곳", items: [{ href: "/rest", name: "당직실" }, { href: "/ssum", name: "썸", k: "ssum" }, { href: "/fortune", name: "오늘의 운세" }, { href: "/news", name: "의료 뉴스" }] },
  { icon: "👤", title: "MY", items: [{ href: "/my", name: "내 정보·열람권" }, { href: "/rank", name: "내 계급·프로필" }, { href: "/noti", name: "알림" }, { href: "/badge", name: "골드뱃지 인증" }] },
];
export default function HeaderMenu({ admin, logout, name, fresh = [] }: { admin: boolean; logout: () => Promise<void>; name: React.ReactNode; fresh?: string[] }) {
  const [open, setOpen] = useState(false), [exp, setExp] = useState<string | null>(null), p = usePathname();
  useEffect(() => { setOpen(false); }, [p]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const F = new Set(fresh), New = ({ k }: { k?: string }) => k && F.has(k) ? <em className="dm-new">NEW</em> : null;
  return <div className="hmenu">
    <button type="button" className="ico-btn" aria-label="전체 메뉴" aria-expanded={open} onClick={() => setOpen(true)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
    {open && <div className="dm-bg" onClick={() => setOpen(false)}><aside className="dm" role="dialog" aria-label="전체 메뉴" onClick={e => e.stopPropagation()}>
      <div className="dm-top"><div className="dm-me">{name}</div><button type="button" className="dm-x" aria-label="닫기" onClick={() => setOpen(false)}>✕</button></div>
      {GROUPS.map(g => <section key={g.title} className="dm-card"><h3><span>{g.icon}</span>{g.title}</h3>
        {g.items.map(it => it.sub ? <div key={it.href}><button type="button" className={"dm-row" + (exp === it.href ? " open" : "")} onClick={() => setExp(exp === it.href ? null : it.href)}>{it.name}<New k={it.k} /><i className="dm-chev">⌄</i></button>
          {exp === it.href && <div className="dm-sub"><Link href={it.href}>전체 글</Link>{it.sub.map(x => <Link key={x.href} href={x.href}>{x.name}<New k={x.k} /></Link>)}</div>}</div>
          : <Link key={it.href} href={it.href} className={"dm-row" + (p === it.href ? " on" : "")}>{it.name}<New k={it.k} /></Link>)}
        {g.title === "MY" && admin && <Link href="/admin" className="dm-row">🛠️ 관리자</Link>}
      </section>)}
      <div className="dm-foot">
        <Link href="/board?cat=공지">📢 알리는 말씀</Link>
        <button type="button" onClick={() => { setOpen(false); window.dispatchEvent(new Event("mw-tour")); }}>❓ 사용법</button>
        <Link href="/about">ℹ️ 메디화이트웹 소개</Link>
        <Link href="/contact">✉️ 문의·제안</Link>
        <form action={logout}><button type="submit" className="dm-out">나가기</button></form>
      </div>
    </aside></div>}
  </div>;
}
