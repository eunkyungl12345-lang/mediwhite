/** 🎁 복지 평가 — 실제로 써본 복지만 골라 별점 + 사용 경험 (잡플래닛 '복지 평가'의 병원판)
 *  저장: game_state(game = "hwel:<병원id>") 1인 1병원(수정 가능). 공개: 응답 MIN_N(작은 병원은 need)명 이상 */
export const WEL_CATS = [
  { k: "med", name: "의료·건강", icon: "🏥", items: ["본인 진료비 감면", "가족 진료비 감면", "건강검진", "독감·예방접종", "직원 전용 진료"] },
  { k: "life", name: "식사·생활", icon: "🍚", items: ["직원식당·식대", "기숙사·사택", "통근버스", "주차 지원", "직장어린이집", "유니폼 세탁"] },
  { k: "grow", name: "교육·성장", icon: "📚", items: ["보수교육·학회비", "대학원·학자금", "자격증 취득 지원", "해외연수·학회", "신규 교육·프리셉터"] },
  { k: "etc", name: "휴식·보상", icon: "🎁", items: ["명절 상여·선물", "경조사비", "콘도·휴양시설", "복지포인트", "장기근속 포상", "리프레시 휴가"] },
] as const;
export const welKey = (hid: number) => `hwel:${hid}`;
/** items: 복지 이름 → 별점(1~5). 목록에 없는 복지는 "+이름" 으로 저장 */
export type Welfare = { items: Record<string, number>; text: string; dept?: string; status?: string; at: string };
export type WelAgg = { n: number; items: { name: string; cat?: string; n: number; avg: number }[]; texts: string[] };
export function welAgg(rows: Welfare[]): WelAgg {
  const m = new Map<string, number[]>();
  for (const r of rows) for (const [k, v] of Object.entries(r.items ?? {})) if (v >= 1 && v <= 5) m.set(k, [...(m.get(k) ?? []), v]);
  const catOf = (name: string) => WEL_CATS.find(c => (c.items as readonly string[]).includes(name))?.icon;
  const items = Array.from(m.entries()).map(([name, v]) => ({ name: name.replace(/^\+/, ""), cat: catOf(name), n: v.length, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 }))
    .filter(x => x.cat || x.n >= 2) // 직접 추가한 복지는 2명 이상 겹칠 때만
    .sort((a, b) => b.n - a.n || b.avg - a.avg);
  return { n: rows.length, items, texts: rows.filter(r => r.text).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20).map(r => r.text) };
}
