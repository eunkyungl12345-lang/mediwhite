"use client";
import { HOMES, SLOTS } from "@/lib/tycoon";

/** 내 집 거실 (앞에서 본 단면). 집 등급·가구 단계마다 바뀌고, 아직 없는 가구 자리는 점선으로 보여요 */
type V = "wall" | "alley" | "city" | "river" | "nightriver" | "garden";
function View({ v, w, h, id }: { v: V; w: number; h: number; id: string }) {
  const night = v === "nightriver";
  const sky = night ? ["#0B1433", "#2B3F7A"] : v === "wall" ? ["#9AA3AD", "#C9CED4"] : v === "garden" ? ["#7CC4F2", "#E8F7FF"] : ["#6FB6EC", "#DCF1FF"];
  const towers = (n: number, base: number, col: string, lit: string, seed: number, maxH: number) => Array.from({ length: n }, (_, i) => { const bw = w / n * (.7 + ((i * 7 + seed) % 5) / 10), x = i * w / n, bh = h * (.18 + (((i * 53 + seed) % 11) / 11) * maxH); return <g key={i}><rect x={x} y={base - bh} width={bw} height={bh} fill={col} />{Array.from({ length: Math.floor(bh / 6) }, (_, k) => Array.from({ length: Math.max(1, Math.floor(bw / 6)) }, (_, j) => ((i + k * 3 + j * 5 + seed) % (night ? 3 : 7)) === 0 ? <rect key={k + "-" + j} x={x + 1.5 + j * 6} y={base - bh + 2 + k * 6} width="3" height="2.6" fill={lit} opacity={night ? .95 : .5} /> : null))}</g>; });
  return (
    <g>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient></defs>
      <rect width={w} height={h} fill={`url(#${id})`} />
      {night ? <>{Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 47) % w} cy={(i * 29) % (h * .45)} r={i % 4 ? .6 : 1.1} fill="#fff" opacity={.4 + (i % 3) * .2} />)}<circle cx={w * .82} cy={h * .16} r="7" fill="#FFF4D6" /><circle cx={w * .82 + 3} cy={h * .16 - 2} r="6" fill="#0F1A3D" /></>
        : v !== "wall" && <><circle cx={w * .85} cy={h * .14} r="9" fill="#FFF3B0" opacity=".9" /><ellipse cx={w * .25} cy={h * .18} rx={w * .14} ry="5" fill="#fff" opacity=".85" /><ellipse cx={w * .55} cy={h * .1} rx={w * .1} ry="3.5" fill="#fff" opacity=".7" /></>}
      {v === "wall" && <>{Array.from({ length: Math.ceil(h / 8) }, (_, r) => Array.from({ length: Math.ceil(w / 18) + 1 }, (_, c) => <rect key={r + "-" + c} x={c * 18 - (r % 2) * 9} y={r * 8} width="17" height="7" fill={["#9C6B52", "#8E5E47", "#A8775C"][(r + c) % 3]} />))}<rect x={w * .6} y={h * .2} width="10" height={h * .8} fill="#5A5A5A" opacity=".6" /></>}
      {v === "alley" && <>{towers(5, h, "#C9B8A0", "#FFF", 2, .35)}<rect y={h * .82} width={w} height={h * .18} fill="#8A8F96" /><path d={`M0 ${h * .3} Q${w / 2} ${h * .36} ${w} ${h * .28}`} stroke="#333" strokeWidth=".8" fill="none" /><path d={`M0 ${h * .4} Q${w / 2} ${h * .45} ${w} ${h * .38}`} stroke="#333" strokeWidth=".8" fill="none" /></>}
      {v === "city" && <>{towers(9, h, "#A8B6C8", "#FFFFFF", 4, .55)}{towers(6, h, "#7E8FA6", "#FFF6C2", 1, .7)}</>}
      {(v === "river" || night) && <>
        <path d={`M${w * .1} ${h * .62} L${w * .3} ${h * .3} L${w * .5} ${h * .62} Z`} fill={night ? "#16234A" : "#7FA36A"} />
        <path d={`M${w * .24} ${h * .38} v-${h * .2} l3 -6 l3 6 v${h * .2} z`} fill={night ? "#2E3F70" : "#E9EEF4"} />{night && <circle cx={w * .24 + 3} cy={h * .14} r="2.4" fill="#FF6B6B" />}
        {towers(10, h * .64, night ? "#1B2747" : "#9FB5CB", night ? "#FFD36E" : "#FFFFFF", 6, .4)}
        <rect y={h * .64} width={w} height={h * .36} fill={night ? "#0D1838" : "#4F9BD1"} />
        <path d={`M0 ${h * .7} H${w}`} stroke={night ? "#33456E" : "#7E8FA6"} strokeWidth="3" />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * w / 9} ${h * .7} q${w / 18} -${h * .1} ${w / 9} 0`} fill="none" stroke={night ? "#FFD36E" : "#7E8FA6"} strokeWidth="1.2" opacity={night ? .9 : 1} />)}
        {night && Array.from({ length: 18 }, (_, i) => <rect key={i} x={(i * 37) % w} y={h * .74 + (i % 4) * h * .05} width={6 + (i % 3) * 4} height="1.4" fill={["#FFD36E", "#FF8A8A", "#9FE0FF"][i % 3]} opacity=".7" className="hm-shimmer" style={{ animationDelay: `${(i % 6) * .4}s` }} />)}
        {!night && [.15, .45, .8].map(t => <path key={t} d={`M${w * t} ${h * .85} h10`} stroke="#fff" strokeWidth="1.2" opacity=".8" />)}</>}
      {v === "garden" && <>
        <path d={`M0 ${h * .55} Q${w * .3} ${h * .38} ${w * .6} ${h * .5} Q${w * .85} ${h * .42} ${w} ${h * .5} V${h} H0 Z`} fill="#7FB86A" />
        <rect y={h * .66} width={w} height={h * .34} fill="#8CCB6E" />
        {Array.from({ length: 6 }, (_, i) => <g key={i}><rect x={w * (.08 + i * .17)} y={h * .44} width="3" height={h * .24} fill="#6B4A2B" /><circle cx={w * (.08 + i * .17) + 1.5} cy={h * .42} r={h * .13} fill={["#4F8F3A", "#5DA046", "#3E7E2E"][i % 3]} /></g>)}
        <ellipse cx={w * .5} cy={h * .86} rx={w * .12} ry={h * .05} fill="#9FD8F5" stroke="#C9CED4" strokeWidth="2" /><rect x={w * .5 - 2} y={h * .7} width="4" height={h * .15} fill="#C9CED4" /><path d={`M${w * .5} ${h * .7} q-8 -8 -14 4 M${w * .5} ${h * .7} q8 -8 14 4`} stroke="#BFE7FF" strokeWidth="1.4" fill="none" />
        {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={(i * 31) % w} cy={h * .92 + (i % 3) * 2} r="2" fill={["#FF8FAB", "#FFD36E", "#FFFFFF", "#C9A2FF"][i % 4]} />)}</>}
    </g>
  );
}

/** 집 등급별 구조물 */
function Struct({ home, W, FY, dark }: { home: number; W: number; FY: number; dark: boolean }) {
  const ceil = [34, 24, 16, 12, 10, 0, 0, 0, 0, 0][home];
  return (
    <g>
      {ceil > 0 && <><rect width={W} height={ceil} fill={home === 0 ? "#8F887A" : "#E9E4DA"} /><rect y={ceil} width={W} height="3" fill="#00000022" /></>}
      {home === 0 && <g>
        <path d="M0 22 H480" stroke="#6E6A62" strokeWidth="6" /><path d="M0 30 H480" stroke="#7E7A70" strokeWidth="3" />
        <path d="M240 34 v22" stroke="#222" /><circle cx="240" cy="60" r="5" fill="#FFE9A0" />
        <path d="M120 70 Q200 84 330 66" stroke="#555" fill="none" /><rect x="150" y="74" width="16" height="22" fill="#9FC5E8" /><rect x="190" y="78" width="14" height="18" fill="#F4A261" /><rect x="280" y="72" width="18" height="20" fill="#E9EEF4" />
        <rect x="300" y="150" width="56" height="40" fill="#8A7A5A" /><rect x="304" y="140" width="30" height="12" fill="#2B3245" /><rect x="306" y="142" width="26" height="8" fill="#9FD3F5" />
        <text x="420" y="60" fontSize="7" fill="#4A4639" fontFamily="sans-serif" transform="rotate(-4 420 60)">공용샤워실 →</text>
      </g>}
      {home === 1 && <g>
        <rect x="320" y="26" width="150" height="34" fill="#F2EEE6" stroke="#D2C8B7" />{[0, 1, 2].map(i => <path key={i} d={`M${320 + (i + 1) * 50} 26 v34`} stroke="#D2C8B7" />)}
        <rect x="300" y="110" width="30" height="84" rx="3" fill="#E9EEF4" stroke="#BFC6CE" /><path d="M300 140 h30" stroke="#BFC6CE" />
        <g transform="translate(130 150)"><path d="M0 0 h40 M4 0 v40 M36 0 v40 M0 14 h40" stroke="#9AA3AD" strokeWidth="1.5" /><rect x="6" y="2" width="10" height="12" fill="#F4A261" /><rect x="20" y="2" width="12" height="10" fill="#9FC5E8" /></g>
      </g>}
      {home === 2 && <g>
        <rect x="380" y="24" width="70" height="20" rx="4" fill="#FFFFFF" stroke="#C9CED4" /><path d="M386 38 h58" stroke="#C9CED4" />
        {[90, 240, 400].map(x => <circle key={x} cx={x} cy="20" r="3" fill="#FFF3C8" stroke="#D8D0C2" />)}
        <rect x="128" y="70" width="34" height="122" fill="#EDE7DA" stroke="#C9BFAE" /><circle cx="156" cy="132" r="2" fill="#8A7A62" /><rect x="132" y="84" width="10" height="14" rx="2" fill="#2B3245" />
      </g>}
      {home === 3 && <g>
        <rect x="160" y="36" width="240" height="120" fill="none" stroke="#C9C3B8" strokeWidth="6" /><path d="M160 128 H400" stroke="#9AA3AD" strokeWidth="2" />{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${170 + i * 20} 128 v26`} stroke="#9AA3AD" strokeWidth="1.5" />)}
        <rect x="408" y="104" width="30" height="88" rx="4" fill="#FFFFFF" stroke="#C9CED4" /><path d="M412 116 h22 M412 122 h22" stroke="#C9CED4" />
      </g>}
      {home === 4 && <g>
        <rect x="350" y="22" width="120" height="170" fill="#EFE8DC" /><rect x="350" y="22" width="120" height="170" fill="none" stroke="#D8CFC0" strokeWidth="4" />
        <rect x="358" y="34" width="104" height="30" fill="#FFFFFF" stroke="#D8D0C2" /><rect x="358" y="120" width="104" height="10" fill="#C9C3B8" /><rect x="358" y="130" width="104" height="62" fill="#FFFFFF" stroke="#D8D0C2" />
        <path d="M410 22 v30" stroke="#333" /><path d="M398 60 q12 -14 24 0 z" fill="#2A2F38" />
      </g>}
      {home === 5 && <g>
        <rect x="14" y="20" width="110" height="172" fill="#5B4632" />{Array.from({ length: 5 }, (_, r) => <g key={r}><rect x="18" y={28 + r * 33} width="102" height="3" fill="#3E2F22" />{Array.from({ length: 9 }, (_, i) => <rect key={i} x={22 + i * 11} y={8 + r * 33 + (i % 3) * 3} width="8" height={20 - (i % 3) * 3} fill={["#E76F51", "#2A9D8F", "#E9C46A", "#264653", "#F4A261"][(i + r) % 5]} />)}</g>)}
      </g>}
      {home === 6 && <g>
        <rect x="300" y="168" width="150" height="24" rx="4" fill="#F4F1EA" stroke="#D8D0C2" /><rect x="300" y="160" width="150" height="10" rx="3" fill="#E9E4DA" />{[318, 352, 386, 420].map(x => <g key={x}><rect x={x} y="176" width="14" height="4" fill="#2A2F38" /><rect x={x + 6} y="180" width="2" height="12" fill="#2A2F38" /></g>)}
        <rect x="40" y="20" width="80" height="120" rx="40" fill="#EDE7DA" stroke="#D8D0C2" /><ellipse cx="80" cy="44" rx="30" ry="10" fill="#FFF3C8" opacity=".6" />
      </g>}
      {home >= 7 && <g>
        {/* 복층: 위층 난간 */}
        <rect x="0" y="0" width={W} height="10" fill={dark ? "#14110E" : "#F6F3EE"} />
        <rect x={home === 8 ? 300 : 330} y="62" width={W - (home === 8 ? 300 : 330)} height="8" fill={dark ? "#2E2A26" : "#D8CFC0"} />
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${(home === 8 ? 304 : 334) + i * 20} 34 v28`} stroke={dark ? "#9AA3AD" : "#B8A880"} strokeWidth={home === 8 ? 1 : 2} />)}
        <path d={`M${home === 8 ? 300 : 330} 34 H${W}`} stroke={dark ? "#C9D1DC" : "#8A7A62"} strokeWidth="3" />
        {home === 8 && <rect x="300" y="34" width={W - 300} height="28" fill="#BFE3FF" opacity=".15" />}
        {/* 계단 */}
        {Array.from({ length: 7 }, (_, i) => <rect key={i} x={home === 9 ? 300 + i * 12 : 280 + i * 8} y={70 + i * 17} width={home === 9 ? 46 : 40} height="5" rx="1" fill={dark ? "#3A342E" : home === 9 ? "#EFE9DD" : "#C9A27A"} stroke={dark ? "#C9D1DC" : "#9A8A6A"} strokeWidth=".6" />)}
        {home !== 8 && <path d={home === 9 ? "M300 70 L384 189" : "M280 70 L336 189"} stroke="#8A7A62" strokeWidth="2" />}
        {home === 8 && <g><rect x="30" y="150" width="90" height="42" rx="4" fill="#1E1A16" stroke="#C9A227" /><rect x="30" y="146" width="90" height="6" fill="#C9A227" />{[44, 60, 76, 92].map(x => <rect key={x} x={x} y="120" width="8" height="22" rx="2" fill={["#7FB3C8", "#C9A227", "#9A3B3B", "#7FB069"][(x / 16) % 4 | 0]} opacity=".85" />)}</g>}
        {home === 9 && <g>{[132, 448].map(x => <g key={x}><rect x={x - 8} y="10" width="16" height="182" fill="#F4F1EA" stroke="#D8CFC0" /><rect x={x - 12} y="10" width="24" height="8" fill="#E9E2D6" /><rect x={x - 12} y="184" width="24" height="8" fill="#E9E2D6" /></g>)}
          <path d="M150 26 Q240 -6 330 26" fill="none" stroke="#D8CFC0" strokeWidth="5" /></g>}
        {home === 7 && <path d="M160 36 Q215 6 270 36 M280 36 Q335 6 390 36" fill="none" stroke="#D8CFC0" strokeWidth="5" />}
      </g>}
    </g>
  );
}

const Ph = ({ x, y, w, h, label, icon, on }: { x: number; y: number; w: number; h: number; label: string; icon: string; on?: () => void }) => (
  <g className="hm-ph" onClick={on} style={{ cursor: on ? "pointer" : undefined }}><rect x={x} y={y} width={w} height={h} rx="6" fill="rgba(255,255,255,.12)" stroke="#E7B93C" strokeWidth="2" strokeDasharray="5 4" />
    <circle cx={x + w / 2} cy={y + h / 2 - 3} r="10" fill="#C98A2E" stroke="#fff" strokeWidth="1.6" /><text x={x + w / 2} y={y + h / 2 + 1} fontSize="11" textAnchor="middle">{icon}</text>
    <text x={x + w / 2} y={y + h / 2 + 18} fontSize="8" textAnchor="middle" fill="#5A4520" fontWeight="700" fontFamily="sans-serif">{label}</text></g>);

export default function HomeRoom({ home, items, onSlot }: { home: number; items: Record<string, number>; onSlot?: (cat: "furn" | "art") => void }) {
  const h = HOMES[home], W = 480, H = 300, FY = 196, id = "hm" + home;
  const tier = (k: string) => items[k] ?? 0;
  const lux = home >= 5, dark = home === 8, glassWall = home >= 8;
  const wins = home === 0 ? [{ x: 200, y: 50, w: 70, h: 56 }] : glassWall ? [{ x: 150, y: 26, w: 300, h: FY - 30 }] : home >= 5 ? [{ x: 160, y: 34, w: 120, h: 130 }, { x: 300, y: 34, w: 120, h: 130 }] : home >= 2 ? [{ x: 170, y: 46, w: 100, h: 100 }, { x: 290, y: 46, w: 100, h: 100 }] : [{ x: 210, y: 50, w: 110, h: 90 }];
  const wood = dark ? ["#2E2A26", "#3A342E"] : home >= 6 ? ["#E8E2D6", "#F2EEE6"] : [h.floor, h.floor];
  const go = (c: "furn" | "art") => onSlot ? () => onSlot(c) : undefined;
  const sofa = tier("sofa"), tv = tier("tv"), table = tier("table"), bed = tier("bed"), light = tier("light"), plant = tier("plant"), art = tier("art"), sculpt = tier("sculpt");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hm-svg" aria-label={`${h.area} ${h.name}`}>
      <defs>
        <linearGradient id={id + "w"} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={h.wall} /><stop offset="1" stopColor={h.wall} stopOpacity=".85" /></linearGradient>
        <linearGradient id={id + "f"} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={wood[1]} /><stop offset="1" stopColor={wood[0]} /></linearGradient>
        <radialGradient id={id + "l"}><stop offset="0" stopColor="#FFF3C8" stopOpacity=".55" /><stop offset="1" stopColor="#FFF3C8" stopOpacity="0" /></radialGradient>
        <linearGradient id={id + "g"} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".3" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".15" /></linearGradient>
      </defs>
      <rect width={W} height={FY} fill={`url(#${id}w)`} />
      {home >= 4 && <><rect y="0" width={W} height="10" fill="#fff" opacity=".7" /><rect y="10" width={W} height="3" fill={dark ? "#4A4038" : "#D8D0C2"} />{!glassWall && Array.from({ length: 4 }, (_, i) => <rect key={i} x={14 + i * 120} y={FY - 58} width="100" height="46" rx="2" fill="none" stroke={dark ? "#4A4038" : "#D8CFC0"} strokeWidth="1.5" />)}</>}
      {home === 0 && <><path d="M30 40 l20 60 M420 30 l-14 50" stroke="#B5AE9E" strokeWidth="1" /><rect x="60" y="120" width="40" height="30" fill="#CFC6AF" opacity=".6" /></>}
      {/* 창문 + 커튼 */}
      {wins.map((wd, i) => <g key={i}>
        <svg x={wd.x} y={wd.y} width={wd.w} height={wd.h} viewBox={`0 0 ${wd.w} ${wd.h}`}><View v={h.view} w={wd.w} h={wd.h} id={id + "v" + i} /><rect width={wd.w} height={wd.h} fill={`url(#${id}g)`} /></svg>
        <rect x={wd.x} y={wd.y} width={wd.w} height={wd.h} fill="none" stroke={glassWall ? "#3A3F48" : "#FFFFFF"} strokeWidth={glassWall ? 3 : 5} />
        {glassWall ? <path d={`M${wd.x + wd.w / 3} ${wd.y} V${wd.y + wd.h} M${wd.x + wd.w * 2 / 3} ${wd.y} V${wd.y + wd.h}`} stroke="#3A3F48" strokeWidth="2" /> : <path d={`M${wd.x + wd.w / 2} ${wd.y} V${wd.y + wd.h}`} stroke="#FFFFFF" strokeWidth="3" />}
        {home >= 2 && <><path d={`M${wd.x - 16} ${wd.y - 8} q8 ${wd.h / 2} -2 ${wd.h + 14} h14 q-6 -${wd.h / 2} 2 -${wd.h + 14} z`} fill={dark ? "#3A3F55" : home >= 5 ? "#3F4A5E" : "#E8D9C0"} /><path d={`M${wd.x + wd.w + 16} ${wd.y - 8} q-8 ${wd.h / 2} 2 ${wd.h + 14} h-14 q6 -${wd.h / 2} -2 -${wd.h + 14} z`} fill={dark ? "#3A3F55" : home >= 5 ? "#3F4A5E" : "#E8D9C0"} /><rect x={wd.x - 20} y={wd.y - 12} width={wd.w + 40} height="4" rx="2" fill="#8A7A62" /></>}
      </g>)}
      {/* 집마다 다른 구조 (천장 높이 · 옆벽 원근 · 붙박이 구조물) */}
      <Struct home={home} W={W} FY={FY} dark={dark} />
      {/* 벽난로 (저택) */}
      {home === 9 && <g><rect x="12" y="96" width="80" height="100" fill="#EDE6DA" stroke="#C9BFAE" /><rect x="26" y="130" width="52" height="66" fill="#2A221C" /><path d="M38 196 q6 -24 14 -10 q4 -16 12 0 q6 -10 6 10 z" fill="#FF8A1A" className="hm-fire" /><path d="M44 196 q4 -12 8 -4 q4 -8 8 4 z" fill="#FFE066" className="hm-fire" /><rect x="6" y="90" width="92" height="8" fill="#D8CFC0" /></g>}
      {/* 벽 그림 */}
      {art ? <g><rect x={home === 9 ? 18 : 40} y={home === 9 ? 30 : 46} width={56 + art * 6} height={40 + art * 4} fill={art >= 4 ? "#C9A227" : "#6B4A2B"} rx="2" />
          <rect x={(home === 9 ? 18 : 40) + 4} y={(home === 9 ? 30 : 46) + 4} width={48 + art * 6} height={32 + art * 4} fill={["#F4E9D8", "#E9C46A", "#F4A261", "#264653", "#2A2A2A"][art - 1]} />
          {art === 1 && <path d="M50 80 l12 -14 l10 10 l8 -6 l12 12" stroke="#2A9D8F" strokeWidth="2" fill="none" />}
          {art === 2 && <><circle cx="64" cy="66" r="8" fill="#E76F51" /><path d="M48 84 Q66 70 96 84" fill="#2A9D8F" /></>}
          {art === 3 && <>{[0, 1, 2, 3].map(i => <rect key={i} x={50 + (i % 2) * 22} y={56 + Math.floor(i / 2) * 18} width="20" height="16" fill={["#FFD23F", "#EE4266", "#3BCEAC", "#540D6E"][i]} />)}</>}
          {art === 4 && <rect x="56" y="60" width="48" height="26" fill="#E9E4D8" opacity=".25" />}
          {art === 5 && <><circle cx="70" cy="70" r="12" fill="#E63946" /><rect x="86" y="58" width="16" height="30" fill="#1D3557" /><path d="M52 92 L110 60" stroke="#F1FAEE" strokeWidth="3" /></>}</g>
        : <Ph x={40} y={46} w={70} h={56} label="그림" icon="🖼️" on={go("art")} />}
      {/* 조명 */}
      {light ? <g>{light === 3 ? <><path d="M240 13 v14" stroke="#C9A227" /><path d="M214 34 Q240 22 266 34 L258 46 Q240 52 222 46 Z" fill="#E9EEF4" stroke="#C9A227" />{Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${220 + i * 6.6} 46 l0 8`} stroke="#BFE3FF" strokeWidth="2" />)}<ellipse cx="240" cy="70" rx="90" ry="44" fill={`url(#${id}l)`} /></>
          : light === 2 ? <><path d="M240 13 v24" stroke="#333" /><path d="M226 50 Q240 30 254 50 Z" fill="#2A2F38" /><ellipse cx="240" cy="70" rx="70" ry="36" fill={`url(#${id}l)`} /></>
          : <><rect x="436" y="110" width="3" height="80" fill="#555" /><path d="M424 112 h28 l-6 -18 h-16 z" fill="#F4E9D8" stroke="#BBA" /><ellipse cx="438" cy="120" rx="34" ry="26" fill={`url(#${id}l)`} /></>}</g>
        : <Ph x={210} y={14} w={60} h={40} label="조명" icon="💡" on={go("furn")} />}
      {/* 바닥 */}
      <rect y={FY} width={W} height={H - FY} fill={`url(#${id}f)`} />
      {home >= 6 && !dark ? <g opacity=".5">{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 60} ${FY} L${i * 60 - 30 + i * 8} ${H}`} stroke="#D8D0C2" />)}<path d={`M60 ${FY + 20} q40 30 120 40 M300 ${FY + 10} q30 40 120 60`} stroke="#CFC6B6" fill="none" /></g>
        : <g opacity=".35">{Array.from({ length: 6 }, (_, r) => <path key={r} d={`M0 ${FY + 6 + r * 18} H${W}`} stroke="#000" strokeWidth=".6" />)}{Array.from({ length: 24 }, (_, i) => <path key={i} d={`M${(i * 53) % W} ${FY + 6 + (i % 6) * 18} v18`} stroke="#000" strokeWidth=".6" />)}</g>}
      <rect y={FY} width={W} height="22" fill="#fff" opacity=".08" />
      <rect y={FY - 4} width={W} height="5" fill={dark ? "#1E1A16" : "#FFFFFF"} opacity=".8" />
      {/* 옆벽 원근 (작은 집일수록 좁고 답답하게) */}
      {(() => { const sw = [58, 40, 30, 22, 16, 10, 6, 0, 0, 0][home], c = dark ? "#1A1714" : "#000"; return sw ? <g opacity={home === 0 ? .42 : .22}><path d={`M0 0 L${sw} ${sw * .6} L${sw} ${FY + 8} L0 ${H} Z`} fill={c} /><path d={`M${W} 0 L${W - sw} ${sw * .6} L${W - sw} ${FY + 8} L${W} ${H} Z`} fill={c} /></g> : null; })()}
      {/* 러그 */}
      {(sofa || table) && home >= 1 && <ellipse cx="240" cy="258" rx={home >= 5 ? 170 : 130} ry="30" fill={home >= 5 ? "#B9A7C9" : "#C9B9A0"} opacity=".9" />}
      {/* TV·콘솔 */}
      {tv ? <g><rect x="352" y="168" width="110" height="26" rx="3" fill={home >= 5 ? "#3A2E24" : "#8A6A44"} /><rect x={tv >= 4 ? 344 : 364} y={tv >= 2 ? 94 : 112} width={tv >= 4 ? 126 : tv >= 2 ? 92 : 76} height={tv >= 4 ? 70 : tv >= 2 ? 56 : 46} rx="2" fill="#0E1117" />
          <rect x={(tv >= 4 ? 344 : 364) + 3} y={(tv >= 2 ? 94 : 112) + 3} width={(tv >= 4 ? 126 : tv >= 2 ? 92 : 76) - 6} height={(tv >= 4 ? 70 : tv >= 2 ? 56 : 46) - 6} fill="url(#tvscr)" /><defs><linearGradient id="tvscr" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#3D7DD8" /><stop offset=".6" stopColor="#7B61FF" /><stop offset="1" stopColor="#FF6BB5" /></linearGradient></defs>
          {tv >= 3 && <><rect x="300" y="120" width="34" height="72" rx="4" fill="#F2F4F7" stroke="#C9CED4" /><path d="M317 120 v72" stroke="#C9CED4" /></>}</g>
        : <Ph x={366} y={110} w={80} h={56} label="TV·가전" icon="📺" on={go("furn")} />}
      {/* 침대 */}
      {bed ? <g><rect x="12" y={home <= 1 ? 196 : 206} width={bed >= 2 ? 110 : 90} height="36" rx="6" fill={bed === 3 ? "#F4F1EA" : "#E9EEF4"} stroke="#BBB" /><rect x="8" y={home <= 1 ? 170 : 180} width="12" height="62" rx="3" fill={bed === 3 ? "#6B4A2B" : "#8A94A3"} /><rect x="22" y={(home <= 1 ? 190 : 200)} width="30" height="12" rx="5" fill="#fff" stroke="#CCC" /><rect x="40" y={(home <= 1 ? 204 : 214)} width={bed >= 2 ? 80 : 60} height="22" rx="4" fill={bed === 3 ? "#C9A227" : bed === 2 ? "#7FA7D8" : "#9FC5E8"} /></g>
        : <Ph x={14} y={206} w={90} h={40} label="침대" icon="🛏️" on={go("furn")} />}
      {/* 소파 */}
      {sofa ? <g transform="translate(240 252)">{sofa === 1 ? <><rect x="-22" y="-44" width="44" height="40" rx="10" fill="#8C6A4A" /><rect x="-26" y="-18" width="52" height="20" rx="6" fill="#A47E5A" /></>
          : <><rect x={-60 - sofa * 10} y="-50" width={120 + sofa * 20} height="34" rx="10" fill={["", "", "#6B4A2B", "#E9E2D6", "#C9C3B8"][sofa]} /><rect x={-66 - sofa * 10} y="-26" width={132 + sofa * 20} height="26" rx="8" fill={["", "", "#8A5E3B", "#F4EFE6", "#DCD6CB"][sofa]} />{[-1, 0, 1].map(i => <rect key={i} x={i * 40 - 18} y="-40" width="36" height="16" rx="5" fill={["", "", "#9A6E4A", "#FFFFFF", "#ECE7DD"][sofa]} />)}{sofa >= 3 && <><rect x="-40" y="-44" width="16" height="16" rx="3" fill="#E9C46A" /><rect x="26" y="-44" width="16" height="16" rx="3" fill="#2A2F38" /></>}<rect x={-70 - sofa * 10} y="0" width="6" height="6" fill="#333" /><rect x={64 + sofa * 10} y="0" width="6" height="6" fill="#333" /></>}</g>
        : <Ph x={170} y={200} w={140} h={50} label="소파" icon="🛋️" on={go("furn")} />}
      {/* 식탁 */}
      {table ? <g transform="translate(400 280)"><rect x={-40 - table * 6} y="-24" width={80 + table * 12} height="8" rx="3" fill={table === 2 ? "#F4F1EA" : table === 3 ? "#2A2F38" : "#A47E5A"} stroke="#555" strokeWidth=".6" /><rect x={-34 - table * 6} y="-16" width="5" height="18" fill="#555" /><rect x={30 + table * 6} y="-16" width="5" height="18" fill="#555" /><circle cx="-10" cy="-30" r="5" fill="#E9EEF4" stroke="#BBB" /><path d="M10 -36 h8 v8 h-8 z" fill="#C8E6C9" /></g>
        : <Ph x={350} y={240} w={100} h={44} label="식탁" icon="🍽️" on={go("furn")} />}
      {/* 식물 */}
      {plant ? <g transform={`translate(${home === 9 ? 120 : 140} 196)`}><path d="M-10 0 L-12 -20 L12 -20 L10 0 Z" fill="#E9E2D6" stroke="#BBA" />{plant === 2 ? <><rect x="-2" y="-60" width="4" height="40" fill="#6B4A2B" />{Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx={-14 + (i % 3) * 14} cy={-78 + Math.floor(i / 3) * 12} rx="10" ry="7" fill={["#6E8F4E", "#8AAE62", "#5A7A3E"][i % 3]} />)}</> : <path d="M0 -20 Q-22 -40 -16 -58 Q-4 -40 0 -20 Q4 -48 16 -62 Q20 -38 0 -20 Q18 -30 24 -40 Q18 -22 0 -20" fill="#3E8E4A" />}</g>
        : <Ph x={118} y={148} w={44} h={48} label="식물" icon="🪴" on={go("furn")} />}
      {/* 조각 */}
      {sculpt ? <g transform="translate(460 196)"><rect x="-12" y="-40" width="24" height="40" fill="#F2EEE6" stroke="#CCC" />{sculpt === 1 ? <path d="M-6 -40 q0 -18 6 -22 q6 4 6 22 z" fill="#8C6B3F" /> : <path d="M-10 -40 Q-14 -70 0 -80 Q14 -66 6 -52 Q16 -48 10 -40 Z" fill="#C9CED4" stroke="#9AA3AD" />}</g> : null}
      <text x="8" y={H - 8} fontSize="9" fill={dark ? "#F4F1EA" : "#4A3F30"} fontWeight="700" fontFamily="sans-serif" opacity=".8">{h.area} {h.name}</text>
    </svg>
  );
}

export const SLOT_KEYS = SLOTS.map(s => s.key);
