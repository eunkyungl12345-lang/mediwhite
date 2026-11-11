/** 🔎 병원 실체 체크 — "입사해야만 알 수 있는 것"을 탭 몇 번으로 익명 수집
 *  실수령 월급 · 내부 분위기 · 치명적 리스크(육아휴직·임신 불이익 등)
 *  저장: game_state(user_id, game = "hfact:<병원id>", state) — 1인 1병원 1응답(수정 가능)
 *  공개 기준 (2026-11-11 완화): 분위기·별점·실수령 구간은 MIN_N(1)명부터 "n명 응답"과 함께 공개,
 *  병원에 딱지가 붙는 뱃지·경고는 BADGE_N(2)명부터, 직원 10명 이하 작은 곳은 SMALL_N(2)명부터 */
export const MIN_N = 1;
/** 직원 10명 이하 작은 병원·약국은 누가 썼는지 짐작되기 쉬워서 2명부터 */
export const SMALL_N = 2;
/** 긍정 뱃지·경고 요약줄은 한 사람 의견으로 붙지 않게 2명부터 */
export const BADGE_N = 2;
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
  // 💼 공고와 현실 (공고엔 절대 안 나오는 것)
  { k: "late", q: "공고 퇴근 시간보다 실제로 늦게 끝나는 편", opts: ["정시에 끝나요", "30분 안팎", "1시간 이상"], real: true },
  { k: "chores", q: "본업 말고 다른 일(접수·청소·소독·처치 보조)", opts: ["거의 없어요", "가끔 해요", "자주·당연하게"], real: true },
  { k: "incent", q: "인센티브·성과급", opts: ["약속대로 줘요", "말과 달라요", "따로 없어요"], real: true },
  { k: "leave2", q: "주5일·연차 방식", opts: ["주5일 + 연차 따로", "연차 써서 주5일", "주6일·토요 격주"], real: true },
  { k: "boss", q: "원장 스타일", opts: ["믿고 맡겨요", "보통이에요", "하나하나 간섭해요"], real: true },
] as const;
export const isField = (m: { k: string }) => ["early", "ot", "newquit"].includes(m.k);
/** '몰라요' 답의 번호 (있으면 막대·과반 계산에서 제외) */
export const unknownIdx = (_m: { k: string }) => -1;
export const isReal = (m: { k: string }) => ["late", "chores", "incent", "leave2", "boss"].includes(m.k);
/** 🌱 직종별 전환 현실에 늘 보여줄 4대 직종 (응답이 없어도 '첫 투표' 유도) */
export const HIRE_DEPTS = ["간호사", "방사선", "임상병리", "물리치료"] as const;
/** 체감 전환율(%) → 한 줄 판정. 70 이상 희망적 / 30 미만 만기퇴사 주의 / 그 사이 일부만 */
export const hireLabel = (pct: number) => pct >= 70 ? { t: 0, s: "🌱 대부분 전환" } : pct < 10 ? { t: 2, s: "🚨 만기퇴사 많음" } : { t: 1, s: "🟡 일부만 전환" };
export const RISKS = [
  { k: "parental", s: "육아휴직 불이익", label: "육아휴직 쓰기 어렵거나 쓰면 불이익" },
  { k: "pregnant", s: "임신 불이익", label: "임신하면 눈치·불이익" },
  { k: "unpaid", s: "수당·월급 체불", label: "수당·월급이 밀리거나 덜 나와요" },
  { k: "leave", s: "연차 못 씀", label: "연차를 거의 못 써요" },
  { k: "offback", s: "오프 반납", label: "오프 반납·근무표 갑자기 변경" },
  { k: "short", s: "인력 부족", label: "늘 인력 부족" },
  { k: "probation", s: "긴 수습 감액", label: "수습 급여 깎는 기간이 길어요" },
  { k: "resign", s: "사직 지연", label: "사직서를 잘 안 받아줘요" },
  { k: "turnover", s: "계약직 만기퇴사 반복", label: "정규직 전환 없이 계약직만 돌려막기(2년 만기퇴사)" },
] as const;
/** 🚪 퇴사자 내부 평가 — 별 5개 기준 + 퇴사 사유 + 마지막 한마디 */
export const EXIT_STARS = [
  { k: "people", name: "분위기·동료", icon: "🤝" }, { k: "pay", name: "급여", icon: "💰" }, { k: "balance", name: "워라밸", icon: "⚖️" },
  { k: "boss", name: "상사·관리자", icon: "🧑‍💼" }, { k: "edu", name: "교육·성장", icon: "📈" }, { k: "welfare", name: "복지", icon: "🎁" }, { k: "load", name: "업무강도(적당함)", icon: "🏋️" },
] as const;
export const FUTURE = ["📈 좋아질 것 같아요", "➖ 비슷할 것 같아요", "📉 나빠질 것 같아요"] as const;
export const EXIT_REASONS = ["급여가 낮아서", "태움·인간관계", "업무 과다·인력 부족", "상사·관리자", "교대·근무시간", "결혼·출산·육아", "이사·통근", "커리어·이직", "건강", "계약 만료", "기타"] as const;
export type HFact = { shift?: number; overall?: number; rec?: number; future?: number; v?: boolean; stars?: Record<string, number>; reasons?: string[]; last?: string; pay?: string; years?: string; dept?: string; status?: string; regularPct?: number; taeum?: number; off?: number; quit?: number; risks?: string[]; good?: boolean; at?: string };
export const factKey = (hid: number) => `hfact:${hid}`;
export type FactAgg = { need?: number; overallAvg: number; recPct: number; recN: number; words: string[]; future: number[]; stars: { k: string; name: string; icon: string; avg: number }[]; starAvg: number; starN: number; exit: { n: number; stars: { k: string; name: string; icon: string; avg: number }[]; reasons: { r: string; n: number }[]; last: { text: string; dept?: string; years?: string; v?: boolean }[] }; n: number; verified: number; pay: { range: string; n: number }[]; payMid?: string; hire: { dept: string; avg: number; n: number }[]; hireAvg: number; hireN: number; mood: { k: string; q: string; opts: readonly string[]; counts: number[]; top: number }[]; risks: { k: string; s: string; label: string; n: number }[]; good: number };
export function aggregate(rows: HFact[]): FactAgg {
  const n = rows.length; const pay = PAY.map(r => ({ range: r, n: rows.filter(x => x.pay === r).length }));
  const paid = rows.map(x => PAY.indexOf(x.pay as any)).filter(i => i >= 0).sort((a, b) => a - b); const payMid = paid.length ? PAY[paid[Math.floor((paid.length - 1) / 2)]] : undefined;
  const mood = MOOD.map(m => { const u = unknownIdx(m), counts = m.opts.map((_, i) => i === u ? 0 : rows.filter(x => (x as any)[m.k] === i).length); const top = counts.indexOf(Math.max(...counts)); return { ...m, counts, top }; });
  // 🌱 직종별 체감 전환율: 각자 적은 %의 평균 (0~100)
  const hd: Record<string, number[]> = {}, hv: number[] = []; for (const x of rows) { const v = x.regularPct; if (typeof v === "number" && v >= 0 && v <= 100) { hv.push(v); (hd[x.dept || "기타"] ??= []).push(v); } }
  const avgOf = (v: number[]) => Math.round(v.reduce((p, c) => p + c, 0) / v.length);
  const hire = Object.entries(hd).map(([dept, v]) => ({ dept, avg: avgOf(v), n: v.length })).sort((p, q) => q.n - p.n), hireAvg = hv.length ? avgOf(hv) : 0, hireN = hv.length;
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
  return { overallAvg, recPct: rc.length ? Math.round(rc.filter(x => x.rec === 1).length / rc.length * 100) : 0, recN: rc.length, future: [0, 1, 2].map(k => rows.filter(x => x.future === k).length), words: rows.filter(x => x.last).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 12).map(x => x.last!), stars, starAvg, starN: sr.length, exit, n, verified: rows.filter(x => x.v).length, pay, payMid, mood, hire, hireAvg, hireN, risks, good: rows.filter(x => x.good).length };
}
/** 공고 카드용 한 줄 */
export function factLine(a?: FactAgg, locked?: boolean): string[] {
  const M = a?.need ?? MIN_N; if (!a || a.n < M) return [];
  if (locked) return [`🔒 실수령·별점·리스크 ${a.n}명 응답 — 체크 하나면 6개월간 열려요`];
  const out: string[] = []; if (a.payMid) out.push(`💰 실수령 ${a.payMid}만`); if (a.starN >= M) out.push(`⭐ ${a.overallAvg.toFixed(1)}`); if (a.recN >= M) out.push(`👍 추천 ${a.recPct}%`);
  if (a.n < Math.max(M, BADGE_N)) return out; // 아래 경고들은 2명 이상 응답부터
  const t = a.mood.find(m => m.k === "taeum"); if (t && t.counts[2] > 0) out.push(`😣 태움 심함 ${t.counts[2]}/${a.n}`);
  const ot = a.mood.find(m => m.k === "ot"); if (ot && ot.counts[1] + ot.counts[2] > 0 && ot.counts[1] + ot.counts[2] >= ot.counts[0]) out.push(`⏱️ OT 수당 눈치 ${ot.counts[1] + ot.counts[2]}/${a.n}`);
  const lt = a.mood.find(m => m.k === "late"); if (lt && lt.counts[2] > 0 && lt.counts[2] * 2 >= lt.counts.reduce((x, y) => x + y, 0)) out.push(`🕖 실제 퇴근 1시간+ ${lt.counts[2]}/${a.n}`);
  const ch = a.mood.find(m => m.k === "chores"); if (ch && ch.counts[2] > 0 && ch.counts[2] * 2 >= ch.counts.reduce((x, y) => x + y, 0)) out.push(`🧹 잡무 많음 ${ch.counts[2]}/${a.n}`);
  const lv = a.mood.find(m => m.k === "leave2"); if (lv && lv.counts[1] > 0 && lv.counts[1] * 2 >= lv.counts.reduce((x, y) => x + y, 0)) out.push(`⚠️ 연차로 만든 주5일 ${lv.counts[1]}/${a.n}`);
  if (a.hireN >= BADGE_N && a.hireAvg < 10) out.push(`🚨 계약직 만기퇴사 주의 (체감 전환율 ${a.hireAvg}%)`);
  if (a.risks[0]) out.push(`⚠️ ${a.risks[0].s} ${a.risks[0].n}/${a.n}`);
  return out;
}

/** 🌿 긍정 뱃지 — 좋은 점만 사실처럼 짧게 (응답 과반이 그렇다고 할 때만, 공개 기준 넘은 병원만). 잠금 상태에도 보여줘요 */
export function posBadges(a?: FactAgg): string[] {
  const M = Math.max(a?.need ?? MIN_N, BADGE_N); if (!a || a.n < M) return [];
  const maj = (k: string, i: number) => { const m = a.mood.find(x => x.k === k); const tot = m ? m.counts.reduce((x, y) => x + y, 0) : 0; return !!m && tot >= M && m.counts[i] * 2 > tot; };
  const out: string[] = [];
  if (maj("late", 0)) out.push("⏰ 정시 퇴근"); if (!maj("late", 0) && maj("off", 0)) out.push("🏃 대부분 칼퇴"); if (maj("taeum", 0)) out.push("😊 태움 거의 없음");
  if (maj("leave2", 0)) out.push("🌴 주5일 + 연차 따로");
  if (maj("boss", 0)) out.push("🙆 원장 터치 적음"); if (maj("quit", 0)) out.push("🧑‍🤝‍🧑 오래 다니는 곳"); if (maj("incent", 0)) out.push("💸 인센 약속 지킴");
  if (a.hireN >= BADGE_N && a.hireAvg >= 70) out.push("🌱 계약직 전환 희망적");
  if (maj("ot", 0)) out.push("💵 OT 수당 챙겨줌"); if (maj("chores", 0)) out.push("🧹 본업만 해요"); if (maj("early", 0)) out.push("🌅 일찍 출근 없음");
  const w = a.stars.find(x => x.k === "welfare"); if (a.starN >= M && w && w.avg >= 4) out.push("🎁 복지 좋음");
  if (a.verified >= 2) out.push(`✅ 인증 ${a.verified}명`);
  if (!a.risks.length && a.good >= M) out.push("🛡️ 리스크 신고 없음");
  return out;
}
