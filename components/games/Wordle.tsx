"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { wordleLoad, wordleGuess, type WordleState } from "@/lib/daily.actions";

const KB = ["QWERTYUIOP", "ASDFGHJKL", "↵ZXCVBNM⌫"];
const EMO: Record<string, string> = { g: "🟩", y: "🟨", b: "⬜" };
export default function Wordle() {
  const [st, setSt] = useState<WordleState | null>(null), [cur, setCur] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [shake, setShake] = useState(false), [left, setLeft] = useState("");
  useEffect(() => { wordleLoad().then(setSt).catch(() => setMsg("불러오지 못했어요")); }, []);
  useEffect(() => { const tick = () => { const n = new Date(Date.now() + 9 * 3600000), s = 86400 - (n.getUTCHours() * 3600 + n.getUTCMinutes() * 60 + n.getUTCSeconds()); setLeft(`${Math.floor(s / 3600)}시간 ${Math.floor(s % 3600 / 60)}분`); }; tick(); const id = setInterval(tick, 30000); return () => clearInterval(id); }, []);
  const submit = async () => {
    if (!st || st.done || busy) return;
    if (cur.length !== 5) { setMsg("5글자를 채워주세요"); setShake(true); setTimeout(() => setShake(false), 400); return; }
    setBusy(true); const r = await wordleGuess(cur); setBusy(false);
    if (r.error) { setMsg(r.error); setShake(true); setTimeout(() => setShake(false), 400); setSt(r); return; }
    setSt(r); setCur(""); setMsg(r.done ? (r.won ? `🎉 정답! +${r.xp ?? 0} XP` : `아쉬워요! 정답은 ${r.answer}`) : "");
  };
  const press = (k: string) => { if (!st || st.done) return; setMsg(""); if (k === "↵") return void submit(); if (k === "⌫") return setCur(c => c.slice(0, -1)); if (/^[A-Z]$/.test(k)) setCur(c => (c + k).slice(0, 5)); };
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return; if (e.key === "Enter") press("↵"); else if (e.key === "Backspace") press("⌫"); else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase()); }; addEventListener("keydown", h); return () => removeEventListener("keydown", h); });
  if (!st) return <div className="card"><div className="muted">{msg || "불러오는 중…"}</div></div>;
  const keyState: Record<string, string> = {};
  st.guesses.forEach((g, i) => [...g].forEach((ch, j) => { const m = st.marks[i][j]; if (m === "g" || (m === "y" && keyState[ch] !== "g") || (m === "b" && !keyState[ch])) keyState[ch] = m; }));
  const share = `메디워들 #${st.no} ${st.won ? st.guesses.length : "X"}/6\n${st.marks.map(m => [...m].map(c => EMO[c]).join("")).join("\n")}`;
  const rows = Array.from({ length: 6 }, (_, i) => i < st.guesses.length ? { w: st.guesses[i], m: st.marks[i] } : i === st.guesses.length && !st.done ? { w: cur, m: "" } : { w: "", m: "" });
  return (
    <div className="card wd">
      <div className="wd-top"><b>📅 오늘의 메디워들 #{st.no}</b><span className="muted">영어 의학용어 5글자 · 6번 안에 · 하루 한 문제</span></div>
      <div className="wd-grid">{rows.map((r, i) => <div key={i} className={"wd-row" + (i === st.guesses.length && shake ? " shake" : "")}>{Array.from({ length: 5 }, (_, j) => <span key={j} className={"wd-cell" + (r.m ? " " + r.m[j] : r.w[j] ? " on" : "")} style={r.m ? { animationDelay: `${j * .12}s` } : undefined}>{r.w[j] ?? ""}</span>)}</div>)}</div>
      {msg && <div className="wd-msg">{msg}</div>}
      {st.done ? <div className="wd-done">
        <div><b>{st.won ? `${st.guesses.length}번 만에 정답!` : "오늘은 실패 😢"}</b> 정답은 <b>{st.answer}</b>{st.meaning ? ` (${st.meaning})` : ""}</div>
        <pre className="wd-share">{share}</pre>
        <div className="row" style={{ gap: 6, justifyContent: "center" }}>
          <button type="button" className="btn ghost" onClick={() => { navigator.clipboard?.writeText(share).then(() => setMsg("복사했어요! 🟩"), () => setMsg("복사가 안 돼요")); }}>📋 결과 복사</button>
          <Link className="btn" href={`/board/new?${new URLSearchParams({ topic: "free", title: `메디워들 #${st.no} ${st.won ? st.guesses.length : "X"}/6`, body: share + "\n\n너넨 몇 번 만에 맞힘? ㅋㅋ (정답 스포 금지!)" })}`}>📝 게시판에 인증</Link>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>다음 문제까지 {left} · 오늘 {st.solvers}명이 맞혔어요</div>
      </div> : <div className="wd-kb">{KB.map(row => <div key={row} className="wd-kr">{[...row].map(k => <button key={k} type="button" className={"wd-k" + (keyState[k] ? " " + keyState[k] : "") + (k === "↵" || k === "⌫" ? " wide" : "")} disabled={busy} onClick={() => press(k)}>{k === "↵" ? "입력" : k}</button>)}</div>)}</div>}
      <div className="muted" style={{ fontSize: 12 }}>🟩 자리까지 맞음 · 🟨 단어엔 있는데 자리가 다름 · ⬜ 없음 · 맞히면 XP (1번 300 → 6번 100)</div>
    </div>
  );
}
