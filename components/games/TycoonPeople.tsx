/** 병원 키우기 사람 그림 (발끝이 원점, 키 약 125) */
export type Outfit = {
  top: string; top2?: string; pants: string; shoes?: string; skin?: string;
  hair: string; style?: "short" | "long" | "bun" | "messy" | "bald" | "pony" | "side";
  coat?: boolean; cap?: "nurse" | "surg" | "ems" | "hard" | "grad" | "helmet"; steth?: boolean; tie?: string; vest?: string; mask?: boolean; glasses?: boolean;
  beggar?: boolean; badge?: string; skirt?: boolean;
};
const SK = "#F4CDB0", SK2 = "#DDA987", O = "#2B2420";

export function Person({ o, pose = "stand", flip = false }: { o: Outfit; pose?: "stand" | "beg" | "wave" | "walk"; flip?: boolean }) {
  const skin = o.skin ?? SK, sh = o.shoes ?? "#2E2A28", b = o.beggar;
  const hem = b ? "M-19 -40 l3 5 l3 -4 l3 6 l3 -5 l3 4 l3 -6 l4 5 l3 -4 l3 5 l3 -5 l3 4 l1 -5" : "";
  return (
    <g transform={flip ? "scale(-1 1)" : undefined} stroke={O} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="0" cy="1" rx="22" ry="4.5" fill="#000" opacity=".22" stroke="none" />
      {/* 다리 */}
      {o.skirt
        ? <><path d="M-17 -44 L-21 -14 L21 -14 L17 -44 Z" fill={o.pants} /><rect x="-10" y="-15" width="7" height="13" fill={skin} /><rect x="3" y="-15" width="7" height="13" fill={skin} /></>
        : <g className={pose === "walk" ? "tp-legs" : undefined}><path d="M-13 -46 L-14 -4 L-3 -4 L-1 -42 Z" fill={o.pants} /><path d="M13 -46 L14 -4 L3 -4 L1 -42 Z" fill={o.pants} />
          {b && <><path d="M-14 -14 l3 2 l3 -2 l3 2 l2 -2" fill="none" /><rect x="4" y="-30" width="8" height="8" fill="#8A6A3A" transform="rotate(8 8 -26)" /></>}</g>}
      {b ? <><path d="M-17 -4 q-2 -5 6 -5 q8 0 8 5 z" fill={skin} /><path d="M17 -4 q2 -5 -6 -5 q-8 0 -8 5 z" fill={skin} /><path d="M-15 -6 v2 M-12 -6 v2 M15 -6 v2 M12 -6 v2" strokeWidth=".8" /></>
        : <><path d="M-16 -5 q0 -4 6 -4 h7 v5 z" fill={sh} /><path d="M16 -5 q0 -4 -6 -4 h-7 v5 z" fill={sh} /></>}
      {/* 몸통 */}
      <path d="M-19 -92 Q0 -98 19 -92 L21 -42 Q0 -38 -21 -42 Z" fill={o.top} />
      {o.top2 && !o.coat && <path d="M-6 -95 L0 -84 L6 -95" fill={o.top2} />}
      {o.vest && <path d="M-18 -88 L-8 -92 L-4 -60 L-6 -44 L-20 -44 Z M18 -88 L8 -92 L4 -60 L6 -44 L20 -44 Z" fill={o.vest} />}
      {o.tie && <path d="M-2.5 -92 L2.5 -92 L3.5 -70 L0 -64 L-3.5 -70 Z" fill={o.tie} />}
      {b && <><path d={hem} fill="none" /><rect x="-15" y="-80" width="9" height="9" fill="#9C7A4C" transform="rotate(-12 -10 -75)" /><path d="M-14 -79 l7 6 M-8 -80 l-5 7" strokeWidth=".7" strokeDasharray="1.5 1.5" /><rect x="7" y="-62" width="8" height="7" fill="#6E5A3A" /><path d="M-4 -90 L-7 -70 M10 -90 l2 10" strokeWidth=".8" opacity=".6" /></>}
      {o.coat && <><path d="M-21 -92 Q-12 -96 -6 -95 L-2 -60 L-4 -24 L-23 -24 Z" fill="#FBFCFD" /><path d="M21 -92 Q12 -96 6 -95 L2 -60 L4 -24 L23 -24 Z" fill="#FBFCFD" /><path d="M-6 -95 L-11 -80 L-4 -76 M6 -95 L11 -80 L4 -76" fill="none" /><rect x="9" y="-74" width="8" height="6" fill="none" strokeWidth=".9" /></>}
      {o.badge && <><rect x="-17" y="-82" width="11" height="6" rx="1" fill="#fff" /><text x="-11.5" y="-77.5" fontSize="4.2" textAnchor="middle" fill={O} stroke="none" fontWeight="700">{o.badge}</text></>}
      {/* 팔 */}
      {pose === "beg"
        ? <><path d="M-19 -90 Q-30 -76 -28 -58 L-21 -56 Q-22 -72 -15 -84 Z" fill={o.coat ? "#FBFCFD" : o.top} /><circle cx="-25" cy="-55" r="4.5" fill={skin} />
          <path d="M19 -90 Q32 -84 38 -70 L32 -66 Q27 -76 16 -82 Z" fill={o.coat ? "#FBFCFD" : o.top} />
          <g className="tp-can"><path d="M30 -70 h14 l-1 14 h-12 z" fill="#B8BEC6" /><path d="M30 -70 h14" strokeWidth="1.6" /><path d="M32 -66 h10 M32 -61 h10" strokeWidth=".6" opacity=".5" /><circle cx="37" cy="-72" r="2.6" fill="#E9C46A" /><circle cx="40" cy="-73" r="2.2" fill="#E9C46A" /></g>
          <circle cx="33" cy="-68" r="4.5" fill={skin} /></>
        : pose === "wave"
          ? <><path d="M-19 -90 Q-28 -70 -26 -50 L-19 -50 Q-20 -68 -14 -84 Z" fill={o.coat ? "#FBFCFD" : o.top} /><circle cx="-23" cy="-48" r="4.5" fill={skin} /><g className="tp-wave"><path d="M19 -90 Q30 -100 32 -118 L25 -119 Q24 -104 15 -86 Z" fill={o.coat ? "#FBFCFD" : o.top} /><circle cx="29" cy="-121" r="4.8" fill={skin} /></g></>
          : <g className={pose === "walk" ? "tp-arms" : undefined}><path d="M-19 -90 Q-28 -70 -26 -50 L-19 -50 Q-20 -68 -14 -84 Z" fill={o.coat ? "#FBFCFD" : o.top} /><circle cx="-23" cy="-48" r="4.5" fill={skin} /><path d="M19 -90 Q28 -70 26 -50 L19 -50 Q20 -68 14 -84 Z" fill={o.coat ? "#FBFCFD" : o.top} /><circle cx="23" cy="-48" r="4.5" fill={skin} /></g>}
      {/* 청진기 */}
      {o.steth && <><path d="M-8 -95 Q-12 -76 -4 -68 Q4 -64 8 -76 M8 -95 Q12 -84 8 -76" fill="none" stroke="#3B4250" strokeWidth="2" /><circle cx="8" cy="-73" r="3" fill="#C9D0D8" stroke="#3B4250" /></>}
      {/* 머리 */}
      <rect x="-4.5" y="-101" width="9" height="8" fill={skin} />
      {o.style === "long" && <path d="M-16 -112 Q-20 -86 -14 -84 L14 -84 Q20 -86 16 -112 Z" fill={o.hair} />}
      <ellipse cx="0" cy="-113" rx="15" ry="16" fill={skin} />
      <ellipse cx="-15" cy="-111" rx="2.6" ry="4" fill={SK2} /><ellipse cx="15" cy="-111" rx="2.6" ry="4" fill={SK2} />
      {o.style === "bald" ? null
        : o.style === "messy" ? <path d="M-16 -112 Q-19 -126 -10 -130 Q-8 -136 0 -132 Q6 -138 11 -131 Q20 -130 17 -116 Q14 -122 8 -121 Q4 -126 -1 -121 Q-6 -126 -10 -120 Q-14 -122 -16 -112 Z" fill={o.hair} />
        : o.style === "bun" ? <><circle cx="0" cy="-131" r="7" fill={o.hair} /><path d="M-16 -110 Q-16 -129 0 -129 Q16 -129 16 -110 Q12 -121 0 -121 Q-12 -121 -16 -110 Z" fill={o.hair} /></>
        : o.style === "pony" ? <><path d="M14 -122 Q24 -116 20 -96 Q16 -108 12 -114 Z" fill={o.hair} /><path d="M-16 -110 Q-16 -129 0 -129 Q16 -129 16 -110 Q10 -123 -2 -120 Q-12 -119 -16 -110 Z" fill={o.hair} /></>
        : o.style === "side" ? <path d="M-16 -108 Q-17 -130 2 -130 Q18 -129 16 -110 Q12 -123 -6 -121 Q-12 -116 -16 -108 Z" fill={o.hair} />
        : <path d="M-16 -110 Q-16 -130 0 -130 Q16 -130 16 -110 Q13 -121 0 -121 Q-13 -121 -16 -110 Z" fill={o.hair} />}
      {/* 얼굴 */}
      {b ? <><path d="M-9 -118 l6 2 M9 -118 l-6 2" strokeWidth="1.4" /><ellipse cx="-5.5" cy="-112" rx="1.7" ry="2.2" fill={O} stroke="none" /><ellipse cx="5.5" cy="-112" rx="1.7" ry="2.2" fill={O} stroke="none" /><path d="M-5 -103 Q0 -99 5 -103 Q0 -101 -5 -103 Z" fill="#7A2A2A" />
          {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={-8 + (i % 5) * 4} cy={-102 + Math.floor(i / 5) * 3} r=".6" fill="#6B5A4A" stroke="none" />)}<ellipse cx="-9" cy="-107" rx="2.4" ry="1.3" fill="#B5856A" opacity=".5" stroke="none" /></>
        : <><path d="M-9 -118 Q-5.5 -120 -2 -118.5 M9 -118 Q5.5 -120 2 -118.5" fill="none" strokeWidth="1.2" /><ellipse cx="-5.5" cy="-112" rx="1.8" ry="2.4" fill={O} stroke="none" /><ellipse cx="5.5" cy="-112" rx="1.8" ry="2.4" fill={O} stroke="none" /><circle cx="-5" cy="-113" r=".6" fill="#fff" stroke="none" /><circle cx="6" cy="-113" r=".6" fill="#fff" stroke="none" />
          <path d="M-4 -104 Q0 -100.5 4 -104" fill="none" /><ellipse cx="-10" cy="-106" rx="2.6" ry="1.4" fill="#F29C9C" opacity=".45" stroke="none" /><ellipse cx="10" cy="-106" rx="2.6" ry="1.4" fill="#F29C9C" opacity=".45" stroke="none" /></>}
      {o.glasses && <><circle cx="-5.5" cy="-112" r="4" fill="none" /><circle cx="5.5" cy="-112" r="4" fill="none" /><path d="M-1.5 -112 h3" /></>}
      {o.mask && <path d="M-11 -108 Q0 -110 11 -108 L10 -100 Q0 -96 -10 -100 Z" fill="#CFEDEA" />}
      {/* 모자 */}
      {o.cap === "nurse" && <><path d="M-10 -128 L10 -128 L8 -136 L-8 -136 Z" fill="#fff" /><path d="M-1.6 -135 h3.2 v6 h-3.2 z M-3 -133.6 h6 v3 h-6 z" fill="#E2574C" stroke="none" /></>}
      {o.cap === "surg" && <path d="M-16 -116 Q-16 -134 0 -134 Q16 -134 16 -116 Q0 -122 -16 -116 Z" fill="#59C2BB" />}
      {o.cap === "ems" && <><path d="M-16 -118 Q-15 -134 0 -134 Q15 -134 16 -118 Z" fill="#2B3A55" /><path d="M8 -119 h14 l-2 3 h-12 z" fill="#1A2236" /></>}
      {o.cap === "grad" && <><path d="M-18 -128 L0 -136 L18 -128 L0 -121 Z" fill="#1E2533" /><path d="M14 -128 v10" stroke="#E9C46A" strokeWidth="1.6" /></>}
      {o.cap === "helmet" && <><circle cx="0" cy="-113" r="21" fill="#BFE9FF" fillOpacity=".35" stroke="#C9D0D8" strokeWidth="2.4" /><path d="M-9 -128 Q0 -133 9 -128" fill="none" stroke="#fff" strokeWidth="1.6" /></>}
    </g>
  );
}

/** 직원 17명 옷차림 (STAFF 순서) */
export const STAFF_OUTFIT: Outfit[] = [
  { top: "#A7C7E7", pants: "#5B6B82", hair: "#3A2A20", style: "pony", badge: "실습" },                        // 실습생
  { top: "#FFFFFF", top2: "#7FA7D8", vest: "#3D5A80", pants: "#2E3A4F", hair: "#2A1E18", style: "bun", skirt: true, badge: "원무" }, // 원무
  { top: "#F8BBD0", pants: "#F48FB1", hair: "#4A3020", style: "pony", badge: "조무" },                       // 간호조무사
  { top: "#FFFFFF", top2: "#F48FB1", pants: "#F8BBD0", hair: "#2B1E18", style: "bun", cap: "nurse", steth: true },   // 간호사
  { top: "#2E7D6B", pants: "#1E4F44", hair: "#1E1A18", style: "short", badge: "PT" },                       // 물리치료사
  { top: "#E8FFF0", pants: "#2D5A3D", hair: "#6B4226", style: "side", coat: true, glasses: true },           // 임상병리사
  { top: "#6E5BB8", pants: "#3E3570", hair: "#1F1B2E", style: "short", badge: "RT" },                       // 방사선사
  { top: "#F2A900", pants: "#2B3A55", hair: "#1C1C1C", style: "short", cap: "ems" },                          // 응급구조사
  { top: "#FFFFFF", tie: "#1E2533", pants: "#1E2533", hair: "#1A1A1A", style: "side", vest: "#1E2533" },      // 총괄실장
  { top: "#59C2BB", pants: "#2F8F8A", hair: "#151515", style: "messy", coat: true, steth: true },         // 전공의
  { top: "#FFFFFF", top2: "#3D7DD8", pants: "#1E2A44", hair: "#2B1E18", style: "bun", cap: "nurse", steth: true, badge: "수간" }, // 수간호사
  { top: "#9FC5E8", tie: "#3D5A80", pants: "#2F3B4F", hair: "#2A1E18", style: "side", coat: true, steth: true },      // 전문의
  { top: "#D9E3EE", tie: "#8C1C1C", pants: "#2F3B4F", hair: "#8A8A8A", style: "side", coat: true, glasses: true, steth: true }, // 교수
  { top: "#FFFFFF", tie: "#7A1D2E", pants: "#2B2B33", hair: "#555", style: "side", vest: "#2B2B33", glasses: true }, // 부원장
  { top: "#FFFFFF", tie: "#C9A227", pants: "#14161C", hair: "#CFCFCF", style: "side", coat: true, steth: true },      // 병원장
  { top: "#FFFFFF", tie: "#C9A227", pants: "#14161C", hair: "#E6E6E6", style: "bald", vest: "#3A1F2B", glasses: true }, // 이사장
  { top: "#E9EEF4", top2: "#E2574C", pants: "#C9D0D8", hair: "#2A1E18", style: "short", cap: "helmet" },          // 우주의학 박사
];
/** 원장(나): 폐허~시골 의원 땐 거지 차림, 이후 점점 차려입어요 */
export const bossOutfit = (tier: number): Outfit => tier <= 1
  ? { beggar: true, top: "#8B6B47", pants: "#6A5238", hair: "#2E241C", style: "messy", steth: true, skin: "#E7BC9A" }
  : tier <= 3 ? { top: "#C9D6E3", pants: "#4A5568", hair: "#2E241C", style: "messy", coat: true, steth: true }
  : tier <= 6 ? { top: "#FFFFFF", tie: "#3D5A80", pants: "#2B3245", hair: "#2E241C", style: "side", coat: true, steth: true }
  : { top: "#FFFFFF", tie: "#C9A227", pants: "#14161C", hair: "#2E241C", style: "side", coat: true, steth: true, badge: "원장" };
export const PATIENTS: Outfit[] = [
  { top: "#E76F51", pants: "#264653", hair: "#2A1E18", style: "short" }, { top: "#F4A261", pants: "#3D405B", hair: "#6B4226", style: "long" },
  { top: "#8AB17D", pants: "#2A3B2E", hair: "#AAA", style: "bald" }, { top: "#7FA7D8", pants: "#2F3B4F", hair: "#1A1A1A", style: "pony" },
  { top: "#B5838D", pants: "#6D6875", hair: "#3A2A20", style: "bun", skirt: true }, { top: "#F2CC8F", pants: "#5A5A66", hair: "#2B1E18", style: "side" },
];
