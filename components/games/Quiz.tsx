"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import { QUIZ } from "@/lib/quiz";
import Board, { type Row } from "./Board";
import { sfx, haptic, shake, burst, pop, recordWatcher } from "@/lib/juice";
import { BestLine, RecordFlash } from "./Juice";
/** 의학용어 스피드 퀴즈 — 60초, 맞히면 +10, 연속 보너스. */
const DUR = 45;
export default function Quiz({ ranks, myDept, best = 0 }: { ranks: Row[]; myDept: string; best?: number }) {
  const qRef = useRef<HTMLDivElement>(null); const [rec, setRec] = useState(false); const watch = useRef(recordWatcher(best));
  const [state, setState] = useState<"idle" | "run" | "done">("idle");
  const [q, setQ] = useState<{ text: string; opts: string[]; ans: string; dept: string } | null>(null);
  const [score, setScore] = useState(0); const [combo, setCombo] = useState(0); const [left, setLeft] = useState(DUR); const [n, setN] = useState(0); const [ok, setOk] = useState(0); const [flash, setFlash] = useState<null | "ok" | "no">(null);
  const [mode, setMode] = useState<"all" | "mine">("all");
  const pool = useRef<number[]>([]); const timer = useRef<any>(null); const sc = useRef(0);
  useEffect(() => () => clearInterval(timer.current), []);
  const next = () => { if (!pool.current.length) pool.current = QUIZ.map((_, i) => i).filter(i => mode === "all" || (QUIZ[i][5] === myDept || (QUIZ[i][5] === "간호" && (myDept === "간호사" || myDept === "간호조무사")))).sort(() => Math.random() - .5); if (!pool.current.length) pool.current = QUIZ.map((_, i) => i);
    const [text, a, b, c, d, dept] = QUIZ[pool.current.pop()!]; setQ({ text, ans: a, dept, opts: [a, b, c, d].sort(() => Math.random() - .5) }); };
  const start = () => { setRec(false); watch.current = recordWatcher(best); sfx.level(); setScore(0); sc.current = 0; setCombo(0); setN(0); setOk(0); setLeft(DUR); setState("run"); pool.current = []; next();
    const t0 = Date.now(); timer.current = setInterval(() => { const l = DUR - Math.floor((Date.now() - t0) / 1000); setLeft(Math.max(0, l)); if (l <= 0) { clearInterval(timer.current); setState("done"); saveScore("quiz", sc.current).catch(() => {}); } }, 250); };
  const answer = (o: string) => { if (state !== "run" || !q) return; setN(x => x + 1);
    const el = qRef.current, r = el?.getBoundingClientRect(); const cx = r ? r.width / 2 : 0, cy = r ? r.height / 2 : 0;
    if (o === q.ans) { const c = combo + 1; setCombo(c); setOk(x => x + 1); const pts = 10 + Math.min(10, (c - 1) * 2); sc.current += pts; setFlash("ok"); sfx.ok(c); haptic(10); burst(el, cx, cy, "#5FA777", 8); pop(el, cx, cy, `+${pts}${c >= 3 ? ` ×${c}` : ""}`, c >= 5 ? "good big" : "good"); if (c % 5 === 0) sfx.combo(c); }
    else { setCombo(0); sc.current = Math.max(0, sc.current - 3); setFlash("no"); sfx.fail(); haptic([20, 30, 20]); shake(el, "m"); pop(el, cx, cy, q.ans, "bad"); }
    setScore(sc.current); watch.current(sc.current, () => { setRec(true); sfx.record(); setTimeout(() => setRec(false), 1400); }); setTimeout(() => setFlash(null), 250); next(); };
  return (
    <div className="card">
      <div><h3>의학용어 스피드 퀴즈</h3><div className="muted">45초 동안 4지선다. 정답 +10, 연속 정답 보너스(최대 +10), 오답 −3. 우리 파트 문제만 풀면 "파트 대항" 느낌으로. 300·500점 퀘스트. (문제 내용은 현직자 검수 중)</div></div>
      <div className="row"><button type="button" className="cats-btn" aria-pressed={mode === "all"} onClick={() => setMode("all")}>전체 문제</button><button type="button" className="cats-btn" aria-pressed={mode === "mine"} onClick={() => setMode("mine")}>[{myDept}] 문제만</button></div>
      <div className="def-bar"><span className="def-sun">📚 {score}점{combo >= 3 && <span className="tag" style={{ marginLeft: 6 }}>{combo} COMBO</span>}</span><span className="muted">{state === "run" ? `${left}초` : state === "done" ? `${ok}/${n} 정답` : `${QUIZ.length}문제 중 랜덤`}</span><BestLine best={best} cur={score} /></div>
      {state !== "run" ? <button type="button" className="btn retry" onClick={start}>{state === "done" ? (best && score < best ? `다시 도전 (최고까지 ${best - score}점)` : "다시 도전") : "시작"}</button> : q && (
        <div ref={qRef} className={"quiz" + (flash ? " " + flash : "")}>{rec && <RecordFlash />}
          <div className="quiz-q"><span className="tag">{q.dept}</span> {q.text}</div>
          <div className="quiz-opts">{q.opts.map(o => <button key={o} type="button" className="quiz-opt" onClick={() => answer(o)}>{o}</button>)}</div>
        </div>
      )}
      <Board title="퀴즈 명예의 전당" rows={ranks} fmt={r => r.value + "점"} />
    </div>
  );
}
