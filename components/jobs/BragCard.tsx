"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleBragLike, deleteBrag } from "@/lib/bragActions";
import type { Brag } from "@/lib/brag";
/** 🏆 자랑 카드 — 사진 넘겨보기 + 부러워요 ❤️ */
export default function BragCard({ b, me, admin, rank, showHosp = true }: { b: Brag; me: string; admin?: boolean; rank?: number; showHosp?: boolean }) {
  const [liked, setLiked] = useState(b.liked), [n, setN] = useState(b.likes), [i, setI] = useState(0), [, start] = useTransition(); const mine = b.owner === me;
  return <div className="bg-card">
    <div className="bg-ph" onClick={() => b.urls.length > 1 && setI((i + 1) % b.urls.length)}>
      {b.urls[i] ? <img src={b.urls[i]} alt={`${b.hospital} 사진`} loading="lazy" /> : <div className="bg-noph">🏥</div>}
      {rank && rank <= 3 ? <span className="bg-rank">{["🥇", "🥈", "🥉"][rank - 1]}</span> : null}
      {b.urls.length > 1 && <span className="bg-dots">{b.urls.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</span>}
    </div>
    <div className="bg-b">
      {showHosp && <Link href={`/hospitals/${b.hid}`} className="bg-h"><b>{b.hospital}</b><small>{b.region}</small></Link>}
      <div className="bg-tags">{b.tags.map(t => <span key={t}>{t}</span>)}</div>
      <p>{b.text}</p>
      <div className="bg-f"><small>{b.verified ? "✅ " : ""}{b.dept ? `${b.dept} 재직자` : "재직자"} 자랑{b.verified ? " · 재직 인증" : ""}</small>
        {mine || admin ? <span className="row" style={{ gap: 8 }}>{mine && <Link href={`/hospitals/brag/new?id=${b.hid}`} className="link">수정</Link>}<button type="button" className="link" onClick={() => confirm("자랑을 지울까요?") && start(() => deleteBrag(b.owner, b.hid))}>삭제</button>{mine && <span className="bg-like on">❤️ {n}</span>}</span>
          : <button type="button" className={"bg-like" + (liked ? " on" : "")} onClick={() => { setLiked(!liked); setN(n + (liked ? -1 : 1)); start(() => toggleBragLike(b.owner, b.hid)); }}>{liked ? "❤️" : "🤍"} 부러워요 {n}</button>}
      </div>
    </div>
  </div>;
}
