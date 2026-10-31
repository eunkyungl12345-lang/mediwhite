"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
/** 게시판 상단 🔍 — 누르면 검색창 펼침 (모바일용; 데스크톱은 하단 바에도 있음) */
export default function BoardSearch({ cat, q }: { cat: string; q: string }) {
  const [o, setO] = useState(false), [v, setV] = useState(q), r = useRouter();
  return <>
    <button type="button" className="cf-sbtn" aria-label="검색" aria-pressed={o} onClick={() => setO(!o)}>🔍</button>
    {o && <form className="cf-search inline" onSubmit={e => { e.preventDefault(); r.push(`/board?${new URLSearchParams({ ...(cat !== "전체" ? { cat } : {}), ...(v.trim() ? { q: v.trim() } : {}) })}`); }}>
      <input autoFocus value={v} onChange={e => setV(e.target.value)} placeholder="제목·내용 검색" enterKeyHint="search" /><button className="btn">검색</button>
    </form>}
  </>;
}
