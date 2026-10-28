"use client";
import { useEffect, useRef, useState } from "react";
import { saveScore } from "@/lib/actions";
import { TRIVIA, ECON, type Q } from "@/lib/speedQuiz";
import Board, { type Row } from "./Board";
import { sfx, haptic, shake, burst, pop, recordWatcher } from "@/lib/juice";
import { BestLine, RecordFlash } from "./Juice";

const DUR = 45;
const CFG = {
  trivia: { title: "일반 상식 스피드퀴즈", icon: "🧠", list: TRIVIA, desc: "45초 동안 4지선다. 정답 +10, 연속 정답 보너스(최대 +10), 오답 −3. 역사·과학·지리·생활 상식 랜덤! 300·500점 퀘스트." },
  econ: { title: "경제 스피드 뉴스", icon: "📈", list: ECON, desc: "뉴스 헤드라인으로 배우는 경제! 금리·환율·주식·세금·부동산 용어를 45초 동안 맞혀요. 틀리면 한 줄 해설이 나와요. 300·500점 퀘스트." },
} as const;
export default function SpeedQuiz({ kind, ranks, best = 0 }: { kind: "trivia" | "econ"; ranks: Row[]; best?: number }) {
  const C = CFG[kind], LIST: Q[] = C.list as Q[];
  const qRef = useRef<HTMLDivElement>(null); const [rec, setRec] = useState(false); const watch = useRef(recordWatcher(best));
  const [state, setState] = useState<"idle" | "run" | "done">("idle");
  const [q, setQ] = useState<{ text: string; opts: string[]; ans: string; note?: string } | null>(null);
  const [score, setScore] = useState(0), [combo, setCombo] = useState(0), [left, setLeft] = useState(DUR), [n, setN] = useState(0), [ok, setOk] = useState(0), [flash, setFlash] = useState<null | "ok" | "no">(null);
  const [note, setNote] = useState<{ q: string; a: string; t?: string } | null>(null), [missed, setMissed] = useState<{ q: string; a: string; t?: string }[]>([]);
  const pool = useRef<number[]>([]), timer = useRef<any>(null), sc = useRef(0);
  useEffect(() => () => clearInterval(timer.current), []);
  const next = () => { if (!pool.current.length) pool.current = LIST.map((_, i) => i).sort(() => Math.random() - .5);
    const [text, a, b, c, d, t] = LIST[pool.current.pop()!]; setQ({ text, ans: a, note: t || undefined, opts: [a, b, c, d].sort(() => Math.random() - .5) }); };
  const start = () => { setRec(false); watch.current = recordWatcher(best); sfx.level(); setScore(0); sc.current = 0; setCombo(0); setN(0); setOk(0); setLeft(DUR); setNote(null); setMissed([]); setState("run"); pool.current = []; next();
    const t0 = Date.now(); timer.current = setInterval(() => { const l = DUR - Math.floor((Date.now() - t0) / 1000); setLeft(Math.max(0, l)); if (l <= 0) { clearInterval(timer.current); setState("done"); saveScore(kind, sc.current).catch(() => {}); } }, 250); };
  const answer = (o: string) => { if (state !== "run" || !q) return; setN(x => x + 1);
    const el = qRef.current, r = el?.getBoundingClientRect(), cx = r ? r.width / 2 : 0, cy = r ? r.height / 2 : 0;
    if (o === q.ans) { const c = combo + 1; setCombo(c); setOk(x => x + 1); const pts = 10 + Math.min(10, (c - 1) * 2); sc.current += pts; setFlash("ok"); sfx.ok(c); haptic(10); burst(el, cx, cy, "#5FA777", 8); pop(el, cx, cy, `+${pts}${c >= 3 ? ` ×${c}` : ""}`, c >= 5 ? "good big" : "good"); setNote(null); }
    else { setCombo(0); sc.current = Math.max(0, sc.current - 3); setFlash("no"); sfx.fail(); haptic([20, 30, 20]); shake(el, "m"); pop(el, cx, cy, q.ans, "bad"); const m = { q: q.text, a: q.ans, t: q.note }; setNote(m); setMissed(x => [...x, m]); }
    setScore(sc.current); watch.current(sc.current, () => { setRec(true); sfx.record(); setTimeout(() => setRec(false), 1400); }); setTimeout(() => setFlash(null), 250); next(); };
  return (
    <div className="card">
      <div><h3>{C.icon} {C.title}</h3><div className="muted">{C.desc}</div></div>
      <div className="def-bar"><span className="def-sun">{C.icon} {score}점{combo >= 3 && <span className="tag" style={{ marginLeft: 6 }}>{combo} COMBO</span>}</span><span className="muted">{state === "run" ? `${left}초` : state === "done" ? `${ok}/${n} 정답` : `${LIST.length}문제 중 랜덤`}</span><BestLine best={best} cur={score} /></div>
      {state !== "run" ? <button type="button" className="btn retry" onClick={start}>{state === "done" ? (best && score < best ? `다시 도전 (최고까지 ${best - score}점)` : "다시 도전") : "시작"}</button> : q && (
        <div ref={qRef} className={"quiz" + (flash ? " " + flash : "")}>{rec && <RecordFlash />}
          <div className="quiz-q">{q.text}</div>
          <div className="quiz-opts">{q.opts.map(o => <button key={o} type="button" className="quiz-opt" onClick={() => answer(o)}>{o}</button>)}</div>
          {note && <div className="quiz-note"><span className="muted">❌ 방금 문제: {note.q}</span><span>정답 <b>{note.a}</b>{note.t ? ` — ${note.t}` : ""}</span></div>}
        </div>
      )}
      {state === "done" && missed.length > 0 && <details className="quiz-review"><summary>📝 틀린 문제 다시 보기 ({missed.length})</summary>{missed.map((m, i) => <div key={i} className="quiz-note"><div>{m.q}</div><b>→ {m.a}</b>{m.t ? <div className="muted">{m.t}</div> : null}</div>)}</details>}
      <Board title={`${C.title} 명예의 전당`} rows={ranks} fmt={r => r.value + "점"} />
    </div>
  );
}
