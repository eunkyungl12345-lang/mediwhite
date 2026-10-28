/** 내 차 그림 (옆모습, 오른쪽 방향). 단계마다 차종·색·광택이 달라져요 */
type Spec = { paint: [string, string]; L: number; roofH: number; roofA: number; roofB: number; ride: number; wheel: number; rim: string; sport?: boolean; lux?: number; two?: string };
const SPECS: Spec[] = [
  { paint: ["#FFE066", "#E0A800"], L: 156, roofH: 40, roofA: .22, roofB: .8, ride: 8, wheel: 15, rim: "#C9CED6" },               // 경차
  { paint: ["#FFFFFF", "#C7CDD6"], L: 200, roofH: 34, roofA: .3, roofB: .72, ride: 8, wheel: 16, rim: "#B9C0CA" },               // 아반떼
  { paint: ["#5B6B82", "#26303F"], L: 214, roofH: 34, roofA: .3, roofB: .74, ride: 8, wheel: 17, rim: "#DDE2E8", lux: 1 },        // 그랜저
  { paint: ["#3A3F48", "#05070A"], L: 236, roofH: 35, roofA: .33, roofB: .76, ride: 8, wheel: 18, rim: "#E9EEF4", lux: 2 },       // G90
  { paint: ["#E6EAF0", "#8A94A3"], L: 236, roofH: 35, roofA: .33, roofB: .76, ride: 8, wheel: 18, rim: "#F4F6F9", lux: 2 },       // S클래스
  { paint: ["#FF4B3A", "#A30F0F"], L: 196, roofH: 32, roofA: .34, roofB: .7, ride: 8, wheel: 18, rim: "#2A2F38", sport: true },   // 911
  { paint: ["#1C2A4A", "#060B18"], L: 246, roofH: 39, roofA: .35, roofB: .78, ride: 9, wheel: 19, rim: "#F4F6F9", lux: 3, two: "#C9CED6" }, // 롤스
];
export default function CarArt({ tier }: { tier: number }) {
  const sp = SPECS[Math.max(0, Math.min(SPECS.length - 1, tier - 1))], id = "car" + tier;
  const W = 280, H = 110, x0 = (W - sp.L) / 2, x1 = x0 + sp.L, base = H - 16 - sp.ride, belt = base - 24, top = belt - sp.roofH;
  const ra = x0 + sp.L * sp.roofA, rb = x0 + sp.L * sp.roofB;
  const body = sp.sport
    ? `M${x0} ${base} L${x0} ${belt + 4} Q${x0 + 6} ${belt - 4} ${x0 + 30} ${belt - 6} L${ra} ${top + 6} Q${(ra + rb) / 2} ${top - 4} ${rb + 10} ${belt - 4} Q${x1 - 14} ${belt - 2} ${x1} ${belt + 8} L${x1} ${base} Z`
    : `M${x0} ${base - 2} L${x0} ${belt + 4} Q${x0 + 2} ${belt - 6} ${x0 + 24} ${belt - 8} L${ra - 8} ${belt - 9} C${ra + 8} ${top - 2} ${rb - 34} ${top - 5} ${rb - 8} ${top + 4} C${rb + 10} ${belt - 12} ${x1 - 34} ${belt - 9} ${x1 - 8} ${belt - 3} Q${x1 + 1} ${belt + 2} ${x1} ${belt + 12} L${x1 - 2} ${base - 2} Z`;
  const win = sp.sport
    ? `M${ra + 6} ${top + 10} Q${(ra + rb) / 2} ${top + 2} ${rb + 2} ${belt - 6} L${ra - 12} ${belt - 6} Z`
    : `M${ra} ${belt - 10} C${ra + 12} ${top + 4} ${rb - 32} ${top + 1} ${rb - 10} ${top + 8} L${rb + 6} ${belt - 10} Z`;
  const wx = [x0 + sp.L * .2, x1 - sp.L * .19];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="car-art" aria-hidden="true">
      <defs>
        <linearGradient id={id + "p"} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={sp.paint[0]} /><stop offset=".55" stopColor={sp.paint[1]} /><stop offset="1" stopColor={sp.paint[1]} /></linearGradient>
        <linearGradient id={id + "g"} x1="0" x2="1"><stop offset="0" stopColor="#0E1420" /><stop offset=".5" stopColor="#3B4A63" /><stop offset="1" stopColor="#0E1420" /></linearGradient>
        <radialGradient id={id + "h"}><stop offset="0" stopColor="#FFF8D6" /><stop offset="1" stopColor="#FFF8D6" stopOpacity="0" /></radialGradient>
        <linearGradient id={id + "r"} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <ellipse cx={W / 2} cy={H - 14} rx={sp.L * .56} ry="6" fill="#000" opacity=".45" />
      {/* 바닥 반사 */}
      <g transform={`translate(0 ${2 * (H - 16)}) scale(1 -1)`} opacity=".14"><path d={body} fill={`url(#${id}p)`} /></g>
      <path d={body} fill={`url(#${id}p)`} stroke="rgba(0,0,0,.55)" strokeWidth="1.2" />
      {sp.two && <path d={`M${x0 + 2} ${belt + 2} L${x1} ${belt + 8} L${x1} ${base} L${x0} ${base} Z`} fill={sp.two} opacity=".9" />}
      <path d={win} fill={`url(#${id}g)`} stroke="rgba(255,255,255,.35)" strokeWidth="1" />
      {!sp.sport && <path d={`M${(ra + rb) / 2 - 2} ${top + 4} L${(ra + rb) / 2 - 4} ${belt - 7}`} stroke={sp.paint[1]} strokeWidth="3" />}
      <path d={`M${x0 + 8} ${belt + 2} L${x1 - 8} ${belt + 6}`} stroke="url(#chrome)" strokeWidth={sp.lux ? 2 : 1} opacity=".9" style={{ stroke: sp.lux ? "#E9EEF4" : "rgba(255,255,255,.35)" }} />
      <path d={`M${x0 + 10} ${belt - 4} Q${W / 2} ${belt - 10} ${x1 - 16} ${belt}`} stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" />
      <path d={`M${x0 + 6} ${base - 4} L${x1 - 6} ${base - 4}`} stroke="rgba(0,0,0,.45)" strokeWidth="3" />
      {/* 문 라인 */}
      <path d={`M${(ra + rb) / 2 - 4} ${belt - 6} L${(ra + rb) / 2 - 2} ${base - 4}`} stroke="rgba(0,0,0,.35)" />
      {/* 헤드라이트·테일램프 */}
      <circle cx={x1 + 14} cy={belt + 10} r="18" fill={`url(#${id}h)`} />
      <path d={`M${x1 - 14} ${belt + 6} L${x1 - 1} ${belt + 8} L${x1 - 2} ${belt + 13} L${x1 - 14} ${belt + 11} Z`} fill="#FFF6C8" />
      <rect x={x0} y={belt + 4} width="7" height="6" rx="2" fill="#E2231A" />
      {(sp.lux ?? 0) >= 2 && <rect x={x1 - 6} y={belt + 12} width="6" height={base - belt - 16} rx="1.5" fill="#E9EEF4" stroke="#7A8594" strokeWidth=".8" />}
      {(sp.lux ?? 0) >= 3 && <path d={`M${x1 - 10} ${belt - 2} l3 -9 l3 9 z`} fill="#E9EEF4" />}
      {sp.sport && <path d={`M${x0 + 2} ${belt - 4} l-6 -6 h22 l2 6`} fill={sp.paint[1]} stroke="rgba(0,0,0,.5)" />}
      {wx.map(cx => <path key={"a" + cx} d={`M${cx - sp.wheel - 6} ${base} A${sp.wheel + 6} ${sp.wheel + 6} 0 0 1 ${cx + sp.wheel + 6} ${base} Z`} fill="#07090C" />)}
      {/* 바퀴 */}
      {wx.map(cx => <g key={cx}>
        <circle cx={cx} cy={base} r={sp.wheel + 3} fill="#0B0E13" />
        <circle cx={cx} cy={base} r={sp.wheel} fill="#151A22" />
        <circle cx={cx} cy={base} r={sp.wheel * .66} fill={sp.rim} stroke="#59626F" strokeWidth=".8" />
        {Array.from({ length: sp.lux ? 10 : 5 }, (_, k) => { const a = k / (sp.lux ? 10 : 5) * Math.PI * 2; return <path key={k} d={`M${cx} ${base} L${cx + Math.cos(a) * sp.wheel * .62} ${base + Math.sin(a) * sp.wheel * .62}`} stroke="#59626F" strokeWidth={sp.lux ? 1.2 : 2.2} />; })}
        <circle cx={cx} cy={base} r="3" fill="#2A2F38" />
        {sp.sport && <rect x={cx - 4} y={base - sp.wheel * .62} width="8" height="5" rx="1" fill="#F2B705" />}
      </g>)}
      <path d={body} fill={`url(#${id}r)`} />
    </svg>
  );
}
