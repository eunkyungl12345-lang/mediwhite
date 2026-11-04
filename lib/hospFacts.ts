/** 🔎 병원 실체 체크 — "입사해야만 알 수 있는 것"을 탭 몇 번으로 익명 수집
 *  실수령 월급 · 내부 분위기 · 치명적 리스크(육아휴직·임신 불이익 등)
 *  저장: game_state(user_id, game = "hfact:<병원id>", state) — 1인 1병원 1응답(수정 가능)
 *  공개: 응답 MIN_N명 이상일 때만 집계로 (누가 답했는지 특정 안 되게) */
export const MIN_N = 2;
export const PAY = ["~200", "200~250", "250~300", "300~350", "350~400", "400~500", "500+"] as const; // 세후 월 실수령(만원)
export const YEARS = ["신규·1년 미만", "1~3년", "4~7년", "8년 이상"] as const;
export const MOOD = [
  { k: "taeum", q: "태움·갑질", opts: ["거의 없어요", "가끔 있어요", "심해요"] },
  { k: "off", q: "제때 퇴근", opts: ["대부분 칼퇴", "반반", "거의 못 해요"] },
  { k: "quit", q: "사람이 나가는 편", opts: ["잘 안 나가요", "보통", "자주 나가요"] },
] as const;
export const RISKS = [
  { k: "parental", s: "육아휴직 불이익", label: "육아휴직 쓰기 어렵거나 쓰면 불이익" },
  { k: "pregnant", s: "임신 불이익", label: "임신하면 눈치·불이익" },
  { k: "unpaid", s: "수당·월급 체불", label: "수당·월급이 밀리거나 덜 나와요" },
  { k: "leave", s: "연차 못 씀", label: "연차를 거의 못 써요" },
  { k: "offback", s: "오프 반납", label: "오프 반납·근무표 갑자기 변경" },
  { k: "short", s: "인력 부족", label: "늘 인력 부족" },
  { k: "probation", s: "긴 수습 감액", label: "수습 급여 깎는 기간이 길어요" },
  { k: "resign", s: "사직 지연", label: "사직서를 잘 안 받아줘요" },
] as const;
/** 🚪 퇴사자 내부 평가 — 별 5개 기준 + 퇴사 사유 + 마지막 한마디 */
export const EXIT_STARS = [
  { k: "pay", name: "급여", icon: "💰" }, { k: "balance", name: "워라밸", icon: "⚖️" }, { k: "people", name: "동료·분위기", icon: "🤝" },
  { k: "boss", name: "상사·관리자", icon: "🧑‍💼" }, { k: "edu", name: "교육·성장", icon: "📈" }, { k: "welfare", name: "복지", icon: "🎁" }, { k: "load", name: "업무강도(적당함)", icon: "🏋️" },
] as const;
export const EXIT_REASONS = ["급여가 낮아서", "태움·인간관계", "업무 과다·인력 부족", "상사·관리자", "교대·근무시간", "결혼·출산·육아", "이사·통근", "커리어·이직", "건강", "계약 만료", "기타"] as const;
export type HFact = { v?: boolean; stars?: Record<string, number>; reasons?: string[]; last?: string; pay?: string; years?: string; dept?: string; status?: string; taeum?: number; off?: number; quit?: number; risks?: string[]; good?: boolean; at?: string };
export const factKey = (hid: number) => `hfact:${hid}`;
export type FactAgg = { exit: { n: number; stars: { k: string; name: string; icon: string; avg: number }[]; reasons: { r: string; n: number }[]; last: { text: string; dept?: string; years?: string; v?: boolean }[] }; n: number; verified: number; pay: { range: string; n: number }[]; payMid?: string; mood: { k: string; q: string; opts: readonly string[]; counts: number[]; top: number }[]; risks: { k: string; s: string; label: string; n: number }[]; good: number };
export function aggregate(rows: HFact[]): FactAgg {
  const n = rows.length; const pay = PAY.map(r => ({ range: r, n: rows.filter(x => x.pay === r).length }));
  const paid = rows.map(x => PAY.indexOf(x.pay as any)).filter(i => i >= 0).sort((a, b) => a - b); const payMid = paid.length ? PAY[paid[Math.floor((paid.length - 1) / 2)]] : undefined;
  const mood = MOOD.map(m => { const counts = m.opts.map((_, i) => rows.filter(x => (x as any)[m.k] === i).length); const top = counts.indexOf(Math.max(...counts)); return { ...m, counts, top }; });
  const risks = RISKS.map(r => ({ ...r, n: rows.filter(x => x.risks?.includes(r.k)).length })).filter(r => r.n > 0).sort((a, b) => b.n - a.n);
  const ex = rows.filter(x => x.status === "퇴사" && x.stars && Object.keys(x.stars).length);
  const exit = { n: ex.length, stars: EXIT_STARS.map(st => { const v = ex.map(x => x.stars![st.k]).filter(v => v >= 1 && v <= 5); return { ...st, avg: v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : 0 }; }),
    reasons: EXIT_REASONS.map(r => ({ r, n: ex.filter(x => x.reasons?.includes(r)).length })).filter(r => r.n).sort((a, b) => b.n - a.n),
    last: rows.filter(x => x.last).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 12).map(x => ({ text: x.last!, dept: x.dept, years: x.years, v: x.v })) };
  return { exit, n, verified: rows.filter(x => x.v).length, pay, payMid, mood, risks, good: rows.filter(x => x.good).length };
}
/** 공고 카드용 한 줄 */
export function factLine(a?: FactAgg): string[] {
  if (!a || a.n < MIN_N) return [];
  const out: string[] = []; if (a.payMid) out.push(`💰 실수령 ${a.payMid}만`);
  const t = a.mood.find(m => m.k === "taeum"); if (t && t.counts[2] > 0) out.push(`😣 태움 심함 ${t.counts[2]}/${a.n}`);
  if (a.risks[0]) out.push(`⚠️ ${a.risks[0].s} ${a.risks[0].n}/${a.n}`);
  return out;
}
