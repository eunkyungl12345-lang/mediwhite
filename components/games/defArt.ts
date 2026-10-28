/** 병동 사수 그림: 의료진(영웅)과 세균 괴물. SVG를 한 번 래스터화해서 캔버스에 그려요.
 *  public/game/def/<key>.webp 가 있으면 그 그림을 우선 써요(나중에 AI 고퀄 이미지로 교체용). */
const SKIN = "#F6D2B8", SKIN2 = "#E7B596", OUT = "#1E2533";
const defs = `<defs>
<linearGradient id="metal" x1="0" x2="1"><stop offset="0" stop-color="#5D6B7E"/><stop offset=".5" stop-color="#E9EEF4"/><stop offset="1" stop-color="#6E7C8F"/></linearGradient>
<linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#A86F12"/><stop offset=".5" stop-color="#FFE38A"/><stop offset="1" stop-color="#B07A16"/></linearGradient>
<radialGradient id="glowB"><stop offset="0" stop-color="#9FE7FF"/><stop offset="1" stop-color="#9FE7FF" stop-opacity="0"/></radialGradient>
<radialGradient id="glowY"><stop offset="0" stop-color="#FFF27A"/><stop offset="1" stop-color="#FFF27A" stop-opacity="0"/></radialGradient>
<radialGradient id="glowR"><stop offset="0" stop-color="#FF5A4E"/><stop offset="1" stop-color="#FF5A4E" stop-opacity="0"/></radialGradient>
<radialGradient id="glowG"><stop offset="0" stop-color="#8CFF6A"/><stop offset="1" stop-color="#8CFF6A" stop-opacity="0"/></radialGradient>
<radialGradient id="glowP"><stop offset="0" stop-color="#C9A2FF"/><stop offset="1" stop-color="#C9A2FF" stop-opacity="0"/></radialGradient>
</defs>`;
const wrap = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="160" height="160">${defs}<g stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;

/** 영웅 공통 몸통: 옷 색, 바지 색, 머리 모양, 모자 */
function hero(o: { coat: string; coat2: string; pants: string; hair: string; hat?: string; extra?: string; weapon: string; back?: string; face?: string }) {
  return wrap(`
  <ellipse cx="50" cy="95" rx="22" ry="4" fill="#000" opacity=".18" stroke="none"/>
  ${o.back ?? ""}
  <path d="M41 74 L39 92 L47 92 L49 76 Z M59 74 L61 92 L53 92 L51 76 Z" fill="${o.pants}"/>
  <path d="M37 91 h11 v4 h-12 z M52 91 h11 l1 4 h-12 z" fill="#2A2F3A"/>
  <path d="M33 50 Q50 42 67 50 L70 78 Q50 84 30 78 Z" fill="${o.coat}"/>
  <path d="M50 46 L50 80" stroke="${o.coat2}" stroke-width="2.4"/>
  <path d="M33 50 Q30 62 31 74 L37 74 L38 56 Z M67 50 Q70 62 69 74 L63 74 L62 56 Z" fill="${o.coat2}"/>
  <circle cx="50" cy="33" r="14" fill="${SKIN}"/>
  <path d="M36 32 Q37 17 50 17 Q64 17 64 32 Q60 24 50 24 Q41 24 36 32 Z" fill="${o.hair}"/>
  ${o.face ?? `<ellipse cx="45" cy="34" rx="1.9" ry="2.6" fill="${OUT}" stroke="none"/><ellipse cx="55" cy="34" rx="1.9" ry="2.6" fill="${OUT}" stroke="none"/><path d="M46 40 Q50 42.5 54 40" fill="none"/><ellipse cx="41" cy="38.5" rx="2.6" ry="1.5" fill="#FF9A9A" opacity=".55" stroke="none"/><ellipse cx="59" cy="38.5" rx="2.6" ry="1.5" fill="#FF9A9A" opacity=".55" stroke="none"/>`}
  ${o.hat ?? ""}
  ${o.extra ?? ""}
  ${o.weapon}`);
}

export const HERO_SVG: Record<string, string> = {
  // 수액 걸이: 생산 오브젝트
  iv: wrap(`<ellipse cx="50" cy="95" rx="18" ry="3.5" fill="#000" opacity=".18" stroke="none"/>
    <path d="M38 93 L62 93 M50 93 L50 20 M42 93 l-4 2 M58 93 l4 2" stroke-width="3" fill="none" stroke="#8592A3"/>
    <path d="M50 20 h12" stroke-width="3" stroke="#8592A3"/>
    <circle cx="50" cy="40" r="18" fill="url(#glowB)" stroke="none" opacity=".9"/>
    <path d="M56 22 h12 a3 3 0 0 1 3 3 v22 a8 8 0 0 1 -8 8 h-2 a8 8 0 0 1 -8 -8 v-22 a3 3 0 0 1 3 -3 z" fill="#CFF4FF" opacity=".95"/>
    <path d="M55 38 h16 v9 a8 8 0 0 1 -8 8 h-0 a8 8 0 0 1 -8 -8 z" fill="#47C6E8" stroke="none"/>
    <path d="M62 55 Q60 70 52 78" fill="none" stroke="#7FD8F0" stroke-width="2"/>
    <circle cx="58" cy="30" r="1.5" fill="#fff" stroke="none"/>`),
  nurse: hero({ coat: "#FFFFFF", coat2: "#F48FB1", pants: "#F8BBD0", hair: "#3B2A24",
    hat: `<path d="M40 19 L60 19 L58 12 L42 12 Z" fill="#fff"/><path d="M48 13 h4 v5 h-4 z M46 14.5 h8 v2 h-8z" fill="#E2574C" stroke="none"/>`,
    weapon: `<g transform="rotate(-8 70 60)"><rect x="60" y="54" width="30" height="9" rx="2" fill="#E8F7FF"/><rect x="62" y="56" width="18" height="5" fill="#5FD1F5" stroke="none"/><path d="M90 58.5 h8" stroke-width="1.4"/><rect x="55" y="53" width="6" height="11" rx="1.5" fill="url(#metal)"/><circle cx="98" cy="58.5" r="4" fill="url(#glowB)" stroke="none"/></g>
      <circle cx="62" cy="60" r="4" fill="${SKIN}"/>` }),
  wall: wrap(`<ellipse cx="50" cy="95" rx="30" ry="4" fill="#000" opacity=".2" stroke="none"/>
    <path d="M18 92 L22 40 L78 40 L82 92 Z" fill="#8C6A3D"/>
    <path d="M22 50 L78 50 M21 64 L79 64 M20 78 L80 78" stroke="#5E4422"/>
    <path d="M24 44 L76 88 M76 44 L24 88" stroke="#F2C230" stroke-width="5"/><path d="M24 44 L76 88 M76 44 L24 88" stroke="${OUT}" stroke-width="1" />
    <rect x="30" y="30" width="40" height="12" rx="2" fill="#E2574C"/><text x="50" y="39.5" font-size="8" text-anchor="middle" fill="#fff" stroke="none" font-weight="900" font-family="sans-serif">원무과</text>
    <circle cx="22" cy="40" r="3" fill="url(#metal)"/><circle cx="78" cy="40" r="3" fill="url(#metal)"/>`),
  xray: hero({ coat: "#6E5BB8", coat2: "#9F8BE8", pants: "#3E3570", hair: "#1F1B2E",
    extra: `<rect x="38" y="52" width="24" height="18" rx="3" fill="#2A2F45"/><path d="M42 61 h16 M50 55 v12" stroke="#B9A6FF"/>`,
    face: `<rect x="40" y="30" width="20" height="7" rx="3" fill="#2A2F45"/><rect x="41.5" y="31.5" width="17" height="4" rx="2" fill="#9EFFF0" stroke="none"/><path d="M46 41 Q50 42.5 54 41" fill="none"/>`,
    weapon: `<circle cx="96" cy="58" r="9" fill="url(#glowR)" stroke="none"/><rect x="58" y="51" width="34" height="13" rx="4" fill="#3B3F52"/><rect x="62" y="54" width="22" height="7" rx="2" fill="url(#metal)"/><circle cx="92" cy="57.5" r="4" fill="#FF6A5E"/><path d="M66 64 l-4 8 h6 z" fill="#3B3F52"/><circle cx="62" cy="60" r="4" fill="${SKIN}"/>` }),
  doctor: hero({ coat: "#FFFFFF", coat2: "#DCE6F2", pants: "#2F4A6B", hair: "#26211F",
    extra: `<path d="M42 50 Q40 64 47 66 M58 50 Q60 64 53 66" fill="none" stroke="#2D3748" stroke-width="2"/><circle cx="50" cy="68" r="3" fill="url(#metal)"/>`,
    weapon: `<g transform="rotate(-4 70 60)"><rect x="56" y="54" width="14" height="10" rx="3" fill="#6B4A2B"/><rect x="66" y="53" width="30" height="5" rx="2" fill="url(#metal)"/><rect x="66" y="58" width="30" height="5" rx="2" fill="url(#metal)"/><rect x="72" y="52" width="6" height="12" rx="1" fill="#3A3F4B"/><path d="M96 55.5 h3 M96 60.5 h3" stroke-width="2.2"/></g><circle cx="60" cy="60" r="4" fill="${SKIN}"/>` }),
  ortho: hero({ coat: "#2E7D6B", coat2: "#4FB59A", pants: "#1E4F44", hair: "#4A2C1A",
    extra: `<path d="M34 52 Q50 58 66 52 L66 58 Q50 64 34 58 Z" fill="url(#metal)"/><circle cx="34" cy="53" r="5" fill="url(#metal)"/><circle cx="66" cy="53" r="5" fill="url(#metal)"/>`,
    face: `<path d="M43 33 l5 1.5 M57 33 l-5 1.5" stroke-width="2"/><ellipse cx="45.5" cy="35.5" rx="1.8" ry="2.2" fill="${OUT}" stroke="none"/><ellipse cx="54.5" cy="35.5" rx="1.8" ry="2.2" fill="${OUT}" stroke="none"/><path d="M45 41 h10" />`,
    weapon: `<g transform="rotate(28 66 60)"><rect x="64" y="22" width="5" height="44" rx="2" fill="#6B4A2B"/><rect x="51" y="8" width="32" height="18" rx="3" fill="url(#metal)"/><rect x="51" y="12" width="32" height="4" fill="#3B4250" stroke="none"/><circle cx="67" cy="17" r="13" fill="url(#glowY)" stroke="none" opacity=".6"/></g><circle cx="64" cy="60" r="4.5" fill="${SKIN}"/>` }),
  anes: hero({ coat: "#5B4B8A", coat2: "#8C7AC9", pants: "#2E2650", hair: "#141020",
    face: `<path d="M38 33 Q50 30 62 33 L60 44 Q50 48 40 44 Z" fill="#3A3F4B"/><circle cx="45" cy="36" r="3.4" fill="#C9A2FF"/><circle cx="55" cy="36" r="3.4" fill="#C9A2FF"/><circle cx="50" cy="45" r="4" fill="url(#metal)"/>`,
    back: `<rect x="56" y="44" width="12" height="26" rx="5" fill="#8C7AC9"/><path d="M60 44 v-3 h4 v3" fill="#5B4B8A"/>`,
    weapon: `<circle cx="92" cy="56" r="10" fill="url(#glowP)" stroke="none"/><path d="M60 58 Q75 52 86 56" fill="none" stroke="#3A3F4B" stroke-width="3"/><path d="M84 52 l10 2 l-1 7 l-10 -1 z" fill="url(#metal)"/><circle cx="62" cy="60" r="4" fill="${SKIN}"/>` }),
  lab: hero({ coat: "#E8FFF0", coat2: "#7ED69B", pants: "#2D5A3D", hair: "#7A4B2A",
    face: `<circle cx="45" cy="34" r="4.2" fill="#fff" opacity=".6"/><circle cx="55" cy="34" r="4.2" fill="#fff" opacity=".6"/><path d="M49.2 34 h1.6"/><circle cx="45" cy="34" r="1.6" fill="${OUT}" stroke="none"/><circle cx="55" cy="34" r="1.6" fill="${OUT}" stroke="none"/><path d="M46 41 Q50 43 54 41" fill="none"/>`,
    weapon: `<circle cx="72" cy="44" r="12" fill="url(#glowG)" stroke="none"/><path d="M68 32 h8 v8 l7 14 a4 4 0 0 1 -4 5 h-14 a4 4 0 0 1 -4 -5 l7 -14 z" fill="#DFFFE6"/><path d="M63 50 h18 l2 4 a4 4 0 0 1 -4 5 h-14 a4 4 0 0 1 -4 -5 z" fill="#5BE37D" stroke="none"/><circle cx="70" cy="53" r="1.6" fill="#fff" stroke="none"/><circle cx="64" cy="61" r="4" fill="${SKIN}"/>` }),
  ems: hero({ coat: "#F2A900", coat2: "#FFD15C", pants: "#2B3A55", hair: "#1C1C1C",
    extra: `<path d="M33 60 h34 v4 h-34 z" fill="#E9EEF4"/><path d="M47 52 h6 v4 h4 v6 h-4 v4 h-6 v-4 h-4 v-6 h4 z" fill="#E2574C" transform="translate(0 -2) scale(1)"/>`,
    hat: `<path d="M35 26 Q50 12 65 26 L67 28 L33 28 Z" fill="#2B3A55"/><path d="M33 28 h34 l4 2 h-42 z" fill="#1A2236"/>`,
    weapon: `<circle cx="84" cy="44" r="14" fill="url(#glowY)" stroke="none"/><rect x="60" y="54" width="14" height="10" rx="2" fill="#E2574C"/><path d="M70 54 L84 34 M74 58 L90 44" stroke="#3A3F4B" stroke-width="2"/><path d="M82 30 l6 2 l-4 6 l5 1 l-9 10 l3 -8 l-5 -1 z" fill="#FFF27A"/><circle cx="62" cy="60" r="4" fill="${SKIN}"/>` }),
  ornurse: hero({ coat: "#2F8F8A", coat2: "#59C2BB", pants: "#1E5E5A", hair: "#2C1E18",
    hat: `<path d="M36 26 Q50 13 64 26 Q50 22 36 26 Z" fill="#59C2BB"/><circle cx="44" cy="20" r="1.2" fill="#fff" stroke="none"/><circle cx="53" cy="18" r="1.2" fill="#fff" stroke="none"/>`,
    face: `<ellipse cx="45" cy="33" rx="1.9" ry="2.4" fill="${OUT}" stroke="none"/><ellipse cx="55" cy="33" rx="1.9" ry="2.4" fill="${OUT}" stroke="none"/><path d="M39 37 Q50 35 61 37 L60 44 Q50 47 40 44 Z" fill="#BFE9E6"/>`,
    weapon: `<g fill="url(#metal)"><path d="M62 46 l22 -8 l2 3 l-22 8 z"/><path d="M62 52 l26 -2 l0 3 l-26 2 z"/><path d="M62 58 l22 6 l-1 3 l-22 -6 z"/></g><circle cx="62" cy="54" r="4" fill="${SKIN}"/>` }),
};

/** 세균 괴물 0~7 */
const eye = (x: number, y: number, r = 3.4, c = "#FFEB3B") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><ellipse cx="${x + .4}" cy="${y}" rx="${r * .35}" ry="${r * .8}" fill="#120" stroke="none"/>`;
const fangs = (x: number, y: number, w: number, n = 4) => `<path d="M${x} ${y} Q${x + w / 2} ${y + 10} ${x + w} ${y} Z" fill="#3A0A0A"/>` + Array.from({ length: n }, (_, i) => { const px = x + (i + .5) * w / n; return `<path d="M${px - 2} ${y + .5} L${px} ${y + 5} L${px + 2} ${y + .5} Z" fill="#FFF8E1" stroke-width="1"/>`; }).join("");
const spikes = (cx: number, cy: number, r: number, n: number, c: string, len = 8) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2, x1 = cx + Math.cos(a - .18) * r, y1 = cy + Math.sin(a - .18) * r, x2 = cx + Math.cos(a + .18) * r, y2 = cy + Math.sin(a + .18) * r, tx = cx + Math.cos(a) * (r + len), ty = cy + Math.sin(a) * (r + len); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${c}"/>`; }).join("");

export const GERM_SVG: string[] = [
  // 0 고블린균: 뾰족 초록 덩어리 + 송곳니
  wrap(`<ellipse cx="50" cy="94" rx="22" ry="4" fill="#000" opacity=".2" stroke="none"/>
    ${spikes(50, 58, 26, 11, "#3E8E3A")}
    <path d="M24 60 Q22 34 50 32 Q78 34 76 60 Q76 86 50 88 Q24 86 24 60 Z" fill="#6CC04A"/>
    <path d="M30 70 Q50 80 70 70" fill="none" stroke="#3E8E3A" stroke-width="1.2"/>
    <circle cx="36" cy="46" r="3" fill="#A5E07E" stroke="none"/><circle cx="64" cy="76" r="2.5" fill="#A5E07E" stroke="none"/>
    <path d="M34 47 l10 4 M66 47 l-10 4" stroke-width="2.6"/>${eye(40, 54)}${eye(60, 54)}${fangs(38, 64, 24, 5)}
    <path d="M22 66 Q12 70 14 80 M78 66 Q88 70 86 80" fill="none" stroke="#3E8E3A" stroke-width="4"/>`),
  // 1 갑각균: 껍데기 두른 탱커
  wrap(`<ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity=".2" stroke="none"/>
    <path d="M20 70 Q18 38 50 34 Q82 38 80 70 Q78 90 50 90 Q22 90 20 70 Z" fill="#4BA3B5"/>
    <path d="M22 58 Q50 26 78 58 Q50 48 22 58 Z" fill="#2E6F80"/><path d="M30 46 l4 -10 l4 8 M46 40 l4 -12 l4 12 M62 44 l4 -9 l4 9" fill="#BFE7EF"/>
    <path d="M24 74 Q50 84 76 74" fill="none" stroke="#2E6F80" stroke-width="2"/>
    ${eye(40, 62, 3.6, "#FF8A65")}${eye(60, 62, 3.6, "#FF8A65")}${fangs(40, 70, 20, 4)}`),
  // 2 돌연변이 러너: 길쭉한 보라 + 발톱
  wrap(`<ellipse cx="50" cy="94" rx="20" ry="3.5" fill="#000" opacity=".2" stroke="none"/>
    <path d="M38 92 L42 74 M62 92 L58 74" stroke-width="4" stroke="#6A2F9E"/>
    <path d="M30 60 Q26 30 52 26 Q78 30 72 58 Q68 80 50 80 Q32 80 30 60 Z" fill="#A45EE0"/>
    <path d="M52 26 Q60 12 70 14 Q62 18 60 28" fill="#6A2F9E"/>
    <path d="M28 58 Q10 54 8 66 l6 -2 l-2 6 l6 -3 l0 6 Q18 62 30 64 Z" fill="#E0C3FF"/>
    ${eye(42, 46, 4, "#B9FF5C")}${eye(60, 44, 3, "#B9FF5C")}${fangs(38, 58, 26, 6)}`),
  // 3 역병 오크 보스: 엄니·어깨 가시갑옷·뿔
  wrap(`<ellipse cx="50" cy="95" rx="34" ry="4.5" fill="#000" opacity=".25" stroke="none"/>
    <circle cx="50" cy="55" r="40" fill="url(#glowR)" stroke="none" opacity=".35"/>
    <path d="M36 80 L32 94 L44 94 L46 82 Z M64 80 L68 94 L56 94 L54 82 Z" fill="#5C3A1E"/>
    <path d="M22 56 Q18 40 50 36 Q82 40 78 56 L74 84 Q50 92 26 84 Z" fill="#7BA23F"/>
    <path d="M28 70 h44 v8 h-44 z" fill="#5C3A1E"/><rect x="45" y="69" width="10" height="10" rx="2" fill="url(#gold)"/>
    <path d="M12 46 Q22 30 38 40 L34 56 Q20 58 12 46 Z M88 46 Q78 30 62 40 L66 56 Q80 58 88 46 Z" fill="#B23A2E"/>
    <path d="M16 40 l-4 -10 l9 6 M26 34 l-1 -11 l7 8 M84 40 l4 -10 l-9 6 M74 34 l1 -11 l-7 8" fill="url(#metal)"/>
    <path d="M36 36 Q36 18 50 16 Q64 18 64 36 Q64 46 50 48 Q36 46 36 36 Z" fill="#8DB548"/>
    <path d="M38 22 L30 8 L42 18 M62 22 L70 8 L58 18" fill="#E8DCC0"/>
    <path d="M40 30 l8 3 M60 30 l-8 3" stroke-width="2.6"/>${eye(44, 33, 2.8, "#FF3B30")}${eye(56, 33, 2.8, "#FF3B30")}
    <path d="M42 42 Q50 46 58 42" fill="#3A0A0A"/><path d="M42 44 l-2 -9 l5 6 Z M58 44 l2 -9 l-5 6 Z" fill="#FFF8E1"/>
    <path d="M80 50 L96 22 M93 18 l8 6 l-6 6 l-6 -6 z" stroke-width="2.4" fill="url(#metal)"/>`),
  // 4 분열균: 눈 여러 개 분홍 덩어리
  wrap(`<ellipse cx="50" cy="94" rx="24" ry="4" fill="#000" opacity=".2" stroke="none"/>
    <path d="M22 66 Q16 44 34 38 Q40 26 56 30 Q78 30 80 54 Q86 76 66 86 Q50 94 34 86 Q20 80 22 66 Z" fill="#F08BC2"/>
    <path d="M50 30 Q50 60 52 88" fill="none" stroke="#C2448A" stroke-dasharray="3 3"/>
    ${eye(36, 52, 3.4, "#fff")}${eye(48, 44, 2.6, "#fff")}${eye(62, 48, 4, "#fff")}${eye(70, 62, 2.4, "#fff")}${eye(40, 66, 2.2, "#fff")}
    ${fangs(46, 70, 20, 4)}`),
  // 5 강철 내성균: 금속판 + 리벳
  wrap(`<ellipse cx="50" cy="94" rx="24" ry="4" fill="#000" opacity=".2" stroke="none"/>
    ${spikes(50, 60, 26, 8, "#7D8A99", 7)}
    <path d="M24 60 Q24 34 50 34 Q76 34 76 60 Q76 86 50 88 Q24 86 24 60 Z" fill="#90A4AE"/>
    <path d="M26 52 Q50 40 74 52 L74 60 Q50 50 26 60 Z" fill="url(#metal)"/>
    <circle cx="32" cy="55" r="1.6" fill="#37474F" stroke="none"/><circle cx="68" cy="55" r="1.6" fill="#37474F" stroke="none"/>
    <rect x="34" y="60" width="32" height="8" rx="3" fill="#37474F"/><circle cx="42" cy="64" r="2.4" fill="#FF5252" stroke="none"/><circle cx="58" cy="64" r="2.4" fill="#FF5252" stroke="none"/>
    ${fangs(40, 72, 20, 4)}`),
  // 6 모기 악마: 날개 + 침
  wrap(`<ellipse cx="50" cy="94" rx="14" ry="3" fill="#000" opacity=".15" stroke="none"/>
    <path d="M48 46 Q20 18 10 34 Q22 46 48 52 Z M52 46 Q80 18 90 34 Q78 46 52 52 Z" fill="#E6F0FF" opacity=".75"/>
    <path d="M40 66 L28 86 M48 68 L44 90 M60 66 L72 86" stroke-width="2" stroke="#5A4630"/>
    <ellipse cx="50" cy="58" rx="13" ry="16" fill="#8B6B45"/><path d="M40 54 h20 M39 62 h22 M41 70 h18" stroke="#5A4630"/>
    <circle cx="50" cy="40" r="10" fill="#A3825A"/>${eye(45, 39, 3.2, "#FF3B30")}${eye(55, 39, 3.2, "#FF3B30")}
    <path d="M48 46 L36 58 L50 49 Z" fill="#3A2A1A"/>`),
  // 7 슈퍼박테리아 왕: 왕관 + 붉은 오라 + 촉수
  wrap(`<ellipse cx="50" cy="95" rx="34" ry="4.5" fill="#000" opacity=".25" stroke="none"/>
    <circle cx="50" cy="58" r="44" fill="url(#glowR)" stroke="none" opacity=".5"/>
    <path d="M24 78 Q8 84 6 72 Q14 76 22 70 M76 78 Q92 84 94 72 Q86 76 78 70 M34 86 Q30 98 20 96 M66 86 Q70 98 80 96" fill="none" stroke="#7A1010" stroke-width="5"/>
    ${spikes(50, 60, 30, 14, "#7A1010", 9)}
    <path d="M20 60 Q20 30 50 28 Q80 30 80 60 Q80 90 50 92 Q20 90 20 60 Z" fill="#C62828"/>
    <path d="M30 46 Q50 36 70 46" fill="none" stroke="#FF8A80" stroke-width="2"/>
    <path d="M32 30 L36 14 L44 24 L50 10 L56 24 L64 14 L68 30 Z" fill="url(#gold)"/><circle cx="50" cy="20" r="2.4" fill="#4FC3F7"/>
    <path d="M34 48 l12 5 M66 48 l-12 5" stroke-width="3"/>${eye(40, 56, 4.4, "#FFD600")}${eye(60, 56, 4.4, "#FFD600")}
    ${fangs(34, 68, 32, 7)}`),
];

/** SVG → 캔버스 이미지 캐시. webp 원화가 있으면 그걸 써요 */
/** 고퀄 원화(webp)를 넣으면 여기에 키를 추가해요 */
export const HAS_WEBP = new Set<string>([]);
const cache: Record<string, CanvasImageSource | null> = {};
export function art(key: string, svg: string): CanvasImageSource | null {
  if (key in cache) return cache[key];
  cache[key] = null;
  if (typeof window === "undefined") return null;
  const load = (src: string, fallback?: () => void) => { const im = new Image(); im.onload = () => { cache[key] = im; }; im.onerror = () => fallback?.(); im.src = src; };
  const svgSrc = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  if (HAS_WEBP.has(key)) load(`/game/def/${key}.webp`, () => load(svgSrc)); else load(svgSrc);
  return null;
}
