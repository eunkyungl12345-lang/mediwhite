"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type NavItem = { href: string; name: string; icon: string; group: string };
const get = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const set = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/** 다음 카페식 상단 바 + ☰ 게시판 메뉴 (최근 방문 · 즐겨찾기 · 전체) */
export function CafeHeader({ title, here, items, me }: { title: string; here: string; items: NavItem[]; me: React.ReactNode }) {
  const [open, setOpen] = useState(false), [fav, setFav] = useState<string[]>([]), [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setFav(get("mw-fav") ?? []);
    const r = [here, ...((get("mw-recent") ?? []) as string[]).filter(h => h !== here)].slice(0, 4);
    set("mw-recent", r); setRecent(r);
  }, [here]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const toggle = (h: string) => { const f = fav.includes(h) ? fav.filter(x => x !== h) : [...fav, h]; setFav(f); set("mw-fav", f); };
  const by = (h: string) => items.find(i => i.href === h);
  const Row = ({ it }: { it: NavItem }) => (
    <div className={"cf-row" + (it.href === here ? " on" : "")}>
      <Link href={it.href} onClick={() => setOpen(false)}><span className="cf-ico">{it.icon}</span>{it.name}</Link>
      <button type="button" aria-label="즐겨찾기" className={"cf-star" + (fav.includes(it.href) ? " on" : "")} onClick={() => toggle(it.href)}>{fav.includes(it.href) ? "★" : "☆"}</button>
    </div>
  );
  const groups = Array.from(new Set(items.map(i => i.group)));
  const rec = recent.map(by).filter(Boolean) as NavItem[], fv = fav.map(by).filter(Boolean) as NavItem[];
  return (
    <>
      <div className="cf-head">
        <button type="button" className="cf-title" onClick={() => setOpen(true)}>{title} <span>▾</span></button>
        <button type="button" className="cf-menu" aria-label="게시판 메뉴" onClick={() => setOpen(true)}>☰</button>
      </div>
      {open && <div className="cf-dim" onClick={() => setOpen(false)} />}
      <aside className={"cf-drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="cf-dtop"><button type="button" onClick={() => setOpen(false)} aria-label="닫기">✕</button><Link href="/home" onClick={() => setOpen(false)}>⌂</Link></div>
        <div className="cf-me">{me}</div>
        {rec.length > 0 && <><div className="cf-sec">최근 방문</div>{rec.map(i => <Row key={"r" + i.href} it={i} />)}</>}
        <div className="cf-sec">즐겨찾기</div>
        {fv.length ? fv.map(i => <Row key={"f" + i.href} it={i} />) : <div className="cf-empty">☆를 눌러 자주 가는 게시판을 모아 두세요</div>}
        {groups.map(g => <div key={g}><div className="cf-sec">{g}</div>{items.filter(i => i.group === g).map(i => <Row key={i.href} it={i} />)}</div>)}
      </aside>
    </>
  );
}

/** 공지 접기 (기기에 기억) */
export function NoticeFold({ children, count }: { children: React.ReactNode; count: number }) {
  const [fold, setFold] = useState(false);
  useEffect(() => setFold(!!get("mw-nfold")), []);
  if (!count) return null;
  return (
    <div className="cf-notices">
      <button type="button" className="cf-fold" onClick={() => { setFold(!fold); set("mw-nfold", !fold); }}>{fold ? `공지 펼치기 (${count})` : "공지 접기"}</button>
      {!fold && children}
    </div>
  );
}

/** 하단 바: 맨 위 · 검색 · 글쓰기 · 새글보기 */
export function CafeBottom({ writeHref, newHref, cat, q, newCount = 0 }: { writeHref: string; newHref: string; cat: string; q: string; newCount?: number }) {
  const [s, setS] = useState(!!q), [v, setV] = useState(q), r = useRouter();
  return (
    <div className="cf-bottom">
      {s && <form className="cf-search" onSubmit={e => { e.preventDefault(); r.push(`/board?${new URLSearchParams({ ...(cat !== "전체" ? { cat } : {}), ...(v.trim() ? { q: v.trim() } : {}) })}`); }}>
        <input autoFocus value={v} onChange={e => setV(e.target.value)} placeholder="제목·내용 검색" enterKeyHint="search" /><button className="btn">검색</button>
      </form>}
      <div className="cf-bar v2">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><i>⬆️</i><span>맨 위</span></button>
        <button type="button" onClick={() => setS(!s)} aria-pressed={s}><i>🔍</i><span>검색</span></button>
        <Link href={writeHref} className="cf-write" aria-label="글쓰기"><b>✏️</b><span>글쓰기</span></Link>
        <Link href={newHref}><i>🆕</i><span>새 글</span>{newCount > 0 && <em className="cf-n">{newCount > 99 ? "99+" : newCount}</em>}</Link>
        <Link href="/games"><i>🎮</i><span>게임</span></Link>
      </div>
    </div>
  );
}

/** 말머리·정렬 드롭다운 (선택 시 쿼리 변경) */
export function QuerySelect({ label, value, options, hrefs }: { label: string; value: string; options: [string, string][]; hrefs: Record<string, string> }) {
  const r = useRouter();
  const cur = options.find(o => o[0] === value);
  return (
    <label className="cf-sel"><span>{value && cur ? cur[1] : label} ▾</span>
      <select value={value} aria-label={label} onChange={e => r.push(hrefs[e.target.value])}>{options.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
    </label>
  );
}
