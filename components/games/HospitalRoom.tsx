"use client";
import { Person, STAFF_OUTFIT, bossOutfit, PATIENTS } from "./TycoonPeople";
import { HOSP_TIERS, STAFF } from "@/lib/tycoon";

/** 병원 내부(앞에서 본 단면). 단계마다 벽·바닥·창밖·가구·조명이 바뀌어요 */
type Pal = { wall: string; wall2: string; trim: string; floor: string; floor2: string; ceil: string; view: View; wins: number; light: "bulb" | "tube" | "panel" | "pendant" | "led" };
type View = "ruin" | "farm" | "town" | "apt" | "gangnam" | "city" | "seoul" | "campus" | "river" | "moon" | "mars" | "europa" | "station" | "galaxy";
const PAL: Pal[] = [
  { wall: "#6E6553", wall2: "#4E4639", trim: "#3B342A", floor: "#5A5145", floor2: "#4A4237", ceil: "#2E2922", view: "ruin", wins: 1, light: "bulb" },
  { wall: "#E3DEC8", wall2: "#7E9A72", trim: "#5E7354", floor: "#A98F69", floor2: "#97805D", ceil: "#CFC9B4", view: "farm", wins: 1, light: "tube" },
  { wall: "#F1E9D6", wall2: "#CDB892", trim: "#9C8458", floor: "#D2C8B7", floor2: "#C2B7A4", ceil: "#E9E2D2", view: "town", wins: 2, light: "tube" },
  { wall: "#F6F8F7", wall2: "#8DD0BE", trim: "#5FB39C", floor: "#DDE2E4", floor2: "#CDD3D6", ceil: "#EEF1F1", view: "apt", wins: 2, light: "panel" },
  { wall: "#F4ECDD", wall2: "#D8C29A", trim: "#B8975A", floor: "#EFE8DC", floor2: "#E2D8C6", ceil: "#F7F2E8", view: "gangnam", wins: 2, light: "pendant" },
  { wall: "#EEF3F7", wall2: "#A9C2D6", trim: "#6E93B3", floor: "#D9E0E7", floor2: "#C9D2DB", ceil: "#F2F5F8", view: "city", wins: 3, light: "panel" },
  { wall: "#F7F8FA", wall2: "#4D86D9", trim: "#2F67B8", floor: "#E6EAF0", floor2: "#D6DCE5", ceil: "#FFFFFF", view: "seoul", wins: 3, light: "led" },
  { wall: "#F3F1EA", wall2: "#9C7B4D", trim: "#7A5C33", floor: "#E9E3D5", floor2: "#DCD4C2", ceil: "#FAF8F2", view: "campus", wins: 3, light: "pendant" },
  { wall: "#FBFBF8", wall2: "#2C6B5E", trim: "#1F5246", floor: "#F2F2EE", floor2: "#E4E4DE", ceil: "#FFFFFF", view: "river", wins: 4, light: "led" },
  { wall: "#E8ECF2", wall2: "#8E9AAE", trim: "#4F5E78", floor: "#C9D1DC", floor2: "#B6C0CD", ceil: "#F4F6FA", view: "moon", wins: 3, light: "led" },
  { wall: "#F5E9E1", wall2: "#C8643C", trim: "#8E3B1F", floor: "#E2CFC2", floor2: "#D4BCAB", ceil: "#FBF4EF", view: "mars", wins: 3, light: "led" },
  { wall: "#EAF2F8", wall2: "#6FA3C7", trim: "#2F5F86", floor: "#D6E4EE", floor2: "#C4D6E3", ceil: "#F6FAFD", view: "europa", wins: 3, light: "led" },
  { wall: "#EDF1F6", wall2: "#33445F", trim: "#1D2A40", floor: "#D3DAE3", floor2: "#C2CAD5", ceil: "#F8FAFC", view: "station", wins: 4, light: "led" },
  { wall: "#ECE8FB", wall2: "#5B45B8", trim: "#38277F", floor: "#DCD6F5", floor2: "#CBC3EF", ceil: "#F6F4FF", view: "galaxy", wins: 4, light: "led" },
];

function Sky({ v, w, h }: { v: View; w: number; h: number }) {
  const space = ["moon", "mars", "europa", "station", "galaxy"].includes(v);
  if (space) {
    const st = Array.from({ length: Math.round(w / 6) }, (_, i) => [((i * 97) % 1000) / 1000 * w, ((i * 61 + 13) % 1000) / 1000 * h * .8, (i % 5 === 0 ? 1.3 : .7)]);
    const gid = "sp" + v + w;
    return (
      <g>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={v === "mars" ? "#2A1420" : "#050816"} /><stop offset="1" stopColor={v === "mars" ? "#7A3A2A" : v === "galaxy" ? "#2A1B5E" : "#16204A"} /></linearGradient></defs>
        <rect width={w} height={h} fill={`url(#${gid})`} />
        {st.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={.5 + (i % 3) * .2} />)}
        {v === "moon" && <><circle cx={w * .7} cy={h * .3} r={h * .2} fill="#2F7BD6" /><path d={`M${w * .62} ${h * .25} q${w * .05} -${h * .1} ${w * .1} 0 q-${w * .02} ${h * .08} -${w * .08} ${h * .1} z`} fill="#5BAE5B" /><ellipse cx={w * .7} cy={h * .3} rx={h * .2} ry={h * .2} fill="none" stroke="#BFE3FF" strokeWidth="1.5" opacity=".6" /><path d={`M0 ${h * .78} Q${w * .3} ${h * .7} ${w * .6} ${h * .8} T${w} ${h * .76} L${w} ${h} L0 ${h} Z`} fill="#A9AEB8" /><circle cx={w * .25} cy={h * .88} r="4" fill="#8E939C" /><circle cx={w * .8} cy={h * .9} r="3" fill="#8E939C" /></>}
        {v === "mars" && <><circle cx={w * .2} cy={h * .2} r="4" fill="#F3E2C0" /><path d={`M0 ${h * .7} Q${w * .25} ${h * .55} ${w * .5} ${h * .7} Q${w * .75} ${h * .5} ${w} ${h * .66} L${w} ${h} L0 ${h} Z`} fill="#B5532E" /><path d={`M0 ${h * .82} Q${w * .4} ${h * .74} ${w} ${h * .84} L${w} ${h} L0 ${h} Z`} fill="#93401F" /><path d={`M${w * .55} ${h * .7} q${w * .12} -${h * .28} ${w * .24} 0 z`} fill="#D9EEF8" opacity=".55" stroke="#fff" /></>}
        {v === "europa" && <><circle cx={w * .55} cy={h * .45} r={h * .5} fill="#D9A46A" />{[-.25, -.1, .05, .2, .32].map((d, i) => <rect key={i} x={w * .55 - h * .5} y={h * (.45 + d)} width={h} height={h * .05} fill={i % 2 ? "#B3733F" : "#EBC79A"} opacity=".8" />)}<ellipse cx={w * .62} cy={h * .55} rx={h * .07} ry={h * .04} fill="#C0502E" /><path d={`M0 ${h * .8} L${w} ${h * .76} L${w} ${h} L0 ${h} Z`} fill="#DCEBF5" /><path d={`M${w * .1} ${h * .86} l${w * .2} ${h * .04} M${w * .5} ${h * .83} l${w * .25} ${h * .06}`} stroke="#9CC3DE" strokeWidth=".8" /></>}
        {v === "station" && <><path d={`M-${w * .2} ${h} Q${w * .5} ${h * .45} ${w * 1.2} ${h}`} fill="#2F7BD6" /><path d={`M-${w * .2} ${h} Q${w * .5} ${h * .45} ${w * 1.2} ${h}`} fill="none" stroke="#9FD8FF" strokeWidth="3" opacity=".7" /><path d={`M${w * .2} ${h * .9} q${w * .1} -${h * .08} ${w * .22} -${h * .02}`} fill="#5BAE5B" /><g transform={`translate(${w * .65} ${h * .25})`}><rect x="-14" y="-3" width="28" height="6" fill="#C9D3DE" /><rect x="-30" y="-8" width="14" height="16" fill="#3D6FB6" /><rect x="16" y="-8" width="14" height="16" fill="#3D6FB6" /></g></>}
        {v === "galaxy" && <><g transform={`translate(${w * .5} ${h * .45})`}><ellipse rx={w * .32} ry={h * .14} fill="#B48CFF" opacity=".25" transform="rotate(-18)" /><ellipse rx={w * .2} ry={h * .08} fill="#E2D3FF" opacity=".35" transform="rotate(-18)" /><circle r={h * .05} fill="#FFF3D6" /></g><circle cx={w * .15} cy={h * .75} r={h * .1} fill="#E07A5F" /><circle cx={w * .88} cy={h * .7} r={h * .07} fill="#81B29A" /></>}
      </g>
    );
  }
  const sky = v === "ruin" ? ["#8C9196", "#B8BABA"] : v === "seoul" || v === "river" ? ["#7EC3F2", "#D9F0FF"] : ["#86C8F0", "#E3F4FF"];
  const g = "sk" + v + w;
  const bld = (n: number, max: number, col: string, seed: number, win = true) => Array.from({ length: n }, (_, i) => { const bw = w / n, bh = h * (.25 + ((i * 37 + seed) % 10) / 10 * max); return <g key={i}><rect x={i * bw} y={h - bh} width={bw - 1} height={bh} fill={col} />{win && Array.from({ length: Math.floor(bh / 7) }, (_, k) => <rect key={k} x={i * bw + 2} y={h - bh + 3 + k * 7} width={bw - 5} height="2" fill="#fff" opacity=".35" />)}</g>; });
  return (
    <g>
      <defs><linearGradient id={g} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient></defs>
      <rect width={w} height={h} fill={`url(#${g})`} />
      {v !== "ruin" && <><ellipse cx={w * .25} cy={h * .22} rx={w * .18} ry="4" fill="#fff" opacity=".8" /><ellipse cx={w * .7} cy={h * .15} rx={w * .14} ry="3" fill="#fff" opacity=".7" /></>}
      {v === "ruin" && <><path d={`M0 ${h} L0 ${h * .5} L${w * .2} ${h * .6} L${w * .3} ${h * .45} L${w * .5} ${h * .62} L${w * .7} ${h * .5} L${w} ${h * .58} L${w} ${h} Z`} fill="#5E5A55" /><path d={`M${w * .1} ${h} l0 -${h * .3} l${w * .1} -6 l0 ${h * .36}`} fill="#4A4642" /></>}
      {v === "farm" && <><path d={`M0 ${h * .62} Q${w * .25} ${h * .3} ${w * .5} ${h * .55} Q${w * .75} ${h * .25} ${w} ${h * .5} L${w} ${h} L0 ${h} Z`} fill="#6E9E63" /><rect y={h * .72} width={w} height={h * .28} fill="#B8D46A" />{Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${h * .76 + i * h * .045} L${w} ${h * .76 + i * h * .045}`} stroke="#8BB04A" strokeWidth="1" />)}<rect x={w * .65} y={h * .6} width={w * .14} height={h * .14} fill="#C96A4A" /><path d={`M${w * .63} ${h * .6} L${w * .72} ${h * .5} L${w * .81} ${h * .6} Z`} fill="#7A3E2E" /></>}
      {v === "town" && <><path d={`M0 ${h * .55} Q${w * .5} ${h * .35} ${w} ${h * .55} L${w} ${h} L0 ${h} Z`} fill="#8DB07D" />{bld(5, .25, "#D9CBB5", 3, true)}</>}
      {v === "apt" && <>{bld(4, .7, "#E6E9EE", 5)}{bld(6, .3, "#C9D3DE", 1)}</>}
      {v === "gangnam" && <>{bld(5, .9, "#7FA0C2", 7)}<rect x={w * .35} y={h * .05} width={w * .16} height={h * .95} fill="#3E5C82" />{Array.from({ length: 14 }, (_, k) => <rect key={k} x={w * .36} y={h * .08 + k * h * .065} width={w * .14} height="2" fill="#BFE3FF" opacity=".6" />)}</>}
      {v === "city" && <>{bld(7, .55, "#A9B7C6", 2)}{bld(9, .25, "#8A99AA", 6)}</>}
      {v === "seoul" && <>{bld(8, .8, "#90A8C3", 4)}<path d={`M${w * .78} ${h} L${w * .78} ${h * .25} L${w * .8} ${h * .1} L${w * .82} ${h * .25} L${w * .82} ${h} Z`} fill="#5B7598" /><circle cx={w * .8} cy={h * .28} r="3" fill="#E2574C" /></>}
      {v === "campus" && <><rect y={h * .7} width={w} height={h * .3} fill="#7FB069" />{bld(3, .55, "#C98E62", 9)}{Array.from({ length: 5 }, (_, i) => <g key={i}><rect x={w * (.1 + i * .2)} y={h * .72} width="3" height={h * .2} fill="#6B4A2B" /><circle cx={w * (.1 + i * .2) + 1.5} cy={h * .7} r={h * .12} fill="#4F8F3A" /></g>)}</>}
      {v === "river" && <>{bld(9, .45, "#9DB3CC", 3)}<rect y={h * .66} width={w} height={h * .34} fill="#4F9BD1" /><path d={`M0 ${h * .7} L${w} ${h * .7}`} stroke="#BFE7FF" strokeWidth="1.2" /><path d={`M0 ${h * .64} L${w} ${h * .64}`} stroke="#6B7C8F" strokeWidth="3" />{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * w / 8} ${h * .64} q${w / 16} -${h * .12} ${w / 8} 0`} fill="none" stroke="#6B7C8F" strokeWidth="1.4" />)}{[.2, .55, .85].map(t => <path key={t} d={`M${w * t} ${h * .8} l8 0`} stroke="#fff" strokeWidth="1" opacity=".7" />)}</>}
    </g>
  );
}

function Window({ x, y, w, h, v, t }: { x: number; y: number; w: number; h: number; v: View; t: number }) {
  const id = `wc${x}${t}`;
  return (
    <g>
      <defs><clipPath id={id}><rect x={x} y={y} width={w} height={h} /></clipPath></defs>
      <g clipPath={`url(#${id})`}><g transform={`translate(${x} ${y})`}><Sky v={v} w={w} h={h} /></g>
        <rect x={x} y={y} width={w} height={h} fill={`url(#glass${t})`} /></g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={t === 0 ? "#3B342A" : t >= 6 ? "#9AA7B5" : "#FFFFFF"} strokeWidth={t >= 6 ? 2 : 4} />
      {t < 6 && <><path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`} stroke={t === 0 ? "#3B342A" : "#FFFFFF"} strokeWidth="2.5" /><rect x={x - 4} y={y + h} width={w + 8} height="4" fill={t === 0 ? "#3B342A" : "#EDEDED"} /></>}
      {t === 0 && <><path d={`M${x - 4} ${y + h * .2} L${x + w + 4} ${y + h * .45}`} stroke="#7A5A34" strokeWidth="8" /><path d={`M${x - 4} ${y + h * .7} L${x + w + 4} ${y + h * .5}`} stroke="#6A4C2A" strokeWidth="7" /><path d={`M${x + w * .2} ${y + h * .15} l${w * .2} ${h * .3} l-${w * .05} ${h * .15}`} stroke="#fff" strokeWidth=".8" fill="none" opacity=".8" /></>}
      {t >= 4 && t !== 6 && t !== 8 && <><path d={`M${x - 6} ${y - 4} q6 ${h / 2} 0 ${h + 6}`} fill={t === 4 ? "#C8A97A" : "#B7C6D3"} stroke="none" opacity=".9" /><path d={`M${x + w + 6} ${y - 4} q-6 ${h / 2} 0 ${h + 6}`} fill={t === 4 ? "#C8A97A" : "#B7C6D3"} stroke="none" opacity=".9" /></>}
    </g>
  );
}

const bench = (x: number, y: number, c: string, n = 3, broken = false) => <g key={"b" + x}>{Array.from({ length: n }, (_, i) => <g key={i} transform={broken && i === n - 1 ? `rotate(12 ${x + i * 22 + 10} ${y})` : undefined}><rect x={x + i * 22} y={y - 14} width="20" height="7" rx="2" fill={c} /><rect x={x + i * 22} y={y - 26} width="20" height="12" rx="2" fill={c} /></g>)}<rect x={x + 2} y={y - 7} width="2.5" height="7" fill="#555" /><rect x={x + n * 22 - 6} y={y - 7} width="2.5" height="7" fill="#555" /></g>;
const plant = (x: number, y: number, s = 1) => <g key={"p" + x} transform={`translate(${x} ${y}) scale(${s})`}><path d="M-7 0 L-9 -14 L9 -14 L7 0 Z" fill="#C9A27A" /><path d="M0 -14 Q-14 -30 -10 -42 Q-2 -30 0 -14 Q2 -36 10 -46 Q12 -28 0 -14 Q12 -24 16 -30 Q12 -16 0 -14" fill="#4F9A5A" /></g>;

export default function HospitalRoom({ tier, staff, clickLv }: { tier: number; staff: number[]; clickLv: number }) {
  const T = Math.max(0, Math.min(PAL.length - 1, tier)), t = Math.min(8, T), P = PAL[T], sp = T >= 9;
  const hired = staff.map((lv, i) => ({ lv, i })).filter(x => x.lv > 0);
  const H = 300, FY = 205, W = 520, CX = 260;
  /** 직원 자리: 원장 양옆에서 시작해 대각선 뒤로 V자 (뒤로 갈수록 작게) */
  const slot = (k: number) => { const row = Math.floor(k / 2), side = k % 2 ? 1 : -1; return { row, x: CX + side * (64 + row * 26), y: H - 12 - row * 13, s: 0.9 - row * 0.065 }; };
  const winW = t >= 6 ? 150 : t >= 4 ? 96 : 76, winH = t >= 6 ? 120 : 82, winY = t >= 6 ? 34 : 50;
  const nW = Math.max(P.wins, Math.floor(W / 260)), wins = Array.from({ length: nW }, (_, i) => 200 + i * ((W - 250) / nW));
  const nPat = [2, 3, 3, 4, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10][T];
  const name = ["메디화 트의원", "메디화이트 보건의원", "메디화이트의원", "메디화이트 의원", "메디화이트 강남의원", "메디화이트 병원", "메디화이트 서울병원", "메디화이트 대학교병원", "메디화이트 대학교병원 본원", "메디화이트 달기지 의원", "메디화이트 화성 종합병원", "메디화이트 유로파 메디컬센터", "메디화이트 궤도정거장 대학병원", "메디화이트 은하연합 중앙병원"][T];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hr-svg" style={{ width: "100%" }} aria-label={HOSP_TIERS[T].name}>
      <defs>
        <linearGradient id={"glass" + t} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".18" /></linearGradient>
        <linearGradient id={"flr" + t} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={P.floor2} /><stop offset="1" stopColor={P.floor} /></linearGradient>
        <linearGradient id={"wl" + t} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={P.wall} /><stop offset="1" stopColor={P.wall} stopOpacity=".92" /></linearGradient>
        <radialGradient id={"lamp" + t}><stop offset="0" stopColor="#FFF6D0" stopOpacity=".7" /><stop offset="1" stopColor="#FFF6D0" stopOpacity="0" /></radialGradient>
      </defs>
      {/* 천장·벽 */}
      <rect width={W} height={FY} fill={`url(#wl${t})`} />
      <rect width={W} height="18" fill={P.ceil} /><rect y="18" width={W} height="3" fill={P.trim} opacity=".5" />
      {t >= 1 && <rect y={FY - 62} width={W} height="62" fill={P.wall2} opacity={t === 1 ? 1 : .55} />}
      {t >= 1 && <rect y={FY - 64} width={W} height="3" fill={P.trim} />}
      <rect y={FY - 6} width={W} height="6" fill={P.trim} />
      {/* 폐허: 얼룩·금·벗겨진 벽지 */}
      {t === 0 && <g opacity=".85">
        {[[120, 60, 30], [330, 120, 40], [W - 90, 70, 26], [460, 40, 22]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * .7} fill="#3E3729" opacity=".35" />)}
        <path d={`M150 22 l8 30 l-10 22 l12 30 M${W - 140} 22 l-6 26 l10 18 l-8 34`} fill="none" stroke="#2A251D" strokeWidth="1.4" />
        <path d={`M260 100 q20 -10 30 6 q-6 20 -28 14 z`} fill="#857A62" stroke="#3B342A" />
        <path d="M0 18 L60 18 Q30 40 0 70 Z M0 18 L30 60 M0 40 L45 26" fill="none" stroke="#DDD" strokeWidth=".7" opacity=".7" />
        <path d={`M${W} 18 L${W - 70} 18 Q${W - 30} 44 ${W} 76 Z M${W} 18 L${W - 34} 62 M${W} 44 L${W - 52} 24`} fill="none" stroke="#DDD" strokeWidth=".7" opacity=".7" />
      </g>}
      {/* 창문 */}
      {wins.map((x, i) => <Window key={i} x={x} y={winY} w={winW} h={winH} v={P.view} t={t} />)}
      {sp && <g>
        <g className="hr-flicker"><rect x={W - 150} y="108" width="56" height="34" rx="4" fill="#0B1530" opacity=".85" /><text x={W - 122} y="122" fontSize="7" textAnchor="middle" fill="#7DF9FF" fontFamily="sans-serif">O₂ 21%</text><text x={W - 122} y="134" fontSize="7" textAnchor="middle" fill="#7DF9FF" fontFamily="sans-serif">중력 {["0.17", "0.38", "0.13", "0.00", "?"][T - 9]}G</text></g>
        <g className="hr-float"><g transform={`translate(${W * .62} 150)`}><ellipse rx="12" ry="7" fill="#DDE3EC" stroke="#8E9AAE" /><circle cx="0" cy="-2" r="3" fill="#3DE0FF" /><path d="M-12 0 l-6 -3 M12 0 l6 -3" stroke="#8E9AAE" strokeWidth="1.5" /></g></g>
      </g>}
      {/* 간판 */}
      <g transform={`translate(${t === 0 ? 120 : 110} ${t >= 6 ? 160 : 30}) rotate(${t === 0 ? -6 : 0})`}>
        <rect x="-4" y="0" width={name.length * 9 + 16} height="20" rx={t >= 4 ? 10 : 3} fill={t === 0 ? "#A89A80" : t >= 4 ? P.trim : "#FFFFFF"} stroke={t === 0 ? "#3B342A" : "none"} />
        <text x={name.length * 4.5 + 4} y="14" fontSize="11" textAnchor="middle" fill={t === 0 ? "#3B342A" : t >= 4 ? "#FFFFFF" : P.trim} fontWeight="800" fontFamily="sans-serif">{name}</text>
      </g>
      {/* 조명 */}
      {Array.from({ length: Math.ceil(W / 200) }, (_, i) => { const lx = 120 + i * 200; return <g key={i}>
        {P.light === "bulb" && <g className="hr-flicker"><path d={`M${lx} 18 v26`} stroke="#222" /><circle cx={lx} cy="48" r="5" fill="#FFE9A0" /><circle cx={lx} cy="48" r="40" fill={`url(#lamp${t})`} /></g>}
        {P.light === "tube" && <><rect x={lx - 26} y="20" width="52" height="5" rx="2" fill="#FFFFF2" stroke="#BBB" /><ellipse cx={lx} cy="40" rx="60" ry="22" fill={`url(#lamp${t})`} /></>}
        {P.light === "panel" && <><rect x={lx - 30} y="18" width="60" height="4" fill="#FFFFFF" stroke="#D8DDE2" /><ellipse cx={lx} cy="40" rx="70" ry="26" fill={`url(#lamp${t})`} opacity=".8" /></>}
        {P.light === "pendant" && <><path d={`M${lx} 18 v22`} stroke="#8A7550" /><path d={`M${lx - 12} 48 Q${lx} 34 ${lx + 12} 48 Z`} fill={t === 7 ? "#3B3B3B" : "#C9A227"} /><ellipse cx={lx} cy="60" rx="40" ry="26" fill={`url(#lamp${t})`} /></>}
        {P.light === "led" && <><rect x={lx - 60} y="18" width="120" height="3" fill="#E9F6FF" /><rect x={lx - 60} y="21" width="120" height="10" fill="#E9F6FF" opacity=".25" /></>}
      </g>; })}
      {/* 벽 소품 */}
      {t === 1 && <><rect x={W - 110} y="60" width="34" height="44" fill="#fff" stroke="#999" /><rect x={W - 110} y="60" width="34" height="9" fill="#E2574C" /><text x={W - 93} y="85" fontSize="12" textAnchor="middle" fill="#333" fontFamily="sans-serif">7</text></>}
      {t >= 2 && <><circle cx={W - 60} cy="55" r="12" fill="#fff" stroke={P.trim} strokeWidth="2" /><path d={`M${W - 60} 55 v-7 M${W - 60} 55 h5`} stroke="#333" /></>}
      {t >= 3 && <><rect x={W - 150} y="62" width="62" height="38" rx="3" fill="#1E2533" /><rect x={W - 147} y="65" width="56" height="32" fill="#3D7DD8" /><text x={W - 119} y="84" fontSize="7" textAnchor="middle" fill="#fff" fontFamily="sans-serif">대기 0{t}번</text></>}
      {t >= 5 && <g>{["내과", "외과", "영상의학과", "응급실"].slice(0, t - 2).map((d, i) => <g key={d} transform={`translate(${30 + i * 0} ${30 + i * 16})`}><rect width="56" height="13" rx="2" fill={P.trim} /><text x="28" y="9.5" fontSize="7.5" textAnchor="middle" fill="#fff" fontFamily="sans-serif">{d} →</text></g>)}</g>}
      {t >= 7 && !sp && <g>{Array.from({ length: Math.floor(W / 160) }, (_, i) => <rect key={i} x={70 + i * 160} y="21" width="12" height={FY - 27} fill="#FFFFFF" opacity=".55" />)}</g>}
      {T === 8 && <g><rect x={W - 230} y="108" width="80" height="40" rx="4" fill="#3E7D4F" />{Array.from({ length: 30 }, (_, i) => <circle key={i} cx={W - 226 + (i % 10) * 8} cy={112 + Math.floor(i / 10) * 12} r="5" fill={["#4F9A5A", "#6CC070", "#3E8E3A"][i % 3]} />)}<rect x={W - 150} y="130" width="60" height="22" rx="3" fill="#6B4A2B" /><text x={W - 120} y="145" fontSize="9" textAnchor="middle" fill="#fff" fontWeight="700" fontFamily="sans-serif">CAFE</text></g>}
      {/* 바닥 */}
      <rect y={FY} width={W} height={H - FY} fill={`url(#flr${t})`} />
      {t === 0 ? <g stroke="#2F2A22" strokeWidth=".8" fill="none">{Array.from({ length: Math.ceil(W / 40) }, (_, i) => <path key={i} d={`M${i * 40} ${FY} l${(i % 3) * 6 - 6} ${H - FY}`} />)}<path d={`M0 ${FY + 30} H${W} M0 ${FY + 62} H${W}`} />{[[90, 240], [300, 270], [W - 120, 230]].map(([x, y], i) => <g key={i}><path d={`M${x} ${y} l18 -6 l12 10 l-8 14 l-20 -2 z`} fill="#3E3729" /><path d={`M${x + 4} ${y} l10 8 l4 -8`} /></g>)}<ellipse cx={W * .55} cy={FY + 40} rx="40" ry="7" fill="#6E7A80" opacity=".55" stroke="none" /></g>
        : t <= 2 ? <g stroke={P.floor2} strokeWidth="1">{Array.from({ length: Math.ceil(W / 34) }, (_, i) => <path key={i} d={`M${i * 34} ${FY} L${i * 34 - 20 + (i * 34 / W) * 40} ${H}`} />)}<path d={`M0 ${FY + 32} H${W} M0 ${FY + 66} H${W}`} /></g>
        : <g>{Array.from({ length: Math.ceil(W / 60) }, (_, i) => <path key={i} d={`M${i * 60} ${FY} L${i * 60 - 30 + (i * 60 / W) * 60} ${H}`} stroke={P.floor2} strokeWidth=".8" />)}{t >= 4 && <rect y={FY} width={W} height="40" fill="#fff" opacity=".18" />}{t === 4 && Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * W / 8} ${FY + 10} q20 30 50 40`} stroke="#D8CBB4" fill="none" strokeWidth=".8" />)}</g>}
      {/* 출입문 (왼쪽) */}
      <g>
        <rect x="14" y={FY - 110} width="64" height="110" fill={t === 0 ? "#3B342A" : t >= 6 ? "#BFD7EA" : P.trim} opacity={t >= 6 ? .6 : 1} />
        <rect x="18" y={FY - 106} width="56" height="106" fill={t === 0 ? "#5A4A36" : t >= 3 ? "#DCEFFA" : "#C8A97A"} opacity={t >= 3 ? .75 : 1} stroke={t >= 3 ? "#9AA7B5" : "#3B342A"} />
        {t >= 3 && <path d={`M46 ${FY - 106} V${FY}`} stroke="#9AA7B5" strokeWidth="1.5" />}
        {t === 0 && <><path d={`M18 ${FY - 80} L74 ${FY - 70} M18 ${FY - 40} L74 ${FY - 50}`} stroke="#2A251D" strokeWidth="5" /><text x="46" y={FY - 58} fontSize="7" textAnchor="middle" fill="#E9E0C8" fontFamily="sans-serif">진료중?</text></>}
        <rect x="18" y={FY - 124} width="56" height="12" rx="2" fill={t === 0 ? "#6B5B44" : "#2C6B5E"} /><text x="46" y={FY - 115} fontSize="8" textAnchor="middle" fill="#fff" fontFamily="sans-serif">{t === 0 ? "출 입" : "입구 ENTRANCE"}</text>
      </g>
      {/* 접수대·가구 */}
      {t === 0 ? <g>{bench(100, FY + 12, "#7A6A50", 3, true)}<rect x={W - 70} y={FY - 6} width="22" height="26" fill="#8A7A5A" /><path d={`M${W - 70} ${FY - 6} l11 -8 l11 8`} fill="#9A8A6A" /><g className="hr-drip"><circle cx={W * .55} cy="30" r="2" fill="#7FB3C8" /></g><path d={`M${W * .55 - 10} ${FY + 34} h20 l-3 14 h-14 z`} fill="#4A6A7A" /></g>
        : <g>
          <g transform={`translate(96 ${FY + 6})`}><rect width={t >= 4 ? 110 : 84} height="34" rx={t >= 4 ? 8 : 2} fill={t >= 4 ? "#FFFFFF" : t === 1 ? "#8A6A44" : "#E9DCC4"} stroke={P.trim} /><rect y="-4" width={t >= 4 ? 110 : 84} height="6" rx="2" fill={P.trim} />{t >= 3 && <><rect x="12" y="-20" width="20" height="14" rx="1" fill="#2B3245" /><rect x="14" y="-18" width="16" height="10" fill="#9FD3F5" /></>}<text x={t >= 4 ? 55 : 42} y="22" fontSize="8" textAnchor="middle" fill={P.trim} fontWeight="700" fontFamily="sans-serif">접수·수납</text></g>
          {bench(W - 200, FY + 14, t === 1 ? "#8A6A44" : t >= 4 ? "#C7A86B" : P.wall2, t >= 5 ? 4 : 3)}
          {t >= 2 && plant(W - 26, FY + 18, 1 + t * .08)}
          {t >= 2 && <g transform={`translate(${W - 230} ${FY + 18})`}><rect x="-7" y="-36" width="14" height="36" rx="2" fill="#F2F5F8" stroke="#9AA7B5" /><rect x="-5" y="-50" width="10" height="14" rx="3" fill="#9FD3F5" /></g>}
          {t >= 5 && <g transform={`translate(${W - 120} ${FY + 26})`}><circle cx="0" cy="0" r="10" fill="none" stroke="#3B4250" strokeWidth="2.4" /><path d="M-4 -8 L-10 -26 L6 -26 L8 -10 M-10 -26 L-14 -30" fill="none" stroke="#3B4250" strokeWidth="2" /><rect x="-10" y="-20" width="16" height="10" fill="#4D86D9" /></g>}
        </g>}
      {/* 벌레·거미줄 (폐허·시골) */}
      {t <= 1 && <g>
        <path d="M0 21 Q30 35 0 60 M0 21 L40 21 M0 21 L36 44 M10 21 Q20 30 0 36 M22 21 Q28 38 0 48" fill="none" stroke="#EEE" strokeWidth=".8" opacity=".75" />
        {t === 0 && <><path d={`M${W} 21 Q${W - 34} 36 ${W} 66 M${W} 21 L${W - 44} 21 M${W} 21 L${W - 40} 48 M${W - 12} 21 Q${W - 22} 32 ${W} 38`} fill="none" stroke="#EEE" strokeWidth=".8" opacity=".75" />
          <g className="hr-spider"><path d={`M${W * .35} 21 V70`} stroke="#DDD" strokeWidth=".6" /><circle cx={W * .35} cy="72" r="3.5" fill="#1A1A1A" /><path d={`M${W * .35 - 6} 69 l-3 -3 M${W * .35 - 6} 73 l-4 2 M${W * .35 + 6} 69 l3 -3 M${W * .35 + 6} 73 l4 2`} stroke="#1A1A1A" strokeWidth=".9" /></g>
          {[0, 1, 2, 3].map(i => <g key={i} className="hr-roach" style={{ animationDelay: `${i * 2.3}s`, animationDuration: `${6 + i}s` }}><g transform={`translate(0 ${FY + 20 + i * 18})`}><ellipse cx="0" cy="0" rx="5" ry="2.6" fill="#5A2E12" /><path d="M-4 -2 l-3 -3 M0 -2 l0 -4 M4 -2 l3 -3 M-4 2 l-3 3 M0 2 l0 4 M4 2 l3 3 M5 -1 l5 -3 M5 1 l5 3" stroke="#3A1E0C" strokeWidth=".7" /></g></g>)}
          <g className="hr-roach2"><g transform={`translate(${W * .7} 80)`}><ellipse cx="0" cy="0" rx="2.6" ry="5" fill="#5A2E12" /><path d="M-2 -3 l-3 -2 M2 -3 l3 -2 M-2 1 l-3 1 M2 1 l3 1 M0 -5 l-2 -4 M0 -5 l2 -4" stroke="#3A1E0C" strokeWidth=".7" /></g></g></>}
        {Array.from({ length: t === 0 ? 4 : 2 }, (_, i) => <g key={i} className="hr-fly" style={{ animationDelay: `${i * .7}s` }}><g transform={`translate(${200 + i * 90} ${70 + (i % 2) * 40})`}><circle r="1.6" fill="#111" /><ellipse cx="-1.5" cy="-1.5" rx="1.6" ry=".9" fill="#ccc" opacity=".8" /><ellipse cx="1.5" cy="-1.5" rx="1.6" ry=".9" fill="#ccc" opacity=".8" /></g></g>)}
      </g>}
      {/* 환자 출입 (뒤쪽 동선) */}
      {Array.from({ length: nPat }, (_, i) => <g key={i} className="hr-pat" style={{ animationDelay: `${i * (14 / nPat)}s`, ["--far" as any]: `${Math.min(W - 120, 150 + (i % 4) * 90)}px` }}>
        <g transform={`translate(0 ${FY + 18}) scale(.5)`}><Person o={PATIENTS[i % PATIENTS.length]} pose="walk" /></g></g>)}
      {/* 원장(나) + 직원 (한 직종당 한 명) */}
      {hired.map((h, k) => ({ ...h, ...slot(k) })).sort((a, b) => b.row - a.row).map(({ i, lv, x, y, s: sc }, n) => <g key={i} transform={`translate(${x} ${y}) scale(${sc})`}>
        <g className="hr-idle" style={{ animationDelay: `${(n * .37) % 2}s` }}><Person o={STAFF_OUTFIT[i]} /></g>
        <text x="0" y="9" fontSize="8.5" textAnchor="middle" fill={t === 0 ? "#E9E0C8" : "#2B2420"} fontFamily="sans-serif" fontWeight="700">{STAFF[i].name} Lv{lv}</text>
      </g>)}
      <g transform={`translate(${CX} ${H - 8})`}>
        <g className={t <= 1 ? "hr-beg" : undefined}><Person o={bossOutfit(T)} pose={t <= 1 ? "beg" : "wave"} /></g>
        <g transform="translate(-34 -150)"><rect x="0" y="0" width={t <= 1 ? 74 : 62} height="18" rx="9" fill="#fff" stroke="#2B2420" strokeWidth=".8" /><path d="M30 18 l5 6 l3 -6" fill="#fff" stroke="#2B2420" strokeWidth=".8" /><text x={t <= 1 ? 37 : 31} y="12.5" fontSize="8.5" textAnchor="middle" fill="#2B2420" fontFamily="sans-serif" fontWeight="700">{t <= 1 ? "한 푼만 줍쇼~" : "어서 오세요!"}</text></g>
        <text x="0" y="8" fontSize="8" textAnchor="middle" fill={t === 0 ? "#E9E0C8" : "#2B2420"} fontFamily="sans-serif" fontWeight="700">원장 Lv{clickLv}</text>
      </g>
</svg>
  );
}
