"use client";
import { useEffect, useRef, useState } from "react";
import { rt, fmt } from "@/lib/realtime";
import { sendMessage } from "@/lib/actions";
import type { Session } from "@/lib/auth";
import { display } from "@/lib/depts";

export type Msg = { id: number; nickname: string; dept: string; text: string; created_at: string; user_id: string | null; rank?: string | null };

export default function ChatRoom({ me, initial }: { me: Session; initial: Msg[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const chRef = useRef<ReturnType<NonNullable<ReturnType<typeof rt>>["channel"]> | null>(null);

  const push = (m: Msg) => setMsgs(prev => prev.some(x => x.id === m.id) ? prev : [...prev.slice(-200), m]);

  useEffect(() => {
    const c = rt(); if (!c) return;
    const ch = c.channel("chat");
    ch.on("broadcast", { event: "msg" }, ({ payload }) => push(payload as Msg)).subscribe();
    chRef.current = ch;
    return () => { c.removeChannel(ch); chRef.current = null; };
  }, []);

  useEffect(() => {
    const f = feed.current; if (!f) return;
    const nearBottom = f.scrollHeight - f.scrollTop - f.clientHeight < 120;
    if (nearBottom || msgs.length === initial.length) f.scrollTop = f.scrollHeight;
  }, [msgs, initial.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim(); if (!t || busy) return;
    setBusy(true); setText("");
    try {
      const saved = await sendMessage(t);
      if (saved) { push(saved as Msg); chRef.current?.send({ type: "broadcast", event: "msg", payload: saved }); }
      else setText(t);
    } catch { setText(t); }
    setBusy(false);
  }

  return (
    <div className="chat">
      <div className="feed" ref={feed} aria-live="polite">
        {msgs.length === 0 && <div className="empty">아직 대화가 없어요. 첫 인사를 남겨보세요.</div>}
        {msgs.map(m => {
          const mine = m.user_id === me.id;
          return (
            <div key={m.id} className={"msg" + (mine ? " mine" : "")}>
              <div className="who">{!mine && <>{m.rank && <span className="rank-tag">{m.rank}</span>}<span>{display(m.dept, m.nickname)}</span></>}<span className="time">{fmt(m.created_at)}</span></div>
              <div className="bubble">{m.text}</div>
            </div>
          );
        })}
      </div>
      <form className="composer" onSubmit={submit}>
        <input id="chatInput" value={text} onChange={e => setText(e.target.value)} maxLength={500} autoComplete="off" placeholder="메시지 입력" />
        <button className="btn" disabled={busy}>보내기</button>
      </form>
    </div>
  );
}
