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
const wrap = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="160" height="160">${defs}<g stroke="${OUT}" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;

/** 영웅 공통 몸통 (세련된 비율: 작은 머리·긴 몸·음영) */
function hero(o: { coat: string; coat2: string; pants: string; hair: string; hat?: string; extra?: string; weapon: string; back?: string; face?: string }) {
  return wrap(`
  <defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="${o.coat}"/><stop offset=".55" stop-color="${o.coat}"/><stop offset="1" stop-color="${o.coat2}"/></linearGradient>
  <linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="${o.pants}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
  <radialGradient id="sk" cx=".4" cy=".35"><stop offset="0" stop-color="#FBE3D2"/><stop offset="1" stop-color="${SKIN2}"/></radialGradient>
  <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${o.hair}"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient></defs>
  <ellipse cx="50" cy="95.5" rx="20" ry="3.5" fill="#000" opacity=".22" stroke="none"/>
  ${o.back ?? ""}
  <path d="M43 74 L42 92.5 L48 92.5 L49.5 76 Z M57 74 L58 92.5 L52 92.5 L50.5 76 Z" fill="url(#pg)"/>
  <path d="M40.5 92 h8.5 v3 h-9.5 z M51 92 h8.5 l1 3 h-9.5 z" fill="#1A1E28"/>
  <path d="M36 49 Q50 43 64 49 L67.5 79 Q50 84.5 32.5 79 Z" fill="url(#cg)"/>
  <path d="M50 46 L50 81" stroke="${o.coat2}" stroke-width="1.8"/>
  <path d="M44 46 L50 55 L56 46" fill="none" stroke="${o.coat2}" stroke-width="1.6"/>
  <path d="M36 49 Q32.5 62 33.5 75 L38.5 75 L39.5 56 Z M64 49 Q67.5 62 66.5 75 L61.5 75 L60.5 56 Z" fill="${o.coat2}"/>
  <path d="M38 52 Q36 64 37 76" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>
  <path d="M46.5 40 h7 v6 h-7 z" fill="url(#sk)"/>
  <ellipse cx="50" cy="31.5" rx="11.5" ry="12.5" fill="url(#sk)"/>
  <path d="M38.2 31 Q38 17.5 50.5 17.2 Q63 17.5 62 31 Q60.5 23.5 53 22 Q55 26 50 27 Q44 25.5 41.5 25.5 Q39.5 27.5 38.2 31 Z" fill="url(#hg)"/>
  <path d="M44 20.5 Q50 18.8 56 20.5" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.1"/>
  ${o.face ?? `<path d="M42.5 30.2 l5 -.6 M57.5 30.2 l-5 -.6" stroke-width="1.3"/><path d="M42.8 33.6 Q45.2 31.8 47.6 33.6 Q45.2 35 42.8 33.6 Z" fill="${OUT}" stroke="none"/><path d="M52.4 33.6 Q54.8 31.8 57.2 33.6 Q54.8 35 52.4 33.6 Z" fill="${OUT}" stroke="none"/><circle cx="46" cy="33.1" r=".55" fill="#fff" stroke="none"/><circle cx="55.6" cy="33.1" r=".55" fill="#fff" stroke="none"/><path d="M50 34.5 l-.8 3.2 h1.6" fill="none" stroke-width=".9" stroke-opacity=".6"/><path d="M47.2 39.6 Q50 40.6 52.8 39.6" fill="none" stroke-width="1.1"/>`}
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
  punk: hero({ coat: "#FF8A3D", coat2: "#FFB37A", pants: "#3A4C6B", hair: "#5A3A22",
    hat: `<path d="M35 25 Q50 10 65 25 L66 27 L34 27 Z" fill="#E2574C"/><path d="M60 26 h12 l-2 3 h-10 z" fill="#B23A2E"/>`,
    face: `<ellipse cx="45" cy="34" rx="2" ry="2.8" fill="#1E2533" stroke="none"/><ellipse cx="55" cy="34" rx="2" ry="2.8" fill="#1E2533" stroke="none"/><path d="M45 42 Q50 39 55 42" fill="none"/><path d="M62 28 q2 4 0 6 q-2 -2 0 -6 z" fill="#8FD3FF"/><path d="M41 30 l6 2 M59 30 l-6 2" stroke-width="1.4"/>`,
    extra: `<rect x="40" y="52" width="20" height="9" rx="2" fill="#fff"/><text x="50" y="59" font-size="6.5" text-anchor="middle" fill="#E2574C" stroke="none" font-weight="900" font-family="sans-serif">알바</text><rect x="30" y="58" width="7" height="12" rx="2" fill="#2A2F3A"/><rect x="31" y="59.5" width="5" height="8" rx="1" fill="#7FD3FF" stroke="none"/>`,
    weapon: `<circle cx="78" cy="58" r="13" fill="#2A2F3A"/><circle cx="74" cy="54" r="4" fill="#fff" opacity=".25" stroke="none"/><rect x="74" y="42" width="8" height="5" rx="1" fill="#8592A3"/><path d="M78 42 Q82 34 88 32" fill="none" stroke="#C9A36B" stroke-width="2"/><circle cx="89" cy="31" r="6" fill="url(#glowY)" stroke="none"/><path d="M86 28 l3 3 l3 -4 l-1 5 l4 1 l-5 1 l1 4 l-3 -3 l-3 3 l1 -4 l-4 -1 l4 -1 z" fill="#FFE766" stroke-width=".6"/><circle cx="64" cy="60" r="4" fill="#F6D2B8"/>` }),
  ornurse: hero({ coat: "#2F8F8A", coat2: "#59C2BB", pants: "#1E5E5A", hair: "#2C1E18",
    hat: `<path d="M36 26 Q50 13 64 26 Q50 22 36 26 Z" fill="#59C2BB"/><circle cx="44" cy="20" r="1.2" fill="#fff" stroke="none"/><circle cx="53" cy="18" r="1.2" fill="#fff" stroke="none"/>`,
    face: `<ellipse cx="45" cy="33" rx="1.9" ry="2.4" fill="${OUT}" stroke="none"/><ellipse cx="55" cy="33" rx="1.9" ry="2.4" fill="${OUT}" stroke="none"/><path d="M39 37 Q50 35 61 37 L60 44 Q50 47 40 44 Z" fill="#BFE9E6"/>`,
    weapon: `<g fill="url(#metal)"><path d="M62 46 l22 -8 l2 3 l-22 8 z"/><path d="M62 52 l26 -2 l0 3 l-26 2 z"/><path d="M62 58 l22 6 l-1 3 l-22 -6 z"/></g><circle cx="62" cy="54" r="4" fill="${SKIN}"/>` }),
};

export { GERM_SVG } from "./defMonsters";

/** 고퀄 원화(webp)를 넣으면 여기에 키를 추가해요 */
export const HAS_WEBP = new Set<string>(["g0", "g1", "g2", "g3", "g4", "g5", "g7"]);
export const artSrc = (key: string, svg: string) => HAS_WEBP.has(key) ? `/game/def/${key}.webp` : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
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
