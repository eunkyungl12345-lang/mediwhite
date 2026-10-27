"use client";
import { useState, useTransition } from "react";
import { toggleReaction } from "@/lib/actions";
import { sfx, haptic } from "@/lib/juice";

const EMOJIS = ["👍", "😂", "😢", "🔥"] as const;
const LABEL: Record<string, string> = { "👍": "공감", "😂": "웃겨요", "😢": "슬퍼요", "🔥": "최고" };
export default function Reactions({ kind, id, counts: c0, mine: m0, compact }: { kind: "post" | "comment"; id: string; counts: Record<string, number>; mine: string | null; compact?: boolean }) {
  const [counts, setCounts] = useState(c0), [mine, setMine] = useState(m0);
  const [, start] = useTransition();
  const tap = (e: string) => {
    const next = { ...counts }; if (mine) next[mine] = Math.max(0, (next[mine] ?? 1) - 1); if (mine !== e) next[e] = (next[e] ?? 0) + 1;
    setCounts(next); setMine(mine === e ? null : e); sfx.tap(); haptic(6);
    start(async () => { const r = await toggleReaction(kind, id, e); if (r) { setCounts(r.counts); setMine(r.mine); } });
  };
  const shown = compact ? EMOJIS.filter(e => e === "👍" || e === "😂" || (counts[e] ?? 0) > 0) : EMOJIS;
  return (
    <div className={"react" + (compact ? " compact" : "")} onClick={e => e.stopPropagation()}>
      {shown.map(e => <button key={e} type="button" className={"react-btn" + (mine === e ? " on" : "")} onClick={() => tap(e)} title={LABEL[e]}><span>{e}</span>{(counts[e] ?? 0) > 0 && <b>{counts[e]}</b>}{!compact && <small>{LABEL[e]}</small>}</button>)}
    </div>
  );
}
