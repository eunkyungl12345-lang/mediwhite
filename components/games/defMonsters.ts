/** 병동 사수 세균 괴물 — 다크 판타지 스타일 (왼쪽을 보고 걸어와요) */
const O = "#0B0B10";
const base = `<defs>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="bigglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="skin" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in" result="t"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="t"/></feMerge></filter>
<linearGradient id="iron" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8A8F99"/><stop offset=".45" stop-color="#4A4F5A"/><stop offset="1" stop-color="#1E2128"/></linearGradient>
<linearGradient id="rust" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#9AA0AA"/><stop offset=".5" stop-color="#5B4A3E"/><stop offset="1" stop-color="#3A2418"/></linearGradient>
<linearGradient id="bone" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#FFF6DC"/><stop offset="1" stop-color="#B9A57A"/></linearGradient>
<linearGradient id="leather" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6B4628"/><stop offset="1" stop-color="#2E1B0E"/></linearGradient>
</defs>`;
const wrap = (body: string, fit = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="200" height="200">${base}<g stroke="${O}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"${fit ? ` transform="${fit}"` : ""}>${body}</g></svg>`;
const shadow = (rx: number) => `<ellipse cx="60" cy="114" rx="${rx}" ry="5" fill="#000" opacity=".35" stroke="none"/>`;
/** 빛나는 눈 (왼쪽 응시) */
const eye = (x: number, y: number, r: number, c: string, angry = true) => `<g filter="url(#glow)"><ellipse cx="${x}" cy="${y}" rx="${r * 1.25}" ry="${r}" fill="${c}"/><ellipse cx="${x - r * .35}" cy="${y}" rx="${r * .3}" ry="${r * .75}" fill="#1A0000" stroke="none"/></g>${angry ? `<path d="M${x - r * 1.8} ${y - r * 1.7} L${x + r * 1.6} ${y - r * .6}" stroke-width="2.2"/>` : ""}`;
/** 톱니 이빨 입 */
const maw = (x: number, y: number, w: number, h: number, n: number) => `<path d="M${x} ${y} Q${x + w / 2} ${y + h * 1.6} ${x + w} ${y} Q${x + w / 2} ${y + h * .3} ${x} ${y} Z" fill="#2A0508"/>` +
  Array.from({ length: n }, (_, i) => { const px = x + (i + .5) * w / n, tw = w / n * .45; return `<path d="M${(px - tw).toFixed(1)} ${y + 1} L${px.toFixed(1)} ${(y + h * (i % 2 ? .8 : 1.15)).toFixed(1)} L${(px + tw).toFixed(1)} ${y + 1.5} Z" fill="url(#bone)" stroke-width=".8"/>`; }).join("") +
  Array.from({ length: n - 1 }, (_, i) => { const px = x + (i + 1) * w / n, tw = w / n * .4; return `<path d="M${(px - tw).toFixed(1)} ${y + h * 1.05} L${px.toFixed(1)} ${(y + h * .45).toFixed(1)} L${(px + tw).toFixed(1)} ${y + h * 1.05} Z" fill="url(#bone)" stroke-width=".8"/>`; }).join("");
const drip = (x: number, y: number, l: number, c = "#9BE15D") => `<path d="M${x} ${y} q-2 ${l * .6} 0 ${l} q2 -${l * .4} 0 -${l}" fill="${c}" stroke-width=".8" opacity=".9"/>`;

export const GERM_SVG: string[] = [
  // 0 역병 고블린: 구부정한 몸, 사마귀 피부, 녹슨 메스
  wrap(`<defs><radialGradient id="s0" cx=".4" cy=".35"><stop offset="0" stop-color="#9BB86A"/><stop offset=".6" stop-color="#5E7A3A"/><stop offset="1" stop-color="#2E3E1C"/></radialGradient></defs>
    ${shadow(26)}
    <path d="M62 86 L56 110 L66 110 L70 88 Z M78 84 L82 110 L92 110 L86 84 Z" fill="url(#s0)"/>
    <path d="M52 108 l-6 4 h18 v-4 z M80 108 l-4 4 h16 l-2 -4 z" fill="#2A2F1A"/>
    <path d="M46 60 Q48 46 66 44 Q90 44 94 66 Q96 86 76 90 Q54 92 50 78 Z" fill="url(#s0)" filter="url(#skin)"/>
    <path d="M56 70 Q70 66 86 72 L84 88 Q70 92 58 86 Z" fill="url(#leather)"/>
    <path d="M50 64 Q36 70 30 82 L38 84 Q44 74 54 72 Z" fill="url(#s0)"/>
    <g transform="rotate(-25 30 82)"><rect x="8" y="80" width="26" height="4" rx="1" fill="url(#rust)"/><path d="M8 80 l-8 2 l8 2 z" fill="#C9CED6"/><rect x="30" y="78.5" width="7" height="7" rx="1.5" fill="url(#leather)"/></g>
    <path d="M30 42 Q24 22 46 20 Q66 18 68 38 Q70 54 50 58 Q32 58 30 42 Z" fill="url(#s0)" filter="url(#skin)"/>
    <path d="M60 28 L84 14 L70 34 Z M34 30 L18 22 L30 38 Z" fill="#6E8A44"/>
    <circle cx="56" cy="44" r="2.2" fill="#7A934C"/><circle cx="40" cy="26" r="1.8" fill="#7A934C"/>
    ${eye(40, 36, 3, "#FFD21F")}${eye(54, 35, 2.6, "#FFD21F")}
    ${maw(34, 44, 24, 6, 6)}${drip(40, 52, 9)}`),

  // 1 갑각 괴수: 어두운 갑각판, 집게 턱, 붉은 눈 여러 개
  wrap(`<defs><linearGradient id="s1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3E8A97"/><stop offset=".5" stop-color="#1D4A55"/><stop offset="1" stop-color="#0C2228"/></linearGradient></defs>
    ${shadow(34)}
    ${[30, 46, 62, 78, 94].map((x, i) => `<path d="M${x} 90 L${x - 8 + (i % 2) * 4} 112 L${x + 2} 104" fill="none" stroke-width="3.4" stroke="#0C2228"/>`).join("")}
    <path d="M22 84 Q20 46 62 40 Q104 44 104 84 Q90 98 62 98 Q32 98 22 84 Z" fill="url(#s1)" filter="url(#skin)"/>
    ${[0, 1, 2, 3].map(i => `<path d="M${34 + i * 18} 46 Q${42 + i * 18} 70 ${36 + i * 18} 94" fill="none" stroke="#0A1A1E" stroke-width="2"/><path d="M${40 + i * 18} 44 l3 -10 l4 10" fill="url(#bone)"/>`).join("")}
    <path d="M28 52 Q50 40 92 50" fill="none" stroke="#7FD3E0" stroke-opacity=".5" stroke-width="2"/>
    <path d="M26 64 Q8 56 4 68 Q10 66 16 70 Q6 76 10 84 Q16 74 28 76 Z" fill="url(#bone)"/>
    ${eye(30, 62, 2.4, "#FF2A2A", false)}${eye(38, 58, 2.8, "#FF2A2A")}${eye(34, 70, 2, "#FF2A2A", false)}
    ${maw(18, 74, 14, 5, 4)}`),

  // 2 돌연변이 사냥개: 갈비뼈 드러난 마른 몸, 긴 발톱, 질주
  wrap(`<defs><radialGradient id="s2" cx=".45" cy=".4"><stop offset="0" stop-color="#A879E0"/><stop offset=".6" stop-color="#5B2C8E"/><stop offset="1" stop-color="#25103F"/></radialGradient></defs>
    ${shadow(30)}
    <path d="M92 64 Q116 56 118 40 Q108 54 92 56 Z" fill="#3A1A5E"/>
    <path d="M78 76 L96 104 L88 108 L72 84 Z M46 78 L30 104 L40 108 L54 84 Z" fill="url(#s2)"/>
    ${[[96, 106], [30, 106]].map(([x, y]) => `<path d="M${x - 6} ${y} l-6 4 M${x - 2} ${y + 1} l-4 6 M${x + 2} ${y} l-1 6" stroke="url(#bone)" stroke-width="2.4"/>`).join("")}
    <path d="M40 60 Q46 46 72 48 Q96 50 96 66 Q94 82 70 84 Q46 84 40 72 Z" fill="url(#s2)" filter="url(#skin)"/>
    ${[0, 1, 2, 3, 4].map(i => `<path d="M${54 + i * 7} 58 Q${57 + i * 7} 68 ${53 + i * 7} 78" fill="none" stroke="#1A0A2E" stroke-width="1.6"/>`).join("")}
    <path d="M44 58 Q30 44 14 48 Q4 52 6 62 Q10 72 26 72 Q38 72 46 66 Z" fill="url(#s2)" filter="url(#skin)"/>
    <path d="M24 46 L18 30 L30 42 Z M34 46 L34 28 L40 44 Z" fill="#3A1A5E"/>
    ${eye(20, 54, 2.8, "#B6FF3B")}${eye(30, 52, 2.2, "#B6FF3B", false)}
    ${maw(4, 62, 26, 6, 7)}${drip(12, 68, 10, "#C59BFF")}`),

  // 3 역병 오크 군주 (보스): 근육질, 엄니, 쇠가시 견갑, 쇠사슬, 대형 식칼
  wrap(`<defs>
      <radialGradient id="s3" cx=".45" cy=".35"><stop offset="0" stop-color="#A9BE5A"/><stop offset=".55" stop-color="#6A7F2C"/><stop offset="1" stop-color="#2F3B10"/></radialGradient>
      <radialGradient id="aura3"><stop offset="0" stop-color="#FF4A1A" stop-opacity=".55"/><stop offset="1" stop-color="#FF4A1A" stop-opacity="0"/></radialGradient></defs>
    <circle cx="60" cy="62" r="58" fill="url(#aura3)" stroke="none"/>
    ${shadow(40)}
    <path d="M46 92 L40 112 L56 112 L58 94 Z M74 92 L80 112 L64 112 L62 94 Z" fill="url(#s3)"/>
    <path d="M36 110 h22 v4 h-24 z M62 110 h22 l2 4 h-24 z" fill="url(#leather)"/>
    <path d="M36 82 L42 100 L52 92 L60 102 L68 92 L78 100 L84 82 Z" fill="url(#leather)"/>
    <path d="M30 54 Q28 36 60 34 Q92 36 90 54 L86 86 Q60 94 34 86 Z" fill="url(#s3)" filter="url(#skin)"/>
    <path d="M44 50 Q52 56 60 52 Q68 56 76 50 M46 64 Q52 68 58 64 M62 64 Q68 68 74 64 M48 76 Q60 80 72 76" fill="none" stroke="#2F3B10" stroke-width="1.6"/>
    <path d="M34 80 h52 v7 h-52 z" fill="url(#leather)"/><path d="M53 79 h14 v10 h-14 z" fill="url(#iron)"/><circle cx="60" cy="84" r="2.6" fill="#C8102E"/>
    <path d="M30 46 Q60 70 90 46" fill="none" stroke="url(#iron)" stroke-width="3" stroke-dasharray="4 2"/>
    <path d="M8 46 Q14 26 40 34 L38 56 Q18 60 8 46 Z" fill="url(#iron)"/>
    <path d="M112 46 Q106 26 80 34 L82 56 Q102 60 112 46 Z" fill="url(#iron)"/>
    ${[[12, 36, -40], [22, 30, -20], [32, 28, -5], [108, 36, 40], [98, 30, 20], [88, 28, 5]].map(([x, y, r]) => `<path d="M${x - 3} ${y + 4} L${x} ${y - 12} L${x + 3} ${y + 4} Z" fill="url(#bone)" transform="rotate(${r} ${x} ${y})"/>`).join("")}
    <path d="M10 50 Q2 64 12 78 L22 74 Q16 64 22 54 Z" fill="url(#s3)"/>
    <g transform="rotate(-18 14 76)"><rect x="12" y="62" width="6" height="34" rx="2" fill="url(#leather)"/><path d="M-12 44 Q-2 38 18 42 L18 66 Q0 70 -14 62 Z" fill="url(#rust)"/><path d="M-12 44 Q-14 54 -14 62" stroke="#E6E9EE" stroke-width="2" fill="none"/><circle cx="10" cy="50" r="2" fill="#1E2128" stroke="none"/></g>
    <path d="M108 50 Q118 64 108 80 L98 74 Q104 64 98 54 Z" fill="url(#s3)"/>
    <path d="M42 32 Q40 12 60 10 Q80 12 78 32 Q78 48 60 50 Q42 48 42 32 Z" fill="url(#s3)" filter="url(#skin)"/>
    <path d="M54 10 Q60 0 66 10 Q62 4 60 12 Z" fill="#1A1A1A"/><path d="M60 2 Q66 -4 68 6" fill="none" stroke="#1A1A1A" stroke-width="3"/>
    <path d="M42 24 L32 20 L40 30 Z M78 24 L88 20 L80 30 Z" fill="#6A7F2C"/>
    <path d="M46 22 L57 27 M74 22 L63 27" stroke-width="3"/>
    ${eye(51, 28, 2.6, "#FF2A1A", false)}${eye(69, 28, 2.6, "#FF2A1A", false)}
    <path d="M70 18 l6 12" stroke="#3A1A0A" stroke-width="1.6"/>
    <path d="M48 40 Q60 48 72 40 Q72 46 60 48 Q48 46 48 40 Z" fill="#2A0508"/>
    <path d="M50 42 L46 28 L54 40 Z M70 42 L74 28 L66 40 Z" fill="url(#bone)"/>
    ${[54, 58, 62, 66].map(x => `<path d="M${x - 1.6} 41 L${x} 44 L${x + 1.6} 41 Z" fill="url(#bone)" stroke-width=".6"/>`).join("")}`, "translate(16 8) scale(.86)"),

  // 4 분열 구울: 눈과 입이 여러 개 달린 살덩이, 촉수
  wrap(`<defs><radialGradient id="s4" cx=".45" cy=".4"><stop offset="0" stop-color="#F29AB8"/><stop offset=".6" stop-color="#A3365F"/><stop offset="1" stop-color="#4A0F28"/></radialGradient></defs>
    ${shadow(30)}
    ${[[30, 96, 10, 112], [50, 100, 46, 116], [74, 100, 80, 116], [92, 94, 104, 110]].map(([a, b, c, d]) => `<path d="M${a} ${b} Q${(a + c) / 2 - 6} ${(b + d) / 2} ${c} ${d}" fill="none" stroke="#4A0F28" stroke-width="5"/>`).join("")}
    <path d="M22 70 Q14 40 40 34 Q50 18 72 26 Q100 30 100 60 Q108 88 84 98 Q62 106 40 98 Q22 92 22 70 Z" fill="url(#s4)" filter="url(#skin)"/>
    <path d="M60 28 Q56 64 62 100" fill="none" stroke="#6A1838" stroke-width="2" stroke-dasharray="5 3"/>
    ${[[36, 50, 4], [52, 40, 3], [76, 44, 4.6], [88, 62, 3], [44, 70, 3.2], [70, 64, 2.4]].map(([x, y, r]) => eye(x, y, r, "#FFF3A0", false)).join("")}
    ${maw(30, 78, 22, 5, 5)}${maw(64, 80, 22, 6, 5)}${drip(40, 86, 8, "#F7B3CE")}`),

  // 5 강철 내성 골렘: 철판·리벳·가시, 붉은 바이저 틈
  wrap(`<defs><radialGradient id="s5" cx=".4" cy=".3"><stop offset="0" stop-color="#7F8A96"/><stop offset=".6" stop-color="#3C444E"/><stop offset="1" stop-color="#14181D"/></radialGradient></defs>
    ${shadow(32)}
    <path d="M40 92 L36 112 L52 112 L54 94 Z M80 92 L84 112 L68 112 L66 94 Z" fill="url(#iron)"/>
    ${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI * .95 + i * Math.PI * .21; const cx = 60 + Math.cos(a) * 40, cy = 62 + Math.sin(a) * 36; return `<path d="M${(cx - 4).toFixed(1)} ${cy.toFixed(1)} L${(60 + Math.cos(a) * 54).toFixed(1)} ${(62 + Math.sin(a) * 50).toFixed(1)} L${(cx + 4).toFixed(1)} ${cy.toFixed(1)} Z" fill="url(#iron)"/>`; }).join("")}
    <path d="M20 64 Q20 26 60 24 Q100 26 100 64 Q100 98 60 100 Q20 98 20 64 Z" fill="url(#s5)"/>
    <path d="M24 56 Q60 36 96 56 L96 66 Q60 48 24 66 Z" fill="url(#iron)"/>
    <path d="M26 74 Q60 64 94 74" fill="none" stroke="#0E1115" stroke-width="2"/>
    ${[[30, 60], [44, 52], [60, 49], [76, 52], [90, 60], [34, 82], [86, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#B8C0CA"/>`).join("")}
    <rect x="28" y="62" width="42" height="9" rx="3" fill="#0E1115"/>
    <g filter="url(#glow)"><rect x="31" y="64.5" width="36" height="4" rx="2" fill="#FF2A1A"/></g>
    ${maw(32, 80, 30, 5, 6)}`),

  // 6 흡혈 모기악마: 핏줄 날개, 긴 침, 붉은 겹눈
  wrap(`<defs><radialGradient id="s6" cx=".4" cy=".35"><stop offset="0" stop-color="#8C5A3A"/><stop offset=".6" stop-color="#4A2A18"/><stop offset="1" stop-color="#1E0F08"/></radialGradient></defs>
    <ellipse cx="60" cy="114" rx="16" ry="3.5" fill="#000" opacity=".25" stroke="none"/>
    <path d="M62 52 Q40 6 14 16 Q26 40 58 60 Z M66 52 Q96 4 116 22 Q100 44 66 60 Z" fill="#D9E4F0" fill-opacity=".55"/>
    <path d="M60 54 Q40 20 20 18 M60 56 Q36 34 18 30 M68 54 Q92 18 110 22 M68 56 Q96 34 112 34" fill="none" stroke="#7A2A2A" stroke-width="1" opacity=".8"/>
    <path d="M56 80 L38 108 M62 82 L58 114 M72 80 L88 108 M66 82 L72 114" stroke="#1E0F08" stroke-width="2.4"/>
    <ellipse cx="66" cy="76" rx="14" ry="18" fill="url(#s6)" filter="url(#skin)"/>
    ${[66, 74, 82].map(y => `<path d="M54 ${y} Q66 ${y + 4} 78 ${y}" fill="none" stroke="#1E0F08" stroke-width="1.4"/>`).join("")}
    <g filter="url(#glow)"><ellipse cx="72" cy="80" rx="6" ry="8" fill="#8A0A12" opacity=".8"/></g>
    <circle cx="56" cy="50" r="12" fill="url(#s6)" filter="url(#skin)"/>
    <g filter="url(#glow)"><ellipse cx="50" cy="48" rx="5" ry="6" fill="#E01E2A"/><ellipse cx="62" cy="46" rx="4" ry="5" fill="#E01E2A"/></g>
    <path d="M48 46 l1 2 M51 50 l1 2 M60 44 l1 2" stroke="#FF9A9A" stroke-width="1"/>
    <path d="M46 56 L14 76 L16 78 L48 60 Z" fill="#1E0F08"/><path d="M54 40 L46 26 M58 39 L58 24" stroke="#1E0F08" stroke-width="1.6"/>`),

  // 7 슈퍼박테리아 군주 (최종 보스): 뿔·불꽃 오라·톱니 아가리·촉수·검은 왕관
  wrap(`<defs>
      <radialGradient id="s7" cx=".45" cy=".35"><stop offset="0" stop-color="#E0453A"/><stop offset=".55" stop-color="#8E1414"/><stop offset="1" stop-color="#2E0404"/></radialGradient>
      <radialGradient id="aura7"><stop offset="0" stop-color="#FF6A00" stop-opacity=".7"/><stop offset=".6" stop-color="#C8102E" stop-opacity=".3"/><stop offset="1" stop-color="#C8102E" stop-opacity="0"/></radialGradient>
      <linearGradient id="crown7" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3A3A44"/><stop offset="1" stop-color="#0E0E12"/></linearGradient></defs>
    <circle cx="60" cy="60" r="60" fill="url(#aura7)" stroke="none"/>
    ${[18, 36, 52, 68, 84, 102].map((x, i) => `<path d="M${x} 66 Q${x + (i % 2 ? 10 : -10)} 40 ${x + (i % 2 ? -4 : 4)} 18" fill="none" stroke="#FF8A1A" stroke-width="2" opacity=".55" filter="url(#glow)"/>`).join("")}
    ${shadow(42)}
    ${[[26, 92, 2, 112], [42, 100, 30, 118], [78, 100, 90, 118], [94, 92, 118, 110], [20, 76, 0, 86], [100, 76, 120, 84]].map(([a, b, c, d]) => `<path d="M${a} ${b} Q${(a + c) / 2} ${b + 4} ${c} ${d}" fill="none" stroke="#2E0404" stroke-width="6"/><path d="M${a} ${b} Q${(a + c) / 2} ${b + 4} ${c} ${d}" fill="none" stroke="#B3201A" stroke-width="2.4"/>`).join("")}
    <path d="M16 66 Q14 28 60 24 Q106 28 104 66 Q104 104 60 106 Q16 104 16 66 Z" fill="url(#s7)" filter="url(#skin)"/>
    <path d="M24 48 Q60 30 96 48" fill="none" stroke="#FF8A6A" stroke-opacity=".55" stroke-width="2"/>
    <path d="M30 32 Q14 12 6 18 Q18 22 24 40 Z M90 32 Q106 12 114 18 Q102 22 96 40 Z" fill="url(#bone)"/>
    <path d="M36 28 L40 6 L48 20 L54 2 L60 18 L66 2 L72 20 L80 6 L84 28 Z" fill="url(#crown7)"/>
    <g filter="url(#glow)"><circle cx="54" cy="16" r="2" fill="#FF2A1A"/><circle cx="66" cy="16" r="2" fill="#FF2A1A"/><circle cx="60" cy="22" r="2.6" fill="#FF2A1A"/></g>
    ${eye(40, 56, 4.4, "#FFE14A")}${eye(64, 54, 4.4, "#FFE14A")}${eye(84, 62, 2.6, "#FFE14A", false)}${eye(30, 68, 2.2, "#FFE14A", false)}
    ${maw(26, 72, 60, 11, 11)}${drip(38, 88, 10, "#FF6A3A")}${drip(70, 90, 8, "#FF6A3A")}`, "translate(8 8) scale(.87)"),
];
