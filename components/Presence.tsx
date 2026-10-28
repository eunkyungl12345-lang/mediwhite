"use client";
import { useEffect, useState } from "react";
import { rt } from "@/lib/realtime";
import { reportOnline } from "@/lib/actions";
import type { Session } from "@/lib/auth";
export default function Presence({ user, stealth }: { user: Session; stealth?: boolean }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const c = rt(); if (!c) return;
    const ch = c.channel("lobby", { config: { presence: { key: user.id } } });
    let best = 0, lastAt = 0;
    ch.on("presence", { event: "sync" }, () => { const k = Object.keys(ch.presenceState()).length; setN(k); const now = Date.now(); if (k > best && now - lastAt > 60000) { best = k; lastAt = now; reportOnline(k).catch(() => {}); } })
      .subscribe(async s => { if (s === "SUBSCRIBED" && !stealth) await ch.track({ dept: user.dept }); });
    return () => { c.removeChannel(ch); };
  }, [user.id, user.dept, stealth]);
  return <span className="live"><i />{n == null ? "" : `${n}명`}</span>;
}
