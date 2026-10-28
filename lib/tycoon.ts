/** 우리 병원 키우기 — 시즌 2 경제 (서버·클라이언트 공용)
 *  모든 '하루 매출'은 실제 하루(24시간) 기준. 초당 = 하루 / 86400 */
export const VERSION = 2;
export const DAY = 86400;

export type Dept = "원무" | "간호" | "물리치료" | "방사선" | "임상병리" | "응급구조" | "총괄" | "의사";
export type DeptDef = { icon: string; perDay: number; cost: number; need?: string; desc: string };
export const DEPTS: Record<Dept, DeptDef> = {
  원무:     { icon: "🧾", perDay: 50_000,    cost: 50_000,    desc: "접수·수납. 병원의 시작" },
  간호:     { icon: "💉", perDay: 100_000,   cost: 100_000,   desc: "처치·투약" },
  물리치료: { icon: "🦵", perDay: 180_000,   cost: 250_000,   need: "재활센터", desc: "재활 치료" },
  임상병리: { icon: "🧪", perDay: 100_000,   cost: 150_000,   need: "진단검사실", desc: "혈액·검체 검사" },
  방사선:   { icon: "☢️", perDay: 180_000,   cost: 300_000,   need: "영상의학과", desc: "X-ray·CT·MRI 촬영" },
  응급구조: { icon: "🚑", perDay: 100_000,   cost: 200_000,   need: "응급실", desc: "응급 이송·처치" },
  총괄:     { icon: "👔", perDay: 300_000,   cost: 600_000,   desc: "병원 운영 · 1명당 전체 매출 +3%" },
  의사:     { icon: "🩺", perDay: 1_800_000, cost: 2_000_000, desc: "진료·수술. 가장 큰 매출" },
};
export const DORDER = Object.keys(DEPTS) as Dept[];
export const MILESTONES = [10, 25, 50, 100];
export const MAX_EDU = 10;

/** 시설: 순서대로 개설. 개설하면 층이 하나 올라가요 */
export type Room = { name: string; icon: string; cost: number; mult: number; desc: string };
export const ROOMS: Room[] = [
  { name: "외래 진료실", icon: "🏥", cost: 0, mult: 1, desc: "기본 진료실 · 원무·간호·의사" },
  { name: "재활센터", icon: "🦵", cost: 5_000_000, mult: 1.1, desc: "물리치료사 고용 · 매출 ×1.1" },
  { name: "진단검사실", icon: "🧪", cost: 15_000_000, mult: 1.1, desc: "임상병리사 고용 · 매출 ×1.1" },
  { name: "영상의학과", icon: "🩻", cost: 30_000_000, mult: 1.15, desc: "방사선사 고용 · 매출 ×1.15" },
  { name: "응급실", icon: "🚨", cost: 80_000_000, mult: 1.2, desc: "응급구조사 고용 · 응급실 동 증축 · ×1.2" },
  { name: "수술실", icon: "🔪", cost: 300_000_000, mult: 1.3, desc: "의사 매출 ×1.5 · 전체 ×1.3" },
  { name: "입원병동", icon: "🛏️", cost: 1_000_000_000, mult: 1.3, desc: "병상 100개 · 전체 ×1.3" },
  { name: "중환자실", icon: "🫀", cost: 3_000_000_000, mult: 1.4, desc: "전체 ×1.4" },
  { name: "신관 증축", icon: "🏢", cost: 10_000_000_000, mult: 1.5, desc: "두 번째 건물 · 전체 ×1.5" },
  { name: "대학병원 승격", icon: "🎓", cost: 50_000_000_000, mult: 2, desc: "메디화이트 대학교병원 · 전체 ×2" },
];

/** 장비: 한 번 사면 영구 보너스 */
export type Gear = { key: string; name: string; icon: string; cost: number; need: number; boost: Partial<Record<Dept, number>>; desc: string };
export const GEAR: Gear[] = [
  { key: "kiosk", name: "무인 수납 키오스크", icon: "🖥️", cost: 3_000_000, need: 0, boost: { 원무: .5 }, desc: "원무 +50%" },
  { key: "emr", name: "전자의무기록(EMR)", icon: "💾", cost: 8_000_000, need: 0, boost: { 원무: .3, 간호: .3 }, desc: "원무·간호 +30%" },
  { key: "rehab", name: "재활 로봇", icon: "🦾", cost: 60_000_000, need: 1, boost: { 물리치료: .8 }, desc: "물리치료 +80%" },
  { key: "analyzer", name: "자동 혈액분석기", icon: "🔬", cost: 40_000_000, need: 2, boost: { 임상병리: .6 }, desc: "임상병리 +60%" },
  { key: "ct", name: "CT", icon: "🩻", cost: 800_000_000, need: 3, boost: { 방사선: .6 }, desc: "방사선 +60%" },
  { key: "mri", name: "MRI", icon: "🧲", cost: 2_000_000_000, need: 3, boost: { 방사선: 1 }, desc: "방사선 +100%" },
  { key: "robot", name: "수술 로봇", icon: "🤖", cost: 3_000_000_000, need: 5, boost: { 의사: .6 }, desc: "의사 +60%" },
];
/** 병원 차량 */
export const AMBULANCE = { name: "특수 구급차", icon: "🚑", cost: 150_000_000, max: 5, boost: .2, need: 4 };
export const HELI = { name: "닥터헬기", icon: "🚁", cost: 15_000_000_000, need: 5, boost: { 응급구조: 1, 의사: .3 } as Partial<Record<Dept, number>> };

/** 내 집 (서울 시세 대략) */
export type Home = { name: string; price: number; area: string; wall: string; floor: string; view: "wall" | "alley" | "city" | "river" | "nightriver" | "garden" };
export const HOMES: Home[] = [
  { name: "고시원", price: 0, area: "신림동", wall: "#D9D4C7", floor: "#B9A98A", view: "wall" },
  { name: "원룸", price: 200_000_000, area: "관악구", wall: "#EDE7DA", floor: "#C8B08A", view: "alley" },
  { name: "오피스텔", price: 400_000_000, area: "마포구", wall: "#F2F0EA", floor: "#B48A5E", view: "city" },
  { name: "아파트 24평", price: 800_000_000, area: "노원구", wall: "#F4F1EA", floor: "#A57A50", view: "city" },
  { name: "아파트 34평", price: 1_800_000_000, area: "마포구", wall: "#F6F3EE", floor: "#8C6340", view: "city" },
  { name: "한강뷰 아파트", price: 4_000_000_000, area: "성수동", wall: "#F7F6F2", floor: "#6E4B2E", view: "river" },
  { name: "아파트 34평", price: 5_500_000_000, area: "반포동", wall: "#FAF8F4", floor: "#E8E2D6", view: "river" },
  { name: "고급 빌라", price: 12_000_000_000, area: "한남동", wall: "#F3EFE6", floor: "#D9CFBF", view: "nightriver" },
  { name: "한강 펜트하우스", price: 25_000_000_000, area: "성수동", wall: "#1E2328", floor: "#2E2A26", view: "nightriver" },
  { name: "단독 저택", price: 40_000_000_000, area: "성북동", wall: "#EFE9DD", floor: "#C9B48E", view: "garden" },
];

/** 가구·가전·미술품·차: 슬롯마다 한 단계씩, 더 좋은 걸 사면 바뀌어요 */
export type Tier = { name: string; price: number; icon: string };
export type Slot = { key: string; label: string; cat: "furn" | "art" | "car"; tiers: Tier[] };
export const SLOTS: Slot[] = [
  { key: "sofa", label: "소파", cat: "furn", tiers: [
    { name: "리클라이너 1인", price: 800_000, icon: "🪑" }, { name: "가죽 3인 소파", price: 4_000_000, icon: "🛋️" },
    { name: "이탈리아 명품 소파", price: 30_000_000, icon: "🛋️" }, { name: "하이엔드 모듈 소파", price: 120_000_000, icon: "🛋️" } ] },
  { key: "tv", label: "TV·가전", cat: "furn", tiers: [
    { name: "55인치 TV", price: 1_000_000, icon: "📺" }, { name: "85인치 OLED", price: 8_000_000, icon: "📺" },
    { name: "가전 풀세트(냉장고·세탁기·에어컨)", price: 40_000_000, icon: "📺" }, { name: "110인치 마이크로LED", price: 170_000_000, icon: "📺" } ] },
  { key: "table", label: "식탁", cat: "furn", tiers: [
    { name: "원목 4인 식탁", price: 1_500_000, icon: "🍽️" }, { name: "대리석 8인 식탁", price: 15_000_000, icon: "🍽️" },
    { name: "디자이너 다이닝 테이블", price: 60_000_000, icon: "🍽️" } ] },
  { key: "bed", label: "침대", cat: "furn", tiers: [
    { name: "기본 침대", price: 1_000_000, icon: "🛏️" }, { name: "프리미엄 매트리스", price: 10_000_000, icon: "🛏️" },
    { name: "스웨덴 수제 침대", price: 200_000_000, icon: "🛏️" } ] },
  { key: "light", label: "조명", cat: "furn", tiers: [
    { name: "LED 스탠드", price: 500_000, icon: "💡" }, { name: "디자이너 펜던트", price: 8_000_000, icon: "💡" },
    { name: "크리스탈 샹들리에", price: 100_000_000, icon: "💡" } ] },
  { key: "plant", label: "식물", cat: "furn", tiers: [
    { name: "몬스테라 화분", price: 100_000, icon: "🪴" }, { name: "올리브 나무", price: 2_000_000, icon: "🌳" } ] },
  { key: "art", label: "미술품", cat: "art", tiers: [
    { name: "신진작가 판화", price: 3_000_000, icon: "🖼️" }, { name: "중견작가 유화", price: 50_000_000, icon: "🖼️" },
    { name: "해외 팝아트 판화", price: 300_000_000, icon: "🖼️" }, { name: "단색화 대작", price: 2_000_000_000, icon: "🖼️" },
    { name: "근대 거장 추상화", price: 13_000_000_000, icon: "🖼️" } ] },
  { key: "sculpt", label: "조각", cat: "art", tiers: [
    { name: "브론즈 소품", price: 10_000_000, icon: "🗿" }, { name: "현대 조각 설치작", price: 800_000_000, icon: "🗿" } ] },
  { key: "car", label: "내 차", cat: "car", tiers: [
    { name: "경차", price: 15_000_000, icon: "🚗" }, { name: "아반떼", price: 25_000_000, icon: "🚗" },
    { name: "그랜저", price: 45_000_000, icon: "🚙" }, { name: "제네시스 G90", price: 130_000_000, icon: "🚘" },
    { name: "벤츠 S클래스", price: 200_000_000, icon: "🚘" }, { name: "포르쉐 911", price: 250_000_000, icon: "🏎️" },
    { name: "롤스로이스 고스트", price: 600_000_000, icon: "🚘" } ] },
];

export type Saved = {
  v: number; cash: number; total: number; patients: number; lastSeen: number;
  staff: Partial<Record<Dept, { n: number; lv: number }>>; rooms: number;
  gear: string[]; amb: number; heli: boolean;
  home: number; items: Record<string, number>; // slot key → 단계 index (+1, 0=없음)
};
export const fresh = (): Saved => ({ v: VERSION, cash: 300_000, total: 0, patients: 0, lastSeen: Date.now(), staff: {}, rooms: 0, gear: [], amb: 0, heli: false, home: 0, items: {} });
export const isCurrent = (x: any): x is Saved => !!x && x.v === VERSION && typeof x.cash === "number";

export const fmt = (n: number) => {
  n = Math.floor(n); const a = Math.abs(n);
  if (a >= 1e16) return (n / 1e16).toFixed(1) + "경";
  if (a >= 1e12) return (n / 1e12).toFixed(a < 1e13 ? 2 : 1).replace(/\.?0+$/, "") + "조";
  if (a >= 1e8) { const eok = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4); return eok.toLocaleString() + "억" + (man && eok < 100 ? " " + man.toLocaleString() + "만" : ""); }
  if (a >= 1e4) return Math.floor(n / 1e4).toLocaleString() + "만";
  return n.toLocaleString();
};
export const hireCost = (d: Dept, n: number) => Math.round(DEPTS[d].cost * Math.pow(1.15, n) / 1000) * 1000;
export const lvCost = (d: Dept, lv: number) => Math.round(DEPTS[d].cost * 20 * Math.pow(2.5, lv - 1) / 10000) * 10000;
export const milestoneMult = (n: number) => 1 + .5 * MILESTONES.filter(m => n >= m).length;
export const OFFLINE_CAP = 8 * 3600, OFFLINE_RATE = .5;

/** 직원 한 명 하루 매출(보너스 포함) */
export function perHead(s: Saved, d: Dept, mine: string) {
  const st = s.staff[d]; if (!st) return DEPTS[d].perDay;
  let m = Math.pow(1.25, st.lv - 1) * milestoneMult(st.n);
  if (d === mine) m *= 1.2;
  if (d === "의사" && s.rooms >= 5) m *= 1.5;
  let g = 1; for (const k of s.gear) { const gg = GEAR.find(x => x.key === k); if (gg?.boost[d]) g += gg.boost[d]!; }
  if (d === "응급구조") g += s.amb * AMBULANCE.boost;
  if (s.heli && HELI.boost[d]) g += HELI.boost[d]!;
  return DEPTS[d].perDay * m * g;
}
/** 하루 매출 */
export function dailyOf(s: Saved, mine: string) {
  const mgr = 1 + (s.staff.총괄?.n ?? 0) * .03, room = ROOMS.slice(0, s.rooms + 1).reduce((a, r) => a * r.mult, 1);
  let sum = 0; for (const d of DORDER) { const st = s.staff[d]; if (st?.n) sum += perHead(s, d, mine) * st.n; }
  return sum * mgr * room;
}
/** 초당 매출 */
export const rateOf = (s: Saved, mine: string) => dailyOf(s, mine) / DAY;

/** 총자산 = 현금 + 산 것들의 값 */
export function assetsOf(s: Saved) {
  let a = s.cash + HOMES[s.home].price + ROOMS.slice(1, s.rooms + 1).reduce((x, r) => x + r.cost, 0);
  for (const k of s.gear) a += GEAR.find(g => g.key === k)?.cost ?? 0;
  a += s.amb * AMBULANCE.cost + (s.heli ? HELI.cost : 0);
  for (const sl of SLOTS) { const t = s.items[sl.key] ?? 0; if (t) a += sl.tiers[t - 1].price; }
  return a;
}
/** 내 직종 → 병원 키우기 직원 직종 */
export const tycoonDept = (d: string) => d === "간호사" || d === "간호조무사" ? "간호" : d;
