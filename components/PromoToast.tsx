"use client";
import { useEffect, useRef, useState } from "react";
import Insignia from "./Insignia";
import { tierOf } from "@/lib/ranks";
type Ev = { id: number; text: string; rank: number | null };
/** 진급 알림: 우측 상단에 떴다가 6초 뒤 사라짐. 새 이벤트만(마지막으로 본 id 이후) */
export default function PromoToast() {
  const [toasts, setToasts] = useState<Ev[]>([]);
  const lastSeen = useRef<number | null>(null);
  useEffect(() => {
    try { const v = localStorage.getItem("mw-ev-last"); if (v) lastSeen.current = Number(v); } catch {}
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/events", { cache: "no-store" }); if (!r.ok) return;
        const d = await r.json(); const evs: Ev[] = d.events ?? []; if (!alive || !evs.length) return;
        const maxId = Math.max(...evs.map(e => e.id));
        if (lastSeen.current == null) { lastSeen.current = maxId; try { localStorage.setItem("mw-ev-last", String(maxId)); } catch {} return; }
        const fresh = evs.filter(e => e.id > (lastSeen.current as number)).reverse();
        if (fresh.length) { lastSeen.current = maxId; try { localStorage.setItem("mw-ev-last", String(maxId)); } catch {}
          setToasts(t => [...t, ...fresh]); fresh.forEach(e => setTimeout(() => setToasts(t => t.filter(x => x.id !== e.id)), 6500)); }
      } catch {}
    };
    load(); const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  if (!toasts.length) return null;
  return <div className="toasts" aria-live="polite">{toasts.map(e => <div key={e.id} className={`toast t${e.rank != null ? tierOf(e.rank) : 0}`}>{e.rank != null && <Insignia index={e.rank} size={14} />}<span>🎖️ {e.text}</span></div>)}</div>;
}
