/** 검 강화하기 — 단계별 표 (하드/이지). 행 n = "+n 검에서 강화 시도" 기준 */
export type Mode = "easy" | "hard";
export type Item = "iron" | "horn" | "glow" | "alps" | "hilt" | "soul" | "axe" | "clear";
export const ITEMS: Record<Item, { name: string; icon: string }> = {
  iron: { name: "출처불명 쇳조각", icon: "🔩" },
  horn: { name: "뿔짐승 뼛가루", icon: "🦴" },
  glow: { name: "바랜 야광석", icon: "🟢" },
  alps: { name: "알프스 강철 조각", icon: "⛓️" },
  hilt: { name: "화염검 자루", icon: "🔥" },
  soul: { name: "원혼의 파편", icon: "👻" },
  axe: { name: "부서진 도끼날", icon: "🪓" },
  clear: { name: "투명 결정", icon: "💎" },
};
export const NAMES = [
  "녹슨 철검", "견습 기사의 검", "단단한 장검", "북방 전사의 검", "불씨의 검", "서리 검",
  "쌍날 장검", "심문관의 대검", "마나 블레이드", "뿔짐승 사냥검", "야광석 검", "핏빛 장검",
  "쌍월도", "화염 마검", "심연검 아바돈", "마왕의 전투도끼", "유리 환영검", "날개검 세라프",
  "빛나는 성검", "천룡검", "칠색검", "폭풍의 황금검", "그림자 절단검", "가면무희의 쌍검",
  "용살검", "평범해 보이는 검", "석화검 고르곤", "방랑자의 검", "차원의 검", "태양을 삼킨 검",
];
export const FINAL = 29;
export const STORABLE = [19, 21, 22];
export const DROP: Record<number, Item> = { 6: "iron", 7: "iron", 8: "iron", 9: "horn", 10: "glow", 11: "alps", 12: "alps", 13: "hilt", 14: "soul", 15: "axe", 16: "clear" };
type Row = [cost: number, rate: number, sell: number, ticket: number];
// ticket: 0 = 방지 불가(없음), -1 = 방지권 사용 불가 단계
const EASY: Row[] = [
  [300, 100, 0, 0], [300, 100, 150, 0], [500, 100, 400, 0], [500, 95, 600, 0], [1000, 95, 800, 0], [1500, 90, 1600, 0],
  [2000, 90, 3500, 1], [2000, 90, 6100, 1], [3000, 85, 10000, 1], [5000, 80, 20000, 1], [10900, 80, 35100, 1], [20000, 75, 160000, 1],
  [35000, 70, 350000, 1], [55000, 70, 1000000, 2], [100000, 65, 3000000, 3], [180000, 60, 7500000, 4], [300000, 60, 14200000, 7], [300000, 55, 20000000, 9],
  [500000, 50, 30000000, 10], [800000, 50, 47500000, 12], [1500000, 45, 68300000, 15], [0, 40, 101000000, 17], [0, 40, 160000000, 20], [0, 35, 230000000, 22],
  [0, 40, 300000000, 23], [0, 35, 400000000, 23], [5000000, 50, 1800000000, -1], [0, 40, 2500000000, -1], [0, 15, 0, -1],
];
const HARD: Row[] = [
  [500, 100, 0, 0], [500, 98, 200, 0], [1000, 95, 500, 0], [2000, 93, 1000, 0], [4000, 90, 2000, 1], [7000, 86, 6000, 1],
  [10000, 81, 15000, 1], [15000, 75, 25000, 1], [22000, 70, 50000, 1], [30000, 66, 90000, 1], [30000, 62, 180000, 1], [51000, 61, 500000, 1],
  [70000, 54, 1000000, 1], [80000, 50, 2000000, 2], [100000, 49, 5000000, 3], [130000, 46, 10000000, 4], [170000, 44, 20000000, 7], [220000, 40, 44500000, 9],
  [300000, 38, 72000000, 10], [400000, 35, 120000000, 12], [650000, 33, 240000000, 15], [0, 30, 300000000, 17], [0, 27, 400000000, 20], [0, 27, 550000000, 22],
  [0, 25, 750000000, 23], [0, 35, 400000000, 23], [5000000, 50, 1800000000, -1], [0, 40, 2500000000, -1], [0, 15, 0, -1],
];
export const row = (m: Mode, l: number) => { const r = (m === "hard" ? HARD : EASY)[l]; return r ? { cost: r[0], rate: r[1], sell: r[2], ticket: r[3] } : null; };
/** 특수 재료 (돈 대신/추가로 필요) */
export type Need = { stored?: number; item?: Item; n: number; label: string };
export const need = (m: Mode, l: number): Need | null => {
  switch (l) {
    case 21: return { stored: 19, n: 1, label: `+19 ${NAMES[19]} 1자루` };
    case 22: return { stored: 21, n: 2, label: `+21 ${NAMES[21]} 2자루` };
    case 23: return { item: "soul", n: m === "hard" ? 12 : 8, label: `${ITEMS.soul.name} ${m === "hard" ? 12 : 8}개` };
    case 24: return { stored: 22, n: 1, label: `+22 ${NAMES[22]} 1자루` };
    case 25: return { item: "axe", n: 15, label: `${ITEMS.axe.name} 15개` };
    case 27: return { item: "clear", n: 2, label: `${ITEMS.clear.name} 2개` };
    default: return null;
  }
};
export const SHOP = [
  { id: "w9", label: `+9 워프권`, desc: `일정 확률로 +9 ${NAMES[9]} 상태로 시작`, warp: 9, price: { hard: 800000, easy: 1000000 } },
  { id: "w13", label: `+13 워프권`, desc: `일정 확률로 +13 ${NAMES[13]} 상태로 시작`, warp: 13, price: { hard: 5000000, easy: 7000000 } },
  { id: "w14", label: `+14 워프권`, desc: `일정 확률로 +14 ${NAMES[14]} 상태로 시작`, warp: 14, price: { hard: 7500000, easy: 10000000 } },
  { id: "p1", label: "깨짐 방지권 1개", desc: "", tickets: 1, price: { hard: 2100000, easy: 1000000 } },
  { id: "p3", label: "깨짐 방지권 3개", desc: "", tickets: 3, price: { hard: 6000000, easy: 2500000 } },
  { id: "w15", label: `+15 워프권`, desc: `일정 확률로 +15 ${NAMES[15]} 상태로 시작`, warp: 15, price: { hard: 10000000, easy: 15000000 } },
] as const;
export const WARP_RATE = 50;
export const COMBOS: { item: Item; n: { hard: number; easy: number }; tickets?: { hard: number; easy: number }; sword?: number }[] = [
  { item: "iron", n: { hard: 8, easy: 5 }, tickets: { hard: 1, easy: 1 } },
  { item: "horn", n: { hard: 5, easy: 3 }, tickets: { hard: 1, easy: 1 } },
  { item: "glow", n: { hard: 3, easy: 2 }, sword: 13 },
  { item: "alps", n: { hard: 5, easy: 3 }, tickets: { hard: 2, easy: 2 } },
  { item: "hilt", n: { hard: 2, easy: 2 }, sword: 16 },
  { item: "soul", n: { hard: 4, easy: 4 }, tickets: { hard: 4, easy: 4 } },
  { item: "soul", n: { hard: 4, easy: 6 }, sword: 19 },
  { item: "axe", n: { hard: 6, easy: 6 }, tickets: { hard: 10, easy: 10 } },
  { item: "clear", n: { hard: 4, easy: 3 }, tickets: { hard: 11, easy: 9 } },
];
export const START = 100_000;
