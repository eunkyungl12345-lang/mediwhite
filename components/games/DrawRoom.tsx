"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rt } from "@/lib/realtime";
import { getDraw, joinDraw, leaveDraw, startDraw, nextRound, guessDraw, rematchDraw, type DrawState } from "@/lib/draw";
import { display } from "@/lib/depts";
import { sfx, haptic } from "@/lib/juice";

type Seg = { id: string; c: string; w: number; pts: [number, number][] };
type Line = { who: string; text: string; ok?: boolean; sys?: boolean };
const COLORS = ["#222222", "#E2574C", "#2F6FDB", "#2C9A5B", "#F2B705", "#8E44AD", "#8B5A2B", "#FFFFFF"];

export default function DrawRoom({ me, initial }: { me: { id: string; nickname: string; dept: string }; initial: DrawState }) {
  const [st, setSt] = useState(initial), [lines, setLines] = useState<Line[]>([]), [guess, setGuess] = useState(""), [color, setColor] = useState(COLORS[0]), [size, setSize] = useState(4), [now, setNow] = useState(Date.now()), [p, start] = useTransition(), [err, setErr] = useState("");
  const cv = useRef<HTMLCanvasElement>(null), ch = useRef<any>(null), segs = useRef<Seg[]>([]), cur = useRef<Seg | null>(null), outbox = useRef<Seg | null>(null);
  const stRef = useRef(st); stRef.current = st; const r = useRouter();
  const isDrawer = st.status === "playing" && st.drawer === me.id, joined = st.players.some(x => x.user_id === me.id);
  const nameOf = (id: string | null) => { const x = st.players.find(y => y.user_id === id); return x ? display(x.dept, x.nickname) : "?"; };

  const redraw = () => { const c = cv.current; if (!c) return; const x = c.getContext("2d")!, W = c.width, H = c.height; x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.lineCap = "round"; x.lineJoin = "round";
    for (const s of segs.current) { if (s.pts.length < 1) continue; x.strokeStyle = s.c; x.lineWidth = s.w * W / 400; x.beginPath(); x.moveTo(s.pts[0][0] * W, s.pts[0][1] * H); for (const [px, py] of s.pts.slice(1)) x.lineTo(px * W, py * H); if (s.pts.length === 1) x.lineTo(s.pts[0][0] * W + .1, s.pts[0][1] * H); x.stroke(); } };
  const addPts = (id: string, c: string, w: number, pts: [number, number][]) => { let s = segs.current.find(q => q.id === id); if (!s) { s = { id, c, w, pts: [] }; segs.current.push(s); } s.pts.push(...pts); redraw(); };
  const refresh = async () => { const n = await getDraw(initial.id); if (!n) { r.push("/games/draw"); return; } const o = stRef.current;
    if (n.round !== o.round || n.status !== o.status) { segs.current = []; redraw(); if (o.status === "playing" && o.round) setLines(l => [...l, { who: "", text: `라운드 끝! 정답은 「${n.last_word ?? "?"}」`, sys: true }]); }
    stRef.current = n; setSt(n); return n; };
  const send = (event: string, payload: any) => ch.current?.send({ type: "broadcast", event, payload });

  useEffect(() => {
    const c = rt(); if (!c) return; const x = c.channel(`draw:${initial.id}`, { config: { broadcast: { self: false } } });
    x.on("broadcast", { event: "pts" }, ({ payload }) => addPts(payload.id, payload.c, payload.w, payload.pts))
     .on("broadcast", { event: "clear" }, () => { segs.current = []; redraw(); })
     .on("broadcast", { event: "want" }, () => { if (stRef.current.drawer === me.id) send("all", { segs: segs.current }); })
     .on("broadcast", { event: "all" }, ({ payload }) => { if (!segs.current.length) { segs.current = payload.segs; redraw(); } })
     .on("broadcast", { event: "chat" }, ({ payload }) => setLines(l => [...l.slice(-60), payload]))
     .on("broadcast", { event: "sync" }, () => refresh())
     .subscribe(s => { if (s === "SUBSCRIBED") send("want", {}); });
    ch.current = x;
    const flush = setInterval(() => { const o = outbox.current; if (o && o.pts.length) { send("pts", { id: o.id, c: o.c, w: o.w, pts: o.pts }); outbox.current = { ...o, pts: [] }; } }, 60);
    const poll = setInterval(refresh, 3000), tick = setInterval(() => setNow(Date.now()), 250);
    const onR = () => { const c2 = cv.current; if (!c2) return; const w = c2.clientWidth; c2.width = w * 2; c2.height = w * 2 * .75; redraw(); }; onR(); window.addEventListener("resize", onR);
    return () => { c.removeChannel(x); clearInterval(flush); clearInterval(poll); clearInterval(tick); window.removeEventListener("resize", onR); };
  }, []); // eslint-disable-line

  const left = st.round_end ? Math.max(0, Math.ceil((new Date(st.round_end).getTime() - now) / 1000)) : 0;
  const ended = useRef("");
  useEffect(() => { if (st.status === "playing" && left === 0 && st.round_end && ended.current !== st.round_end && joined) { ended.current = st.round_end; nextRound(st.id).then(() => { refresh(); send("sync", {}); }); } }, [left]); // eslint-disable-line
  useEffect(() => { if (isDrawer) { haptic([20, 30, 20]); sfx.level(); } }, [isDrawer, st.round]); // eslint-disable-line

  const pos = (e: React.PointerEvent) => { const b = (e.target as HTMLCanvasElement).getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), Math.min(1, Math.max(0, (e.clientY - b.top) / b.height))] as [number, number]; };
  const down = (e: React.PointerEvent) => { if (!isDrawer) return; (e.target as Element).setPointerCapture(e.pointerId); const id = `${me.id}-${Date.now()}`, pt = pos(e); cur.current = { id, c: color, w: size, pts: [pt] }; outbox.current = { id, c: color, w: size, pts: [pt] }; addPts(id, color, size, [pt]); };
  const move = (e: React.PointerEvent) => { const s = cur.current; if (!s) return; const pt = pos(e); addPts(s.id, s.c, s.w, [pt]); if (outbox.current) outbox.current.pts.push(pt); };
  const up = () => { cur.current = null; };
  const clear = () => { segs.current = []; redraw(); send("clear", {}); };
  const act = (f: () => Promise<any>) => start(async () => { setErr(""); const res = await f(); if (res?.error) setErr(res.error); await refresh(); send("sync", {}); });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); const t = guess.trim(); if (!t) return; setGuess("");
    if (st.status === "playing" && !isDrawer && !st.guessed.includes(me.id)) { const res = await guessDraw(st.id, t); if (res.correct) { sfx.level(); haptic([30, 20, 60]); const line = { who: display(me.dept, me.nickname), text: "🎉 정답!", ok: true }; setLines(l => [...l, line]); send("chat", line); const n = await refresh(); send("sync", {}); if (n && n.status === "playing" && n.players.filter(x => x.user_id !== n.drawer).every(x => n.guessed.includes(x.user_id))) { await nextRound(st.id); await refresh(); send("sync", {}); } return; } }
    if (isDrawer && st.word && t.replace(/\s/g, "").includes(st.word.replace(/\s/g, ""))) { setErr("그리는 사람은 정답을 채팅에 쓸 수 없어요"); return; }
    const line = { who: display(me.dept, me.nickname), text: t }; setLines(l => [...l.slice(-60), line]); send("chat", line); };
  const share = () => { const url = location.href; if (navigator.share) navigator.share({ title: "메디화이트 그림 맞히기 한 판?", url }).catch(() => {}); else { navigator.clipboard?.writeText(url); setErr("링크를 복사했어요"); } };
  const ranking = [...st.players].sort((a, b) => (st.scores[b.user_id] ?? 0) - (st.scores[a.user_id] ?? 0));
  const feed = useRef<HTMLDivElement>(null); useEffect(() => { const f = feed.current; if (f) f.scrollTop = f.scrollHeight; }, [lines]);

  return (
    <div className="games">
      <div className="bar"><Link className="link" href="/games/draw">← 로비</Link><button type="button" className="link" onClick={share}>📤 친구 부르기</button></div>
      <div className="card" style={{ gap: 6 }}>
        <div className="bar"><h3 style={{ margin: 0 }}>{st.title}</h3>{st.status === "playing" && <span className="tag">라운드 {st.round}/{st.rounds_total}</span>}</div>
        <div className="dr-players">{ranking.map(x => <span key={x.user_id} className={(st.drawer === x.user_id && st.status === "playing" ? "drawing " : "") + (st.guessed.includes(x.user_id) ? "ok" : "")}>{st.drawer === x.user_id && st.status === "playing" ? "✏️ " : st.guessed.includes(x.user_id) ? "✅ " : ""}{display(x.dept, x.nickname)} <b>{st.scores[x.user_id] ?? 0}</b>{x.user_id === st.host ? " 👑" : ""}</span>)}</div>
        {st.status === "waiting" && <div className="row">{!joined ? <button type="button" className="btn" disabled={p} onClick={() => act(() => joinDraw(st.id))}>참가하기</button> : st.host === me.id ? <button type="button" className="btn" disabled={p || st.players.length < 2} onClick={() => act(() => startDraw(st.id))}>▶ 시작하기 {st.players.length < 2 ? "(2명부터)" : ""}</button> : <span className="muted">방장이 시작하면 바로 시작해요</span>}{joined && <button type="button" className="btn ghost" onClick={() => act(async () => { await leaveDraw(st.id); r.push("/games/draw"); })}>나가기</button>}</div>}
        {st.status === "playing" && <div className={"om-status" + (isDrawer ? " me" : "")} style={{ width: "100%" }}>{isDrawer ? <>✏️ 제시어: <b style={{ fontSize: 18 }}>{st.word}</b> — 그려주세요!</> : st.guessed.includes(me.id) ? <>✅ 맞혔어요! 정답 「{st.word}」</> : <>🤔 {nameOf(st.drawer)}님이 그리는 중 · {st.hint}</>}<span className="om-timer"><i style={{ width: `${(left / 80) * 100}%` }} />{left}초</span></div>}
        {st.status === "done" && <div className="om-status win">🏆 {ranking[0] ? `${display(ranking[0].dept, ranking[0].nickname)} 1등! (${st.scores[ranking[0].user_id] ?? 0}점)` : "끝!"} {st.last_word ? ` · 마지막 정답 「${st.last_word}」` : ""}{joined && <button type="button" className="btn" style={{ padding: "4px 12px", marginLeft: 8 }} onClick={() => act(() => rematchDraw(st.id))}>한 판 더</button>}</div>}
        {err && <div className="muted">{err}</div>}
      </div>
      <div className="dr-wrap">
        <canvas ref={cv} className={"dr-canvas" + (isDrawer ? " live" : "")} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        {isDrawer && <div className="dr-tools">{COLORS.map(c => <button key={c} type="button" className={"dr-color" + (color === c ? " on" : "")} style={{ background: c }} onClick={() => setColor(c)} aria-label={c === "#FFFFFF" ? "지우개" : "색"}>{c === "#FFFFFF" ? "🧽" : ""}</button>)}
          {[2, 4, 8, 14].map(w => <button key={w} type="button" className={"dr-size" + (size === w ? " on" : "")} onClick={() => setSize(w)}><i style={{ width: w + 2, height: w + 2 }} /></button>)}
          <button type="button" className="btn ghost" style={{ padding: "4px 10px" }} onClick={clear}>🗑 전체 지우기</button></div>}
      </div>
      <div className="card dr-chat">
        <div className="dr-feed" ref={feed}>{lines.length ? lines.map((l, i) => <div key={i} className={l.sys ? "sys" : l.ok ? "ok" : ""}>{l.who && <b>{l.who} </b>}{l.text}</div>) : <div className="muted">정답을 채팅으로 입력하세요. 틀린 답도 다 같이 보여요 😆</div>}</div>
        <form className="composer dr-form" onSubmit={submit}><input value={guess} onChange={e => setGuess(e.target.value)} maxLength={40} placeholder={isDrawer ? "그리는 중엔 응원만 😉" : "정답은?"} autoComplete="off" /><button className="btn">보내기</button></form>
      </div>
    </div>
  );
}
