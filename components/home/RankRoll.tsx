"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
/** 🩺 요즘 많이 찾는 병원 — 3초마다 한 칸씩 (중간에 두 줄이 겹쳐 보이지 않게) */
export default function RankRoll({ items }: { items: { id: number; name: string }[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (items.length < 2) return; const t = setInterval(() => setI(x => (x + 1) % items.length), 3000); return () => clearInterval(t); }, [items.length]);
  const h = items[i]; if (!h) return null;
  return <div className="ht-roll"><Link key={h.id} href={`/hospitals/${h.id}`} className="ht-roll-i"><b>{i + 1}</b>{h.name}</Link></div>;
}
