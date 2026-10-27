"use client";
import { useEffect, useState } from "react";
type Item = { id: string; text: string };
export default function Ticker() {
  const [items, setItems] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/events", { cache: "no-store" }).then(r => r.ok ? r.json() : { items: [] }).then(d => { if (alive) setItems(d.items ?? []); }).catch(() => {});
    load(); const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  useEffect(() => { if (items.length < 2) return; const t = setInterval(() => setI(x => (x + 1) % items.length), 5000); return () => clearInterval(t); }, [items.length]);
  if (!items.length) return null;
  const cur = items[i % items.length];
  return <div className="ticker" aria-live="polite"><span key={cur.id}>{cur.text}</span></div>;
}
