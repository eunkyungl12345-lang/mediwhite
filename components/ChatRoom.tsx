"use client";
import { useEffect, useRef, useState } from "react";
import { rt } from "@/lib/realtime";
import { fmt } from "@/lib/format";
import { sendMessage } from "@/lib/actions";
import type { Session } from "@/lib/auth";
import { display } from "@/lib/depts";
import Insignia from "./Insignia";
import { tierOf } from "@/lib/ranks";

export type Msg = { id: number; nickname: string; dept: string; text: string; created_at: string; user_id: string | null; rank?: string | null };

export default function ChatRoom({ me, initial, onNew, myRank }: { me: Session; initial: Msg[]; onNew?: (m: Msg) => void; myRank?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const chRef = useRef<any>(null);
  const push = (m: Msg & { tmp?: string }) => setMsgs(prev => {
    if (m.tmp) { const i = prev.findIndex(x => (x as any).tmp === m.tmp); if (i >= 0) { const n = prev.slice(); n[i] = m; return n; } }
    return prev.some(x => x.id === m.id) ? prev : [...prev.slice(-200), m];
  });
  useEffect(() => {
    const c = rt(); if (!c) return;
    const ch = c.channel("chat");
    ch.on("broadcast", { event: "msg" }, ({ payload }) => { push(payload as Msg); onNew?.(payload as Msg); }).subscribe();
    chRef.current = ch; return () => { c.removeChannel(ch); chRef.current = null; };
  }, []); // eslint-disable-line
  useEffect(() => { const f = feed.current; if (f) f.scrollTop = f.scrollHeight; }, [msgs]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const t = text.trim(); if (!t || busy) return;
    setBusy(true); setText("");
    // 1) 내 화면과 다른 사람 화면에 즉시 뿌리고  2) 서버 저장은 뒤따라감
    const tmp = `${me.id}-${Date.now()}`;
    const optimistic: Msg & { tmp: string } = { id: -Date.now(), tmp, nickname: me.nickname, dept: me.dept, text: t, created_at: new Date().toISOString(), user_id: me.id, rank: myRank ?? null };
    push(optimistic); chRef.current?.send({ type: "broadcast", event: "msg", payload: optimistic });
    setBusy(false);
    try { const saved = await sendMessage(t); if (saved) { push({ ...(saved as Msg), tmp }); chRef.current?.send({ type: "broadcast", event: "msg", payload: { ...saved, tmp } }); } }
    catch { setMsgs(prev => prev.filter(x => (x as any).tmp !== tmp)); setText(t); }
  }
  return (
    <div className="chat">
      <div className="feed" ref={feed} aria-live="polite">
        {msgs.length === 0 && <div className="empty">아직 대화가 없어요. 첫 인사를 남겨보세요.</div>}
        {msgs.map(m => { const mine = m.user_id === me.id; const ri = m.rank != null && /^\d+$/.test(String(m.rank)) ? Number(m.rank) : null; return (
          <div key={m.id} className={"msg" + (mine ? " mine" : "")}>
            <div className="who">{!mine && <>{ri != null && <span className={`ins t${tierOf(ri)}`}><Insignia index={ri} size={12} /></span>}<span>{display(m.dept, m.nickname)}</span></>}<span className="time">{fmt(m.created_at)}</span></div>
            <div className="bubble">{m.text}</div>
          </div>); })}
      </div>
      <form className="composer" onSubmit={submit}>
        <input id="chatInput" value={text} onChange={e => setText(e.target.value)} maxLength={500} autoComplete="off" placeholder={`${display(me.dept, me.nickname)}(으)로 말하기`} />
        <button className="btn">보내기</button>
      </form>
    </div>
  );
}
