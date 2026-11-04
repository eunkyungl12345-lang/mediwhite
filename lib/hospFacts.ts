/** 🔎 병원 실체 체크 — "입사해야만 알 수 있는 것"을 탭 몇 번으로 익명 수집
 *  실수령 월급 · 내부 분위기 · 치명적 리스크(육아휴직·임신 불이익 등)
 *  저장: game_state(user_id, game = "hfact:<병원id>", state) — 1인 1병원 1응답(수정 가능)
 *  공개: 응답 MIN_N명 이상일 때만 집계로 (누가 답했는지 특정 안 되게) */
export const MIN_N = 3;
/** 직원 10명 이하 작은 병원·약국은 누가 썼는지 짐작되기 쉬워서 5명 */
export const SMALL_N = 5;
export const PAY = ["~200", "200~250", "250~300", "300~350", "350~400", "400~500", "500~600", "600~700", "700~800", "800~1000", "1000~1500", "1500+"] as const; // 세후 월 실수령(만원)
export const SHIFT = ["3교대", "2교대", "상근(데이)"] as const; // 0·1 = 교대, 2 = 상근
export const YEARS = ["신규·1년 미만", "1~3년", "4~7년", "8년 이상"] as const;
export const MOOD = [
  { k: "taeum", q: "태움·갑질", opts: ["거의 없어요", "가끔 있어요", "심해요"] },
  { k: "off", q: "제때 퇴근", opts: ["대부분 칼퇴", "반반", "거의 못 해요"] },
  { k: "quit", q: "사람이 나가는 편", opts: ["잘 안 나가요", "보통", "자주 나가요"] },
  // 🏥 의료 현장 지표 (잡플래닛·블라인드엔 없는 것)
  { k: "early", q: "인계 때문에 일찍 출근", opts: ["안 해요", "15~30분", "30분 넘게"], field: true },
  { k: "ot", q: "오버타임 수당", opts: ["다 달아줘요", "눈치 보여요", "거의 못 달아요"], field: true },
  { k: "newquit", q: "신규가 1년 안에 그만두는 편", opts: ["드물어요", "반쯤", "대부분"], field: true },
] as const;
export const isField = (m: { k: string }) => ["early", "ot", "newquit"].includes(m.k);
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
  { k: "people", name: "분위기·동료", icon: "🤝" }, { k: "pay", name: "급여", icon: "💰" }, { k: "balance", name: "워라밸", icon: "⚖️" },
  { k: "boss", name: "상사·관리자", icon: "🧑‍💼" }, { k: "edu", name: "교육·성장", icon: "📈" }, { k: "welfare", name: "복지", icon: "🎁" }, { k: "load", name: "업무강도(적당함)", icon: "🏋️" },
] as const;
export const FUTURE = ["📈 좋아질 것 같아요", "➖ 비슷할 것 같아요", "📉 나빠질 것 같아요"] as const;
export const EXIT_REASONS = ["급여가 낮아서", "태움·인간관계", "업무 과다·인력 부족", "상사·관리자", "교대·근무시간", "결혼·출산·육아", "이사·통근", "커리어·이직", "건강", "계약 만료", "기타"] as const;
export type HFact = { shift?: number; overall?: number; rec?: number; future?: number; v?: boolean; stars?: Record<string, number>; reasons?: string[]; last?: string; pay?: string; years?: string; dept?: string; status?: string; taeum?: number; off?: number; quit?: number; risks?: string[]; good?: boolean; at?: string };
export const factKey = (hid: number) => `hfact:${hid}`;
export type FactAgg = { need?: number; overallAvg: number; recPct: number; recN: number; words: string[]; future: number[]; stars: { k: string; name: string; icon: string; avg: number }[]; starAvg: number; starN: number; exit: { n: number; stars: { k: string; name: string; icon: string; avg: number }[]; reasons: { r: string; n: number }[]; last: { text: string; dept?: string; years?: string; v?: boolean }[] }; n: number; verified: number; pay: { range: string; n: number }[]; payMid?: string; mood: { k: string; q: string; opts: readonly string[]; counts: number[]; top: number }[]; risks: { k: string; s: string; label: string; n: number }[]; good: number };
export function aggregate(rows: HFact[]): FactAgg {
  const n = rows.length; const pay = PAY.map(r => ({ range: r, n: rows.filter(x => x.pay === r).length }));
  const paid = rows.map(x => PAY.indexOf(x.pay as any)).filter(i => i >= 0).sort((a, b) => a - b); const payMid = paid.length ? PAY[paid[Math.floor((paid.length - 1) / 2)]] : undefined;
  const mood = MOOD.map(m => { const counts = m.opts.map((_, i) => rows.filter(x => (x as any)[m.k] === i).length); const top = counts.indexOf(Math.max(...counts)); return { ...m, counts, top }; });
  const risks = RISKS.map(r => ({ ...r, n: rows.filter(x => x.risks?.includes(r.k)).length })).filter(r => r.n > 0).sort((a, b) => b.n - a.n);
  const sr = rows.filter(x => x.stars && Object.keys(x.stars).length);
  const stars = EXIT_STARS.map(st => { const v = sr.map(x => x.stars![st.k]).filter(v => v >= 1 && v <= 5); return { ...st, avg: v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : 0 }; });
  const starAvg = sr.length ? Math.round(stars.reduce((a, b) => a + b.avg, 0) / stars.length * 10) / 10 : 0;
  const ex = rows.filter(x => x.status === "퇴사" && x.reasons?.length);
  const exit = { n: ex.length, stars: EXIT_STARS.map(st => { const v = ex.map(x => x.stars![st.k]).filter(v => v >= 1 && v <= 5); return { ...st, avg: v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : 0 }; }),
    reasons: EXIT_REASONS.map(r => ({ r, n: ex.filter(x => x.reasons?.includes(r)).length })).filter(r => r.n).sort((a, b) => b.n - a.n),
    last: rows.filter(x => x.last).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 12).map(x => ({ text: x.last!, v: x.v })) };
  const ov = rows.map(x => x.overall ?? 0).filter(v => v >= 1 && v <= 5), rc = rows.filter(x => x.rec === 0 || x.rec === 1);
  const overallAvg = ov.length ? Math.round(ov.reduce((a, b) => a + b, 0) / ov.length * 10) / 10 : starAvg;
  return { overallAvg, recPct: rc.length ? Math.round(rc.filter(x => x.rec === 1).length / rc.length * 100) : 0, recN: rc.length, future: [0, 1, 2].map(k => rows.filter(x => x.future === k).length), words: rows.filter(x => x.last).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 12).map(x => x.last!), stars, starAvg, starN: sr.length, exit, n, verified: rows.filter(x => x.v).length, pay, payMid, mood, risks, good: rows.filter(x => x.good).length };
}
/** 공고 카드용 한 줄 */
export function factLine(a?: FactAgg, locked?: boolean): string[] {
  const M = a?.need ?? MIN_N; if (!a || a.n < M) return [];
  if (locked) return [`🔒 실수령·별점·리스크 ${a.n}명 응답 — 체크 하나면 6개월간 열려요`];
  const out: string[] = []; if (a.payMid) out.push(`💰 실수령 ${a.payMid}만`); if (a.starN >= M) out.push(`⭐ ${a.overallAvg.toFixed(1)}`); if (a.recN >= M) out.push(`👍 추천 ${a.recPct}%`);
  const t = a.mood.find(m => m.k === "taeum"); if (t && t.counts[2] > 0) out.push(`😣 태움 심함 ${t.counts[2]}/${a.n}`);
  const ot = a.mood.find(m => m.k === "ot"); if (ot && ot.counts[1] + ot.counts[2] > 0 && ot.counts[1] + ot.counts[2] >= ot.counts[0]) out.push(`⏱️ OT 수당 눈치 ${ot.counts[1] + ot.counts[2]}/${a.n}`);
  if (a.risks[0]) out.push(`⚠️ ${a.risks[0].s} ${a.risks[0].n}/${a.n}`);
  return out;
}
