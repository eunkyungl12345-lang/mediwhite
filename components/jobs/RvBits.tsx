"use client";
import { useState } from "react";
import { toggleHelp } from "@/lib/help.actions";
/** 👍 도움이 돼요 */
export function HelpBtn({ hid, k, n, on }: { hid: number; k: string; n: number; on: boolean }) {
  const [s, setS] = useState({ n, on }), [busy, setBusy] = useState(false);
  return <button type="button" className={"rv2-help" + (s.on ? " on" : "")} disabled={busy} onClick={async () => { setBusy(true); setS(p => ({ on: !p.on, n: p.n + (p.on ? -1 : 1) })); const r = await toggleHelp(hid, k); setBusy(false); if ("n" in r) setS({ on: r.on, n: r.n }); }}>도움이 돼요 👍 <b>{s.n || ""}</b></button>;
}
/** 긴 글은 3줄까지만, '더 보기'로 펼치기 */
export function More({ children, long }: { children: React.ReactNode; long: boolean }) {
  const [open, setOpen] = useState(!long);
  return <div className={"rv2-body" + (open ? " open" : "")}>{children}{!open && <button type="button" className="rv2-more" onClick={() => setOpen(true)}>더 보기</button>}</div>;
}
