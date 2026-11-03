"use client";
import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "./ambience";
/** 💧 수액 방울 명상 — 점적통에서 방울이 똑… 떨어질 때마다 천천히 내쉬어요. 100방울 = 수액 1팩 */
const GAP = 4200, TOTAL = 100;
export default function IVDrip({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [n, setN] = useState(0), [phase, setPhase] = useState(0), [tapOk, setTapOk] = useState(0);
  const ctx = useRef<AudioContext | null>(null), doneRef = useRef(false);
  const plip = (soft = 1) => { unlockAudio(); try { const c = ctx.current ?? new AudioContext(); ctx.current = c; c.resume(); const t = c.currentTime; const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(1100, t); o.frequency.exponentialRampToValueAtTime(420, t + .12); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12 * soft, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .35); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .4); } catch {} };
  useEffect(() => { const t0 = performance.now(); let raf = 0, last = 0;
    const loop = () => { raf = requestAnimationFrame(loop); const el = performance.now() - t0, k = Math.floor(el / GAP); setPhase((el % GAP) / GAP); if (k > last) { last = k; setN(x => { const nx = Math.min(TOTAL, x + 1); if (nx >= TOTAL && !doneRef.current) { doneRef.current = true; onDone(); } return nx; }); plip(.8); try { navigator.vibrate?.(6); } catch {} } };
    loop(); return () => { cancelAnimationFrame(raf); ctx.current?.close(); }; }, []); // eslint-disable-line
  const fill = 1 - n / TOTAL, dropY = phase < .8 ? 0 : (phase - .8) / .2; // 0~0.8 방울 맺힘, 0.8~1 떨어짐
  const swell = Math.min(1, phase / .8);
  const msg = phase < .45 ? "천천히 들이쉬고…" : phase < .8 ? "잠깐 멈추고…" : "똑. 길게 내쉬어요";
  return <div className="iv" onClick={() => { if (phase > .75) { setTapOk(k => k + 1); plip(1.2); } }}>
    <button type="button" className="iv-x" onClick={e => { e.stopPropagation(); onClose(); }} aria-label="닫기">✕</button>
    <svg viewBox="0 0 200 360" className="iv-svg" aria-label="수액">
      <defs><linearGradient id="ivf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#CFEFFF" stopOpacity=".9" /><stop offset="1" stopColor="#8FD3F5" stopOpacity=".95" /></linearGradient></defs>
      <path d="M100 8 v14" stroke="#9AA5B1" strokeWidth="3" /><circle cx="100" cy="8" r="5" fill="none" stroke="#9AA5B1" strokeWidth="3" />
      <path d="M58 24 h84 q8 0 8 8 v120 q0 14 -14 18 l-22 8 h-28 l-22 -8 q-14 -4 -14 -18 v-120 q0 -8 8 -8 z" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.7)" strokeWidth="2" />
      <clipPath id="ivc"><path d="M58 24 h84 q8 0 8 8 v120 q0 14 -14 18 l-22 8 h-28 l-22 -8 q-14 -4 -14 -18 v-120 q0 -8 8 -8 z" /></clipPath>
      <rect x="50" y={30 + (1 - fill) * 140} width="100" height="160" fill="url(#ivf)" clipPath="url(#ivc)" />
      <rect x="70" y="60" width="60" height="26" rx="3" fill="rgba(255,255,255,.85)" /><text x="100" y="72" fontSize="9" textAnchor="middle" fill="#2C6B5E" fontWeight="800">쉼 수액 100</text><text x="100" y="82" fontSize="7" textAnchor="middle" fill="#5E6E68">1일 1팩 · 천천히</text>
      <rect x="92" y="178" width="16" height="16" fill="rgba(255,255,255,.6)" />
      <path d="M84 194 h32 l-3 70 q0 8 -13 8 q-13 0 -13 -8 z" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.75)" strokeWidth="2" />
      <ellipse cx="100" cy="258" rx="11" ry="4" fill="#8FD3F5" opacity=".9" />
      {dropY === 0 ? <ellipse cx="100" cy={200 + swell * 4} rx={2 + swell * 3} ry={2.5 + swell * 4} fill="#BFE9FF" /> : <ellipse cx="100" cy={208 + dropY * 48} rx="4.5" ry="6" fill="#BFE9FF" opacity={1 - dropY * .3} />}
      {dropY > .9 && <ellipse cx="100" cy="257" rx={6 + (dropY - .9) * 80} ry="2" fill="none" stroke="#DFF6FF" strokeWidth="1.2" opacity={1 - (dropY - .9) * 8} />}
      <path d="M100 272 C100 300 130 310 120 352" stroke="rgba(255,255,255,.7)" strokeWidth="3" fill="none" />
      <rect x="111" y="300" width="16" height="10" rx="2" fill="#E9EEF2" transform="rotate(20 119 305)" />
    </svg>
    <div className="iv-msg">{msg}</div>
    <div className="iv-n"><b>{n}</b> / {TOTAL} 방울 {n >= TOTAL ? "· 수액 1팩 완료 🩹" : ""}</div>
    <div className="iv-bar"><i style={{ width: `${n / TOTAL * 100}%` }} /></div>
    <div className="iv-hint">방울이 떨어질 때 숨을 내쉬어요 · 떨어지는 순간 화면을 톡 누르면 맑은 소리{tapOk ? ` · 톡 ${tapOk}번` : ""}</div>
  </div>;
}
