"use client";
import { useEffect, useState } from "react";
import { liveBeat, liveLeave } from "@/lib/live.actions";
/** 👀 지금 N명 보는 중 (2명 이상일 때만 표시) */
export default function LiveViewers({ kind, id, initial = 0 }: { kind: string; id: string; initial?: number }) {
  const [n, setN] = useState(initial);
  useEffect(() => {
    let on = true; const ping = () => liveBeat(kind, id).then(c => { if (on) setN(c); }).catch(() => {});
    ping(); const t = setInterval(() => { if (document.visibilityState === "visible") ping(); }, 20000);
    const bye = () => { liveLeave(kind, id).catch(() => {}); }; addEventListener("pagehide", bye);
    return () => { on = false; clearInterval(t); removeEventListener("pagehide", bye); bye(); };
  }, [kind, id]);
  if (n < 2) return null;
  return <span className="live-eye"><i /> 지금 {n}명 보는 중</span>;
}
