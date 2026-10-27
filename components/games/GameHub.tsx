"use client";
import { useEffect, useState, type ReactNode } from "react";
import PixelIcon from "./PixelIcon";
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
      <div className="hub-top"><span className="hub-led" /> GAME SELECT <span className="hub-blink">▶</span><span className="hub-right">MEDIWHITE · {games.length} GAMES</span></div>
      {games.map((g, i) => <button key={g.id} type="button" className={"hub-tile" + (i === 0 ? " wide" : "")} style={{ "--tile": g.color ?? "#FFE9A8", "--rot": `${((i * 7) % 5) - 2}deg` } as any} onClick={() => pick(g.id)}>
        {g.badge && <span className={"hub-badge" + (g.badge === "HIT!" ? " hit" : "")}>{g.badge}</span>}
        <span className="hub-ico" style={{ animationDelay: `${(i % 5) * .3}s` }}><PixelIcon e={g.icon} size={i === 0 ? 64 : 48} px={i === 0 ? 16 : 14} /></span><span className="hub-name">{g.name}</span><span className="hub-sub">{g.sub}</span></button>)}
      <div className="hub-foot"><span className="hub-blink">■</span> PRESS A GAME TO START</div>
    </div>
  );
}
