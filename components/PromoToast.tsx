"use client";
import { useEffect, useRef, useState } from "react";
import Insignia from "./Insignia";
import { tierOf } from "@/lib/ranks";
type Ev = { id: number; text: string; rank: number | null };
type Q = { id: number; title: string; xp: number; key: string };
/** 진급 알림: 우측 상단에 떴다가 6초 뒤 사라짐. 새 이벤트만(마지막으로 본 id 이후) */
export default function PromoToast() {
  const [toasts, setToasts] = useState<Ev[]>([]);
  const [quest, setQuest] = useState<Q | null>(null);
  const qQueue = useRef<Q[]>([]);
  const lastSeen = useRef<number | null>(null);
  const lastQ = useRef<number | null>(null);
  useEffect(() => {
    try { const v = localStorage.getItem("mw-ev-last"); if (v) lastSeen.current = Number(v); const q = localStorage.getItem("mw-q-last"); if (q) lastQ.current = Number(q); } catch {}
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/events", { cache: "no-store" }); if (!r.ok) return;
        const d = await r.json(); const evs: Ev[] = d.events ?? []; const qs: Q[] = d.quests ?? []; if (!alive) return;
        if (qs.length) { const maxQ = Math.max(...qs.map(q => q.id));
          if (lastQ.current == null) { lastQ.current = maxQ; try { localStorage.setItem("mw-q-last", String(maxQ)); } catch {} }
          else { const fresh = qs.filter(q => q.id > (lastQ.current as number)).reverse(); if (fresh.length) { lastQ.current = maxQ; try { localStorage.setItem("mw-q-last", String(maxQ)); } catch {} qQueue.current.push(...fresh); setQuest(q => q ?? qQueue.current.shift() ?? null); } } }
        if (!evs.length) return;
        const maxId = Math.max(...evs.map(e => e.id));
        if (lastSeen.current == null) { lastSeen.current = maxId; try { localStorage.setItem("mw-ev-last", String(maxId)); } catch {} return; }
        const fresh = evs.filter(e => e.id > (lastSeen.current as number)).reverse();
        if (fresh.length) { lastSeen.current = maxId; try { localStorage.setItem("mw-ev-last", String(maxId)); } catch {}
          setToasts(t => [...t, ...fresh]); fresh.forEach(e => setTimeout(() => setToasts(t => t.filter(x => x.id !== e.id)), 6500)); }
      } catch {}
    };
    load(); const t = setInterval(load, 6000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  const closeQuest = () => setQuest(qQueue.current.shift() ?? null);
  return <>
    {quest && <div className="qpop" onClick={closeQuest}><div className="qcard" onClick={e => e.stopPropagation()}>
      <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i % 6) * .12}s`, background: ["#F2C94C", "#6FBFA9", "#E2574C", "#3B5BA9", "#fff"][i % 5] }} />)}</div>
      <div className="qkicker">퀘스트 달성!</div>
      <div className="qtitle">{quest.title}</div>
      <div className="qxp">+{quest.xp} XP</div>
      <button type="button" className="btn" onClick={closeQuest}>좋았어</button>
    </div></div>}
    {toasts.length > 0 && <div className="toasts" aria-live="polite">{toasts.map(e => <div key={e.id} className={`toast t${e.rank != null && e.rank >= 0 ? tierOf(e.rank) : 0}`}>{e.rank != null && e.rank >= 0 && <Insignia index={e.rank} size={14} />}<span>{e.text.includes("강등") ? "⬇️" : e.text.includes("응원") ? "📣" : "🎖️"} {e.text}</span></div>)}</div>}
  </>;
}
