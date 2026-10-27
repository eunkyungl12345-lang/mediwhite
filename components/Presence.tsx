"use client";
import { useEffect, useState } from "react";
import { rt } from "@/lib/realtime";
import type { Session } from "@/lib/auth";

export default function Presence({ user }: { user: Session }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const c = rt(); if (!c) return;
    const ch = c.channel("lobby", { config: { presence: { key: user.id } } });
    ch.on("presence", { event: "sync" }, () => setN(Object.keys(ch.presenceState()).length))
      .subscribe(async s => { if (s === "SUBSCRIBED") await ch.track({ dept: user.dept }); });
    return () => { c.removeChannel(ch); };
  }, [user.id, user.dept]);
  return <span className="live"><i />{n == null ? "라운지" : `${n}명 접속 중`}</span>;
}
