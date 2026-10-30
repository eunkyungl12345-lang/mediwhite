"use client";
import { useEffect, useRef, useState } from "react";
import { restBeat, restLeave, restDone, type RestView } from "@/lib/rest.actions";

/* ---------- 자연 소리 (파일 없이 WebAudio로 생성) ---------- */
type Snd = "rain" | "fire" | "wave" | "white" | null;
function makeSound(ctx: AudioContext, kind: Exclude<Snd, null>) {
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (kind === "white") d[i] = w * .25; else { last = (last + .02 * w) / 1.02; d[i] = last * 3.2; } }
  if (kind === "fire") for (let k = 0; k < 120; k++) { const p = Math.floor(Math.random() * (len - 300)); for (let j = 0; j < 260; j++) d[p + j] += (Math.random() * 2 - 1) * Math.exp(-j / 40) * .9; }
  if (kind === "rain") for (let k = 0; k < 900; k++) { const p = Math.floor(Math.random() * (len - 80)); for (let j = 0; j < 60; j++) d[p + j] += (Math.random() * 2 - 1) * Math.exp(-j / 8) * .35; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = kind === "rain" ? "highpass" : "lowpass"; f.frequency.value = kind === "rain" ? 900 : kind === "fire" ? 1400 : kind === "wave" ? 600 : 8000;
  const g = ctx.createGain(); g.gain.value = kind === "wave" ? .5 : .35;
  src.connect(f); f.connect(g); g.connect(ctx.destination);
  let lfo: OscillatorNode | null = null;
  if (kind === "wave") { lfo = ctx.createOscillator(); lfo.frequency.value = .09; const lg = ctx.createGain(); lg.gain.value = .45; lfo.connect(lg); lg.connect(g.gain); lfo.start(); }
  src.start(); return () => { try { src.stop(); lfo?.stop(); } catch {} };
}

/* ---------- 숨쉬기: 모두 같은 시계로 동기화 (4초 들숨 · 4초 멈춤 · 6초 날숨) ---------- */
const CYCLE = 14;
const breathPhase = (t: number) => { const x = (t / 1000) % CYCLE; return x < 4 ? { name: "들이마셔요", k: x / 4, left: 4 - x } : x < 8 ? { name: "잠깐 멈춰요", k: 1, left: 8 - x } : { name: "천천히 내쉬어요", k: 1 - (x - 8) / 6, left: CYCLE - x }; };

const STRETCH = [
  { t: "목 옆 늘리기", d: "오른손으로 머리를 감싸 오른쪽으로 천천히. 반대쪽도.", s: 20, i: "🙆" },
  { t: "어깨 으쓱 · 툭", d: "숨 들이쉬며 어깨를 귀까지 올렸다가, 내쉬며 툭 떨어뜨려요. 5번.", s: 20, i: "🤷" },
  { t: "손목 털기", d: "차팅·주사로 지친 손목. 양손을 가볍게 털고 손목 돌리기.", s: 15, i: "👐" },
  { t: "가슴 열기", d: "양손을 등 뒤로 깍지 끼고 가슴을 활짝. 고개는 살짝 위로.", s: 20, i: "🧘" },
  { t: "허리 비틀기", d: "의자에 앉아 등받이를 잡고 상체를 천천히 비틀어요. 양쪽.", s: 20, i: "🔄" },
  { t: "종아리 펌프", d: "서서 발뒤꿈치 들었다 내리기 15번. 오래 서 있던 다리에 혈액순환.", s: 20, i: "🦶" },
];
const MOODS = [
  { e: "😊", n: "괜찮아요", say: "좋아요! 오늘 그 마음, 잠깐 꺼내서 동료한테도 나눠 주세요. ☕ 건배 한 번 어때요?", rx: "숨쉬기 1분으로 좋은 기분 저장하기" },
  { e: "😮‍💨", n: "지쳤어요", say: "여기까지 버틴 거, 진짜 잘한 거예요. 지금은 아무것도 안 해도 돼요.", rx: "물 한 컵 + 어깨 으쓱 스트레칭" },
  { e: "😤", n: "화나요", say: "화날 만한 일이 있었나 봐요. 숨을 길게 내쉬면 몸이 먼저 진정돼요.", rx: "날숨 길게 숨쉬기 3번" },
  { e: "😢", n: "속상해요", say: "속상한 마음 그대로 괜찮아요. 혼자 삼키지 말고 믿을 만한 사람에게 한 줄만 털어놔도 가벼워져요.", rx: "토닥토닥 받기 + 빗소리 듣기" },
  { e: "😶", n: "멍해요", say: "머리가 꽉 찼을 땐 몸을 먼저 움직여 보세요. 생각은 그다음이에요.", rx: "3분 스트레칭" },
  { e: "😰", n: "많이 힘들어요", say: "많이 힘든 날이네요. 그 마음, 혼자 견디지 않아도 돼요.", rx: "아래 상담 번호도 같이 봐 주세요" },
];
const DCOL: Record<string, string> = { 간호사: "#F48FB1", 간호조무사: "#F8BBD0", 의사: "#5FA8E8", 방사선: "#9F8BE8", 물리치료: "#4FB59A", 임상병리: "#7ED69B", 응급구조: "#F2A900", 원무: "#3D5A80", 총괄: "#2B3245" };
const ACT: Record<string, { e: string; t: string }> = { cheers: { e: "☕", t: "커피 건배를 했어요" }, pat: { e: "🤝", t: "모두를 토닥토닥 했어요" }, bow: { e: "🙇", t: "\"오늘도 수고하셨습니다\"" } };

export default function RestRoom() {
  const [v, setV] = useState<RestView | null>(null), [now, setNow] = useState(Date.now()), [toast, setToast] = useState<string[]>([]);
  const [tool, setTool] = useState<"breath" | "stretch" | "mood" | null>(null), [snd, setSnd] = useState<Snd>(null);
  const [bStart, setBStart] = useState(0), [sIdx, setSIdx] = useState(-1), [sLeft, setSLeft] = useState(0), [mood, setMood] = useState<number | null>(null), [xpMsg, setXpMsg] = useState("");
  const seen = useRef<Record<string, number>>({}), audio = useRef<{ ctx: AudioContext; stop: () => void } | null>(null), breathing = useRef(false);

  const beat = async (act?: "cheers" | "pat" | "bow") => {
    try { const r = await restBeat(act ?? null, breathing.current); setV(r);
      for (const p of r.people) if (p.act && p.actAge < 18 && !p.me) { const key = p.nick + p.act + Math.floor(p.actAge / 18); if (!seen.current[p.nick + p.act] || Date.now() - seen.current[p.nick + p.act] > 17000) { seen.current[p.nick + p.act] = Date.now(); const msg = `${ACT[p.act].e} ${p.nick}님이 ${ACT[p.act].t}`; setToast(t => [...t.slice(-2), msg]); setTimeout(() => setToast(t => t.filter(x => x !== msg)), 5000); void key; } }
    } catch {}
  };
  useEffect(() => { beat(); const id = setInterval(() => beat(), 12000); const t = setInterval(() => setNow(Date.now()), 100); const bye = () => { restLeave().catch(() => {}); }; addEventListener("pagehide", bye);
    return () => { clearInterval(id); clearInterval(t); removeEventListener("pagehide", bye); bye(); audio.current?.stop(); audio.current?.ctx.close(); }; }, []); // eslint-disable-line

  const act = (a: "cheers" | "pat" | "bow") => { navigator.vibrate?.(15); const msg = `${ACT[a].e} 내가 ${ACT[a].t.replace("했어요", "했어요")}`; setToast(t => [...t.slice(-2), msg]); setTimeout(() => setToast(t => t.filter(x => x !== msg)), 3500); seen.current["me" + a] = Date.now(); beat(a); };
  const sound = (k: Snd) => { audio.current?.stop(); if (!k || k === snd) { setSnd(null); return; } const ctx = audio.current?.ctx ?? new AudioContext(); ctx.resume(); audio.current = { ctx, stop: makeSound(ctx, k) }; setSnd(k); };
  const done = async (k: "breath" | "stretch" | "mood") => { const xp = await restDone(k).catch(() => 0); setXpMsg(xp ? `🌿 오늘의 쉼 완료 +${xp} XP` : "🌿 오늘의 쉼 완료"); setTimeout(() => setXpMsg(""), 4000); };
  const startBreath = () => { setTool("breath"); setBStart(Date.now()); breathing.current = true; beat(); };
  const stopBreath = () => { breathing.current = false; setTool(null); beat(); };
  useEffect(() => { if (tool === "breath" && bStart && now - bStart >= 60000) { breathing.current = false; setBStart(0); done("breath"); beat(); } }, [now]); // eslint-disable-line
  useEffect(() => { if (tool !== "stretch" || sIdx < 0) return; if (sLeft <= 0) { if (sIdx + 1 < STRETCH.length) { setSIdx(sIdx + 1); setSLeft(STRETCH[sIdx + 1].s); navigator.vibrate?.(30); } else { setSIdx(STRETCH.length); done("stretch"); } return; } const t = setTimeout(() => setSLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [tool, sIdx, sLeft]); // eslint-disable-line

  const ph = breathPhase(now), people = v?.people ?? [], kst = new Date(now + 9 * 3600000).getUTCHours(), night = kst >= 21 || kst < 6;
  const seatXY = (i: number) => { const row = Math.floor(i / 6), col = i % 6; return { x: 60 + col * 72 + (row % 2) * 30, y: 196 + row * 26, s: .62 + row * .1 }; };
  return (
    <div className="rs">
      <div className="rs-scene">
        <svg viewBox="0 0 480 300" className="rs-svg" aria-label="당직실">
          <defs>
            <linearGradient id="rsw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={night ? "#1B2036" : "#3A3F55"} /><stop offset="1" stopColor={night ? "#2A2E44" : "#4B5068"} /></linearGradient>
            <linearGradient id="rsk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={night ? "#0B1433" : "#F2A65A"} /><stop offset="1" stopColor={night ? "#24366E" : "#7B5EA8"} /></linearGradient>
            <radialGradient id="rsl"><stop offset="0" stopColor="#FFD98A" stopOpacity=".55" /><stop offset="1" stopColor="#FFD98A" stopOpacity="0" /></radialGradient>
            <radialGradient id="rsb"><stop offset="0" stopColor="#9FE7FF" stopOpacity=".5" /><stop offset="1" stopColor="#9FE7FF" stopOpacity="0" /></radialGradient>
          </defs>
          <rect width="480" height="300" fill="url(#rsw)" />
          <rect x="150" y="26" width="180" height="96" rx="4" fill="url(#rsk)" />
          {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={155 + (i * 37) % 170} cy={30 + (i * 23) % 50} r={i % 5 ? .7 : 1.2} fill="#fff" opacity={night ? .8 : .2} />)}
          {Array.from({ length: 12 }, (_, i) => { const h = 20 + (i * 17) % 40; return <g key={i}><rect x={150 + i * 15} y={122 - h} width="14" height={h} fill="#141A30" />{Array.from({ length: Math.floor(h / 8) }, (_, k) => (i + k) % 3 === 0 ? <rect key={k} x={153 + i * 15} y={126 - h + k * 8} width="3" height="3" fill="#FFD98A" opacity=".8" /> : null)}</g>; })}
          {snd === "rain" && Array.from({ length: 30 }, (_, i) => <line key={i} x1={150 + (i * 29 + now / 6) % 180} y1={26 + (i * 41 + now / 3) % 96} x2={148 + (i * 29 + now / 6) % 180} y2={34 + (i * 41 + now / 3) % 96} stroke="#BFD9FF" strokeWidth=".8" opacity=".6" />)}
          <rect x="150" y="26" width="180" height="96" rx="4" fill="none" stroke="#8E95AE" strokeWidth="5" /><path d="M240 26 V122 M150 74 H330" stroke="#8E95AE" strokeWidth="3" />
          <path d="M140 20 q10 55 -2 108 h12 q-6 -50 4 -108 z M340 20 q-10 55 2 108 h-12 q6 -50 -4 -108 z" fill="#5B6488" />
          <g transform="translate(40 40)"><rect width="56" height="40" rx="3" fill="#0F1422" stroke="#3A4258" /><polyline points={Array.from({ length: 28 }, (_, k) => { const q = (k * 2 + now / 40) % 40; return `${k * 2},${q > 18 && q < 20 ? 6 : q >= 20 && q < 22 ? 32 : 20}`; }).join(" ")} fill="none" stroke="#3FD1E0" strokeWidth="1.4" transform="translate(0 0)" /><text x="50" y="10" fontSize="7" fill="#7CFF6A" textAnchor="end" fontFamily="monospace">72</text></g>
          <g transform="translate(420 70)"><path d="M0 0 h-16 l-8 26 h32 z" fill="#E9D3A7" /><rect x="-2" y="26" width="4" height="64" fill="#5A4632" /><ellipse cx="0" cy="40" rx="70" ry="60" fill="url(#rsl)" /></g>
          {snd === "fire" && <g transform="translate(410 160)"><rect x="-20" y="0" width="40" height="30" rx="3" fill="#2A1D15" />{[0, 1, 2].map(k => <path key={k} d={`M${-10 + k * 10} 2 q${-4 + Math.sin(now / 150 + k) * 3} -${12 + Math.sin(now / 90 + k) * 5} 4 -${20 + Math.sin(now / 120 + k) * 6} q4 10 4 20 z`} fill={k === 1 ? "#FFD36E" : "#FF8A3D"} opacity=".9" />)}</g>}
          <rect y="180" width="480" height="120" fill={night ? "#262A3C" : "#363B52"} />
          {Array.from({ length: 4 }, (_, r) => <rect key={r} x="20" y={188 + r * 26} width="440" height="3" rx="1.5" fill="#000" opacity=".15" />)}
          {tool === "breath" && <circle cx="240" cy="230" r={40 + ph.k * 70} fill="url(#rsb)" />}
          {[...people].sort((a, b) => a.seat - b.seat).map(p => { const { x, y, s } = seatXY(p.seat % 24), recent = p.act && p.actAge < 6, b = p.breathing ? breathPhase(now).k : 0, col = DCOL[p.dept ?? ""] ?? "#8E95AE";
            return <g key={p.nick} transform={`translate(${x} ${y}) scale(${s})`}>
              <ellipse cx="0" cy="34" rx="22" ry="5" fill="#000" opacity=".25" />
              <rect x="-24" y="10" width="48" height="22" rx="8" fill="#4B536E" />
              <g transform={`translate(0 ${recent && p.act === "bow" ? 6 : 0}) scale(${1 + b * .06})`}>
                <path d="M-15 30 Q-17 6 0 4 Q17 6 15 30 Z" fill={col} />
                <circle cx="0" cy="-8" r="12" fill="#F6D2B8" />
                <path d="M-12 -10 Q-10 -22 0 -21 Q11 -22 12 -10 Q6 -16 0 -15 Q-6 -16 -12 -10 Z" fill="#3B2A24" />
                {p.breathing ? <><path d="M-6 -8 q2 -1.5 4 0 M2 -8 q2 -1.5 4 0" stroke="#3B2A24" strokeWidth="1.2" fill="none" /></> : <><circle cx="-4" cy="-8" r="1.4" fill="#3B2A24" /><circle cx="4" cy="-8" r="1.4" fill="#3B2A24" /></>}
                <path d="M-3 -2 q3 2 6 0" stroke="#3B2A24" strokeWidth="1.1" fill="none" />
                {recent && p.act === "cheers" && <text x="16" y="4" fontSize="14">☕</text>}
                {recent && p.act === "pat" && <text x="14" y="-12" fontSize="13">🤝</text>}
              </g>
              {recent && <text x="0" y="-30" fontSize="14" textAnchor="middle">{ACT[p.act!].e}</text>}
              {p.me && <><rect x="-26" y="40" width="52" height="13" rx="6.5" fill="#F4EFE6" /><text x="0" y="49.5" fontSize="8" textAnchor="middle" fill="#3B2A24" fontWeight="700" fontFamily="sans-serif">나</text></>}
            </g>; })}
        </svg>
        <div className="rs-top"><span>🛋️ 당직실</span><span>👥 {people.length}명 쉬는 중{v && v.breathing > 0 ? ` · 🫁 ${v.breathing}명 함께 숨쉬는 중` : ""}</span></div>
        <div className="rs-toasts">{toast.map(t => <div key={t} className="rs-toast">{t}</div>)}</div>
        {tool === "breath" && <div className="rs-breath"><b>{ph.name}</b><span>{Math.ceil(ph.left)}</span><small>{bStart ? `${Math.max(0, 60 - Math.floor((now - bStart) / 1000))}초 남음` : "1분 완료! 계속 해도 좋아요"}</small></div>}
        {v && <div className="rs-me">나는 오늘 <b>{v.me}</b></div>}
      </div>

      <div className="rs-acts">
        <button type="button" onClick={() => act("cheers")}><span>☕</span>건배</button>
        <button type="button" onClick={() => act("pat")}><span>🤝</span>토닥토닥</button>
        <button type="button" onClick={() => act("bow")}><span>🙇</span>수고했어요</button>
      </div>

      <div className="rs-tools">
        <button type="button" className={tool === "breath" ? "on" : ""} onClick={() => tool === "breath" ? stopBreath() : startBreath()}><span>🫁</span><b>같이 숨쉬기 1분</b><small>{tool === "breath" ? "그만하기" : "접속한 모두와 같은 박자로"}</small></button>
        <button type="button" className={tool === "stretch" ? "on" : ""} onClick={() => { if (breathing.current) stopBreath(); setTool("stretch"); setSIdx(0); setSLeft(STRETCH[0].s); }}><span>🙆</span><b>3분 스트레칭</b><small>목·어깨·손목·허리·종아리</small></button>
        <button type="button" className={tool === "mood" ? "on" : ""} onClick={() => { if (breathing.current) stopBreath(); setTool("mood"); setMood(null); }}><span>💌</span><b>마음 체크인</b><small>지금 기분에 맞는 처방</small></button>
      </div>

      {tool === "stretch" && <div className="card rs-panel">
        {sIdx < STRETCH.length ? <><div className="rs-sh"><span className="rs-si">{STRETCH[sIdx].i}</span><div><b>{sIdx + 1}/{STRETCH.length} · {STRETCH[sIdx].t}</b><div className="muted">{STRETCH[sIdx].d}</div></div><span className="rs-sl">{sLeft}</span></div>
          <div className="rs-prog"><i style={{ width: `${(1 - sLeft / STRETCH[sIdx].s) * 100}%` }} /></div>
          <div className="row" style={{ gap: 6 }}><button type="button" className="btn ghost" onClick={() => setSLeft(0)}>다음 ›</button><button type="button" className="btn ghost" onClick={() => { setTool(null); setSIdx(-1); }}>그만</button></div></>
          : <div style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>🌿</div><b>스트레칭 완료!</b><div className="muted">몸이 조금 가벼워졌길 바라요. 물 한 컵 마시고 가요.</div></div>}
      </div>}

      {tool === "mood" && <div className="card rs-panel">
        <b>지금 마음은 어때요?</b>
        <div className="rs-moods">{MOODS.map((m, i) => <button key={m.n} type="button" className={mood === i ? "on" : ""} onClick={() => { setMood(i); done("mood"); }}><span>{m.e}</span>{m.n}</button>)}</div>
        {mood !== null && <div className="rs-rx">
          <div>{MOODS[mood].say}</div>
          <div className="rs-rxb">💊 오늘의 처방 · <b>{MOODS[mood].rx}</b></div>
          {mood === 5 && <div className="rs-help">마음이 많이 힘들 땐 전문가와 이야기해 보세요.<br /><b>정신건강 위기상담 ☎ 1577-0199</b> (24시간)<br />혼자 감당하기 어려운 생각이 든다면 <b>자살예방 상담 ☎ 109</b><br /><span className="muted">병원 직원도 이용할 수 있는 근로자지원(EAP)이 있는지 확인해 보세요.</span></div>}
          {(mood === 1 || mood === 2 || mood === 3) && <button type="button" className="btn ghost" onClick={startBreath}>🫁 지금 같이 숨쉬기</button>}
          {mood === 4 && <button type="button" className="btn ghost" onClick={() => { setTool("stretch"); setSIdx(0); setSLeft(STRETCH[0].s); }}>🙆 스트레칭 하러 가기</button>}
        </div>}
      </div>}

      <div className="rs-sounds"><span className="muted">🎧 배경 소리</span>{([["rain", "🌧️ 빗소리"], ["fire", "🔥 모닥불"], ["wave", "🌊 파도"], ["white", "📻 백색소음"]] as const).map(([k, n]) => <button key={k} type="button" className={snd === k ? "on" : ""} onClick={() => sound(k)}>{n}</button>)}</div>
      {xpMsg && <div className="rs-xp">{xpMsg}</div>}
      <div className="muted" style={{ fontSize: 12 }}>이름은 매일 바뀌는 익명 별명이에요. 숨쉬기·스트레칭·체크인 각각 하루 한 번 +20 XP. 여기는 잠깐 쉬어 가는 곳이고, 치료를 대신하지는 않아요.</div>
    </div>
  );
}
