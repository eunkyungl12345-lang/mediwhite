/** 우리 병원 키우기 경제(서버·클라이언트 공용) */
export type Dept = "원무" | "간호" | "물리치료" | "방사선" | "임상병리" | "응급구조" | "의사" | "총괄";
export type DeptDef = { icon: string; rate: number; cost: number; need?: string; desc: string };
export const DEPTS: Record<Dept, DeptDef> = {
  원무:   { icon: "🧾", rate: 3,    cost: 40,      desc: "접수·수납. 병원의 시작" },
  간호:   { icon: "💉", rate: 8,    cost: 180,     desc: "처치·투약, 환자 회전율 ↑" },
  물리치료: { icon: "🦵", rate: 18,  cost: 2500,    need: "재활센터", desc: "재활 치료 수익" },
  방사선: { icon: "☢️", rate: 50,   cost: 12000,    need: "검사실", desc: "X-ray·CT 촬영 수익" },
  임상병리: { icon: "🧪", rate: 140, cost: 60000,   need: "검사실", desc: "혈액·검체 검사 수익" },
  응급구조: { icon: "🚑", rate: 400, cost: 400000,  need: "응급실", desc: "응급 이송·처치 수익" },
  의사:   { icon: "🩺", rate: 1200, cost: 3000000,  desc: "진료·수술. 가장 큰 수익" },
  총괄:   { icon: "👔", rate: 0,    cost: 1500000,  desc: "1명당 병원 전체 매출 +5%" },
};
export const DORDER = Object.keys(DEPTS) as Dept[];
export const MILESTONES = [10, 25, 50, 100, 200];
export type Room = { name: string; icon: string; cost: number; mult: number; desc: string };
export const ROOMS: Room[] = [
  { name: "외래", icon: "🏥", cost: 0, mult: 1, desc: "기본 진료실" },
  { name: "재활센터", icon: "🏋️", cost: 8000, mult: 1.2, desc: "물리치료사 고용 가능 · 매출 ×1.2" },
  { name: "검사실", icon: "🔬", cost: 60000, mult: 1.3, desc: "방사선사·임상병리사 고용 가능 · 매출 ×1.3" },
  { name: "응급실", icon: "🚨", cost: 800000, mult: 1.5, desc: "응급구조사 고용 가능 · 매출 ×1.5" },
  { name: "수술실", icon: "🔪", cost: 12000000, mult: 2, desc: "의사 매출 ×2 · 전체 ×2" },
  { name: "중환자실", icon: "🫀", cost: 150000000, mult: 2.5, desc: "전체 매출 ×2.5" },
  { name: "신관 증축", icon: "🏢", cost: 3000000000, mult: 4, desc: "전체 매출 ×4 · 지역 거점병원" },
];
export type Saved = { cash: number; total: number; staff: Partial<Record<Dept, { n: number; lv: number }>>; rooms: number; lastSeen: number; patients: number; myDept?: string };
export const fmt = (n: number) => { n = Math.floor(n); if (n >= 1e12) return (n / 1e12).toFixed(n < 1e13 ? 1 : 0) + "조"; if (n >= 1e8) return (n / 1e8).toFixed(n < 1e9 ? 1 : 0) + "억"; if (n >= 1e4) return (n / 1e4).toFixed(n < 1e5 ? 1 : 0) + "만"; return n.toLocaleString(); };
export const hireCost = (d: Dept, n: number) => Math.round(DEPTS[d].cost * Math.pow(1.15, n));
export const lvCost = (d: Dept, lv: number) => Math.round(DEPTS[d].cost * 15 * Math.pow(2.6, lv - 1));
export const milestoneMult = (n: number) => Math.pow(2, MILESTONES.filter(m => n >= m).length);
export const OFFLINE_CAP = 8 * 3600, OFFLINE_RATE = .5;

export function rateOf(s: Saved, mine: string) {
  const mgr = 1 + (s.staff.총괄?.n ?? 0) * .05, room = ROOMS.slice(0, s.rooms + 1).reduce((a, r) => a * r.mult, 1);
  let sum = 0;
  for (const d of DORDER) { const st = s.staff[d]; if (!st || !DEPTS[d].rate) continue; let r = DEPTS[d].rate * st.n * Math.pow(1.5, st.lv - 1) * milestoneMult(st.n); if (d === mine) r *= 1.2; if (d === "의사" && s.rooms >= 4) r *= 2; sum += r; }
  return sum * mgr * room;
}

/** 내 직종 → 병원 키우기 직원 직종 */
export const tycoonDept = (d: string) => d === "간호사" || d === "간호조무사" ? "간호" : d;
