"use client";
import { useEffect, useState } from "react";
import { rt } from "@/lib/realtime";
import type { Session } from "@/lib/auth";
export default function Presence({ user, stealth }: { user: Session; stealth?: boolean }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const c = rt(); if (!c) return;
    const ch = c.channel("lobby", { config: { presence: { key: user.id } } });
    ch.on("presence", { event: "sync" }, () => setN(Object.keys(ch.presenceState()).length))
      .subscribe(async s => { if (s === "SUBSCRIBED" && !stealth) await ch.track({ dept: user.dept }); });
    return () => { c.removeChannel(ch); };
  }, [user.id, user.dept, stealth]);
  return <span className="live"><i />{n == null ? "" : `${n}명`}</span>;
}
