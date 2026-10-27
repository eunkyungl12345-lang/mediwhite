"use client";
import { useEffect, useState, type ReactNode } from "react";
export type GameEntry = { id: string; name: string; icon: string; sub: string; node: ReactNode; color?: string; badge?: string };
export default function GameHub({ games }: { games: GameEntry[] }) {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { try { const h = location.hash.replace("#", ""); if (games.some(g => g.id === h)) setOpen(h); } catch {} }, [games]);
  const pick = (id: string | null) => { setOpen(id); try { history.replaceState(null, "", id ? `#${id}` : location.pathname); } catch {} window.scrollTo({ top: 0 }); };
  const cur = games.find(g => g.id === open);
  if (cur) return (
    <div className="games">
      <div className="bar"><button type="button" className="link" onClick={() => pick(null)}>← 게임 목록</button><span className="muted">{cur.icon} {cur.name}</span></div>
      {cur.node}
    </div>
  );
  return (
    <div className="hub">
      {games.map(g => <button key={g.id} type="button" className="hub-tile" onClick={() => pick(g.id)}>
        {g.badge && <span className={"hub-badge" + (g.badge === "HIT!" ? " hit" : "")}>{g.badge}</span>}
        <span className="hub-ico">{g.icon}</span><span className="hub-name">{g.name}</span><span className="hub-sub">{g.sub}</span></button>)}
    </div>
  );
}
