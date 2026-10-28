"use client";
/** 단계별 검 그림 — 단계가 오를수록 길어지고, 장식·문양·오라·입자·후광이 붙어요 */
const PAL: [string, string, string][] = [ // 날 밝은색, 날 어두운색, 기운색
  ["#9c7b5a", "#5b4636", "#000"], ["#b4bcc5", "#6b737c", "#000"], ["#d2d8df", "#7d8691", "#000"], ["#e3e8ed", "#8b96a3", "#9fb6cc"],
  ["#ffd9a0", "#ff7a2f", "#ff8a3d"], ["#ecfaff", "#6cc4ff", "#7fd3ff"], ["#eef2f6", "#9fb0c2", "#b8c7d6"], ["#d8dee4", "#4f5b66", "#9aa6b2"],
  ["#d9caff", "#6f4bff", "#8f6bff"], ["#f5ead0", "#b89b66", "#e8c98a"], ["#dcffdc", "#22c76a", "#3ddc84"], ["#ffc2c2", "#c2182b", "#ff3b4e"],
  ["#f2f6ff", "#7f98ff", "#9db1ff"], ["#ffe591", "#ff3d00", "#ff6a00"], ["#c7a6ff", "#2a0a4a", "#9b5cff"], ["#ffab8f", "#5a0f0f", "#ff4d2e"],
  ["#ffffff", "#bfe9ff", "#d8f3ff"], ["#fffbe6", "#ffcc4d", "#ffe28a"], ["#ffffff", "#ffd84d", "#fff0a0"], ["#b5fff3", "#079a9a", "#33ffe0"],
  ["#ff6b6b", "#7b61ff", "#ffffff"], ["#fff4b8", "#e8a400", "#ffd000"], ["#7a7a99", "#0b0b14", "#7b3cff"], ["#ffd6f2", "#b3127f", "#ff4fc3"],
  ["#ffd08f", "#8a1c00", "#ff7b00"], ["#cfd3d8", "#8a9099", "#fff6d0"], ["#d2f8bd", "#2f6b22", "#7dff5a"], ["#c8e8ff", "#24518f", "#5fb2ff"],
  ["#f0c8ff", "#00b8d4", "#d36bff"], ["#fffde6", "#ff7b00", "#ffd84d"],
];

function Blade({ l, id }: { l: number; id: string }) {
  const L = 150 + l * 3.2, w = 13 + l * .55, gw = 34 + l * 2.1, cx = 60, gy = 250, top = gy - L;
  const [c1, c2, glow] = PAL[l];
  const glass = l === 16, axe = l === 15, gem = l >= 5, wings = l >= 7, runes = l >= 10;
  const bladePath = l >= 17
    ? `M${cx} ${top} C${cx + w * .9} ${top + L * .25},${cx + w * .75} ${gy - 30},${cx + w * .55} ${gy} L${cx - w * .55} ${gy} C${cx - w * .75} ${gy - 30},${cx - w * .9} ${top + L * .25},${cx} ${top} Z`
    : `M${cx} ${top} L${cx + w / 2} ${top + w * 1.4} L${cx + w / 2} ${gy} L${cx - w / 2} ${gy} L${cx - w / 2} ${top + w * 1.4} Z`;
  return (
    <g>
      {axe ? <>
        <rect x={cx - 4} y={top + 10} width={8} height={L} rx={3} fill="#4a2a1a" />
        <path d={`M${cx + 3} ${top + 18} C${cx + 60} ${top - 6},${cx + 70} ${top + 70},${cx + 52} ${top + 96} C${cx + 30} ${top + 78},${cx + 14} ${top + 74},${cx + 3} ${top + 76} Z`} fill={`url(#b${id})`} stroke="#2a0606" strokeWidth={2} />
        <path d={`M${cx - 3} ${top + 24} C${cx - 40} ${top + 14},${cx - 46} ${top + 60},${cx - 34} ${top + 78} C${cx - 20} ${top + 66},${cx - 10} ${top + 64},${cx - 3} ${top + 66} Z`} fill={`url(#b${id})`} stroke="#2a0606" strokeWidth={2} />
        <path d={`M${cx} ${top - 6} L${cx + 6} ${top + 14} L${cx - 6} ${top + 14} Z`} fill={c1} />
      </> : <>
        <path d={bladePath} fill={`url(#b${id})`} fillOpacity={glass ? .35 : 1} stroke={glass ? "#fff" : "rgba(0,0,0,.35)"} strokeWidth={glass ? 1.6 : 1} />
        <path d={`M${cx} ${top + w * 1.6} L${cx} ${gy - 6}`} stroke={glass ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.55)"} strokeWidth={l >= 8 ? 2.2 : 1.4} />
        {l === 0 && [0.3, 0.55, 0.75].map(t => <circle key={t} cx={cx + (t - .5) * 6} cy={top + L * t} r={2.5} fill="#6b3f1d" opacity={.7} />)}
        {runes && Array.from({ length: Math.min(8, 2 + Math.floor((l - 10) / 2)) }, (_, i) => <rect key={i} x={cx - 1.6} y={top + w * 2 + i * (L - w * 3) / 8} width={3.2} height={7} rx={1} fill={glow} className="sw-rune" style={{ animationDelay: `${i * .18}s` }} />)}
      </>}
      {/* 가드 */}
      {wings
        ? <path d={`M${cx - gw / 2} ${gy + 2} C${cx - gw / 2 + 6} ${gy - 14},${cx - 10} ${gy - 4},${cx} ${gy - 8} C${cx + 10} ${gy - 4},${cx + gw / 2 - 6} ${gy - 14},${cx + gw / 2} ${gy + 2} C${cx + 10} ${gy + 10},${cx - 10} ${gy + 10},${cx - gw / 2} ${gy + 2} Z`} fill={`url(#g${id})`} stroke="rgba(0,0,0,.4)" />
        : <rect x={cx - gw / 2} y={gy - 3} width={gw} height={9} rx={3} fill={`url(#g${id})`} stroke="rgba(0,0,0,.35)" />}
      {gem && <circle cx={cx} cy={gy + 1} r={4 + l * .12} fill={glow === "#000" ? c2 : glow} stroke="#fff" strokeWidth={1} className={l >= 13 ? "sw-gem" : ""} />}
      {/* 손잡이 */}
      <rect x={cx - 5} y={gy + 7} width={10} height={44} rx={3} fill={l >= 18 ? "#3b2a10" : l >= 10 ? "#2b1d3a" : "#4a3020"} />
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${cx - 5} ${gy + 12 + i * 8} L${cx + 5} ${gy + 16 + i * 8}`} stroke={l >= 13 ? "#e8c35a" : "rgba(255,255,255,.25)"} strokeWidth={1.6} />)}
      <circle cx={cx} cy={gy + 55} r={6 + l * .1} fill={`url(#g${id})`} stroke="rgba(0,0,0,.4)" />
    </g>
  );
}

export default function SwordArt({ lv, size = 220 }: { lv: number; size?: number }) {
  const l = Math.max(0, Math.min(29, lv)), id = `sw${l}`, [c1, c2, glow] = PAL[l];
  const twin = l === 12 || l === 23, rainbow = l === 20;
  return (
    <svg viewBox="0 0 120 320" width={size * .375} height={size} className={"sw-svg" + (l >= 13 ? " sw-float" : "")} aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" x2="1" y1="0" y2="0">
          {rainbow ? ["#ff5a5a", "#ffb84d", "#fff36b", "#5cff8a", "#4dc3ff", "#7b61ff", "#ff6bf0"].map((c, i) => <stop key={i} offset={i / 6} stopColor={c} />) : <><stop offset="0" stopColor={c2} /><stop offset=".45" stopColor={c1} /><stop offset=".55" stopColor={c1} /><stop offset="1" stopColor={c2} /></>}
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={l >= 13 ? "#ffe9a3" : l >= 5 ? "#e0e6ec" : "#a68a6a"} /><stop offset="1" stopColor={l >= 13 ? "#b07d10" : l >= 5 ? "#6d7682" : "#5b4636"} /></linearGradient>
        <radialGradient id={`a${id}`}><stop offset="0" stopColor={glow} stopOpacity=".8" /><stop offset="1" stopColor={glow} stopOpacity="0" /></radialGradient>
        <filter id={`f${id}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={1 + l * .12} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {l >= 20 && <g className="sw-spin" style={{ transformOrigin: "60px 150px" }}><circle cx="60" cy="150" r="70" fill="none" stroke={glow} strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="6 8" /><circle cx="60" cy="150" r="58" fill="none" stroke={c1} strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 6" /></g>}
      {l >= 4 && glow !== "#000" && <ellipse cx="60" cy={250 - (150 + l * 3.2) / 2} rx={22 + l * 1.4} ry={(150 + l * 3.2) / 2 + 20} fill={`url(#a${id})`} className={l >= 13 ? "sw-aura" : ""} opacity={Math.min(1, .25 + l * .03)} />}
      {l === 29 && Array.from({ length: 12 }, (_, i) => <path key={i} d="M60 120 L64 20 L56 20 Z" fill="#ffd84d" opacity=".55" transform={`rotate(${i * 30} 60 120)`} className="sw-ray" />)}
      <g filter={l >= 4 ? `url(#f${id})` : undefined}>
        {twin ? <><g transform="rotate(-16 60 260) translate(-14 0)"><Blade l={l} id={id} /></g><g transform="rotate(16 60 260) translate(14 0)"><Blade l={l} id={id} /></g></> : <Blade l={l} id={id} />}
      </g>
      {l === 21 && [0, 1, 2].map(i => <path key={i} d={`M${30 + i * 30} ${60 + i * 20} l8 18 l-6 2 l10 20`} stroke="#fff6a0" strokeWidth="2" fill="none" className="sw-bolt" style={{ animationDelay: `${i * .4}s` }} />)}
      {l >= 16 && Array.from({ length: Math.min(14, 4 + (l - 16)) }, (_, i) => <circle key={i} cx={30 + ((i * 37) % 60)} cy={240 - ((i * 53) % 180)} r={1.4 + (i % 3) * .6} fill={rainbow ? ["#ff5a5a", "#fff36b", "#4dc3ff", "#ff6bf0"][i % 4] : glow} className="sw-spark" style={{ animationDelay: `${(i * .27) % 2.4}s` }} />)}
    </svg>
  );
}
