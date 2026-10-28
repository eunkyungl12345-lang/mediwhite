"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rt } from "@/lib/realtime";
import { getOmok, joinOmok, leaveOmok, startOmok, placeStone, timeoutOmok, rematchOmok, type OmokState } from "@/lib/omok";
import { display } from "@/lib/depts";
import { sfx, haptic } from "@/lib/juice";

const N = 15;
export default function OmokRoom({ me, initial }: { me: { id: string; nickname: string; dept?: string }; initial: OmokState }) {
  const [st, setSt] = useState(initial), stRef = useRef(initial), [err, setErr] = useState(""), [p, start] = useTransition(), [now, setNow] = useState(Date.now());
  const ch = useRef<any>(null); const r = useRouter();
  const [lines, setLines] = useState<{ who: string; text: string; t?: string }[]>([]), [msg, setMsg] = useState(""); const feed = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = feed.current; if (f) f.scrollTop = f.scrollHeight; }, [lines]);
  const say = (text: string) => { const t = text.trim().slice(0, 80); if (!t) return; const line = { who: display(me.dept ?? "", me.nickname), text: t, t: mineTeam() }; setLines(l => [...l.slice(-80), line]); ch.current?.send({ type: "broadcast", event: "chat", payload: line }); setMsg(""); };
  const refresh = async () => { const n = await getOmok(initial.id); if (n) { if (n.board !== st.board) sfx.tap(); setSt(n); } else r.push("/games/omok"); };
  const ping = () => ch.current?.send({ type: "broadcast", event: "sync", payload: {} });
  useEffect(() => {
    const c = rt(); if (!c) return; const x = c.channel(`omok:${initial.id}`, { config: { broadcast: { self: false } } });
    x.on("broadcast", { event: "sync" }, () => { refresh(); }).on("broadcast", { event: "chat" }, ({ payload }) => { setLines(l => [...l.slice(-80), payload]); sfx.tap(); }).subscribe(); ch.current = x;
    const poll = setInterval(refresh, 4000), tick = setInterval(() => setNow(Date.now()), 250);
    return () => { c.removeChannel(x); clearInterval(poll); clearInterval(tick); };
  }, []); // eslint-disable-line
  const act = (f: () => Promise<any>) => start(async () => { setErr(""); const res = await f(); if (res?.error) setErr(res.error); await refresh(); ping(); });

  stRef.current = st;
  const mine = st.players.find(x => x.user_id === me.id);
  function mineTeam() { return stRef.current.players.find(x => x.user_id === me.id)?.team ?? ""; }
  const team = (t: string) => st.players.filter(x => x.team === t);
  const curTeam = team(st.turn), cur = curTeam.length ? curTeam[(st.turn === "b" ? st.idx_b : st.idx_w) % curTeam.length] : null;
  const myTurn = st.status === "playing" && cur?.user_id === me.id;
  const left = st.deadline ? Math.max(0, Math.ceil((new Date(st.deadline).getTime() - now) / 1000)) : 0;
  const timedOut = useRef(""); 
  useEffect(() => { if (st.status === "playing" && st.deadline && left === 0 && timedOut.current !== st.deadline && mine) { timedOut.current = st.deadline; timeoutOmok(st.id).then(() => { refresh(); ping(); }); } }, [left]); // eslint-disable-line
  useEffect(() => { if (myTurn) { haptic([20, 30, 20]); sfx.level(); } }, [myTurn]);
  useEffect(() => { if (st.status === "done" && st.winner && mine) { if (st.winner === mine.team) { sfx.level(); haptic([30, 30, 80]); } else sfx.boom(); } }, [st.status]); // eslint-disable-line

  const place = (i: number) => { if (!myTurn || st.board[i] !== "." || p) return; const optimistic = st.board.slice(0, i) + st.turn + st.board.slice(i + 1); setSt({ ...st, board: optimistic, last_move: i }); sfx.tap(); haptic(10); act(() => placeStone(st.id, i)); };
  const share = () => { const url = location.href; if (navigator.share) navigator.share({ title: "메디화이트 오목 한 판?", text: st.bet ? `내기: ${st.bet}` : "들어와요!", url }).catch(() => {}); else { navigator.clipboard?.writeText(url); setErr("링크를 복사했어요"); } };
  const Team = ({ t }: { t: "b" | "w" }) => (
    <div className={"om-team" + (st.status === "playing" && st.turn === t ? " on" : "")}>
      <div className="om-team-h">{t === "b" ? "⚫ 흑" : "⚪ 백"} <span className="muted">{team(t).length}/{st.per_team}</span></div>
      {team(t).map(x => <div key={x.user_id} className={"om-p" + (cur?.user_id === x.user_id && st.status === "playing" ? " cur" : "")}>{cur?.user_id === x.user_id && st.status === "playing" ? "👉 " : ""}{display(x.dept, x.nickname)}{x.user_id === me.id ? " (나)" : ""}{x.user_id === st.host ? " 👑" : ""}</div>)}
      {st.status === "waiting" && mine?.team !== t && team(t).length < st.per_team && <button type="button" className="btn ghost" style={{ padding: "4px 10px" }} disabled={p} onClick={() => act(() => joinOmok(st.id, t))}>{mine ? "이 팀으로" : "참가"}</button>}
    </div>
  );
  const winText = st.winner === "draw" ? "무승부!" : st.winner ? `${st.winner === "b" ? "⚫ 흑" : "⚪ 백"} 승리!` : "";
  return (
    <div className="games">
      <div className="bar"><Link className="link" href="/games/omok">← 오목 로비</Link><button type="button" className="link" onClick={share}>📤 친구 부르기</button></div>
      <div className="card" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>{st.title}</h3>
        <div className="muted">{st.per_team === 1 ? "1:1" : `${st.per_team}:${st.per_team} 팀전 · 같은 팀끼리 번갈아 둬요`}{st.bet ? ` · ☕ 내기: ${st.bet}` : ""}</div>
        <div className="om-teams"><Team t="b" /><Team t="w" /></div>
        {st.status === "waiting" && <div className="row">{st.host === me.id ? <button type="button" className="btn" disabled={p} onClick={() => act(() => startOmok(st.id))}>▶ 시작하기</button> : <span className="muted">방장이 시작하면 바로 둬요</span>}{mine && <button type="button" className="btn ghost" onClick={() => act(async () => { await leaveOmok(st.id); r.push("/games/omok"); })}>나가기</button>}</div>}
        {st.status === "playing" && <div className={"om-status" + (myTurn ? " me" : "")}>{myTurn ? "🎯 내 차례! 돌을 놓으세요" : `${st.turn === "b" ? "⚫" : "⚪"} ${cur ? display(cur.dept, cur.nickname) : ""} 차례`} <span className="om-timer"><i style={{ width: `${(left / 30) * 100}%` }} />{left}초</span></div>}
        {st.status === "done" && <div className="om-status win">🏆 {winText}{mine && st.winner === mine.team ? " 축하해요!" : ""}{st.bet && st.winner !== "draw" ? ` · ☕ ${st.bet}` : ""} {mine && <button type="button" className="btn" style={{ padding: "4px 12px", marginLeft: 8 }} onClick={() => act(() => rematchOmok(st.id))}>한 판 더</button>}</div>}
        {err && <div className="muted">{err}</div>}
      </div>
      <div className="om-board" style={{ ["--n" as any]: N }}>
        {Array.from({ length: N * N }, (_, i) => { const c = st.board[i]; return (
          <button key={i} type="button" className={"om-cell" + (myTurn && c === "." ? " can" : "")} onClick={() => place(i)} aria-label={`${Math.floor(i / N) + 1}행 ${i % N + 1}열`}>
            {c !== "." && <span className={"om-stone " + c + (st.last_move === i ? " last" : "")} />}
            {myTurn && c === "." && <span className={"om-ghost " + st.turn} />}
          </button>); })}
      </div>
      <div className="card dr-chat om-chat">
        <div className="dr-feed" ref={feed}>{lines.length ? lines.map((l, i) => <div key={i}><b className={l.t === "b" ? "om-cb" : l.t === "w" ? "om-cw" : ""}>{l.t === "b" ? "⚫ " : l.t === "w" ? "⚪ " : "👀 "}{l.who}</b> {l.text}</div>) : <div className="muted">💬 두면서 수다 떨어요! (방 안에서만 보여요)</div>}</div>
        <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>{["ㅋㅋㅋ", "👍 굿수", "😱 헉", "🤔 고민중…", "빨리 둬요~", "한 판 더?"].map(q => <button key={q} type="button" className="chip" onClick={() => say(q)}>{q}</button>)}</div>
        <form className="composer dr-form" onSubmit={e => { e.preventDefault(); say(msg); }}><input value={msg} onChange={e => setMsg(e.target.value)} maxLength={80} placeholder="메시지 보내기" autoComplete="off" /><button className="btn">보내기</button></form>
      </div>
      {!mine && <div className="muted" style={{ textAlign: "center" }}>👀 구경 중이에요. {st.status === "waiting" ? "위에서 팀을 골라 참가하세요." : ""}</div>}
    </div>
  );
}
