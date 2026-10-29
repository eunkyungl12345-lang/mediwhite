/** 사주팔자(四柱八字) 간단 계산 + 풀이. 절기는 날짜 근사(±1일)라 경계일 생은 한 달 차이가 날 수 있어요. */
import { STEMS, STEMS_H, BRANCHES, ANIMALS, dayGanzhi, yearGanzhi, hourBranch } from "./fortune";
export const BRANCHES_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export type El = "목" | "화" | "토" | "금" | "수";
export const STEM_EL: El[] = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
export const BRANCH_EL: El[] = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];
export const EL_COLOR: Record<El, string> = { 목: "#3E9B57", 화: "#E2574C", 토: "#C9A227", 금: "#8A94A3", 수: "#2F67B8" };
export const EL_HAN: Record<El, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const EL_ORDER: El[] = ["목", "화", "토", "금", "수"];
const yang = (stem: number) => stem % 2 === 0;

/** 절입일 근사: 각 월(1~12월)의 절기 시작일 → 해당 월지 */
const JEOL: [number, number, number][] = [[1, 6, 1], [2, 4, 2], [3, 6, 3], [4, 5, 4], [5, 6, 5], [6, 6, 6], [7, 7, 7], [8, 8, 8], [9, 8, 9], [10, 8, 10], [11, 7, 11], [12, 7, 0]];
function monthBranch(m: number, d: number) { const [, day, br] = JEOL[m - 1]; return d >= day ? br : (br + 11) % 12; }
export type Pillar = { stem: number; branch: number };
export function pillars(birth: string, time?: string | null) {
  const [y, m, d] = birth.split("-").map(Number);
  const yr = yearGanzhi(y, m, d), dy = dayGanzhi(y, m, d), mb = monthBranch(m, d);
  const ms = ((yr.stem % 5) * 2 + 2 + ((mb - 2 + 12) % 12)) % 10;
  const hb = hourBranch(time);
  const hour: Pillar | null = hb === null ? null : { stem: ((dy.stem % 5) * 2 + hb) % 10, branch: hb };
  return { year: { stem: yr.stem, branch: yr.branch }, month: { stem: ms, branch: mb }, day: { stem: dy.stem, branch: dy.branch }, hour };
}
export const pName = (p: Pillar) => STEMS[p.stem] + BRANCHES[p.branch];
export const pHan = (p: Pillar) => STEMS_H[p.stem] + BRANCHES_H[p.branch];

/** 십성: 일간 기준 */
export function tenGod(dayStem: number, otherEl: El, otherYang: boolean) {
  const me = EL_ORDER.indexOf(STEM_EL[dayStem]), o = EL_ORDER.indexOf(otherEl), same = yang(dayStem) === otherYang;
  if (me === o) return same ? "비견" : "겁재";
  if ((me + 1) % 5 === o) return same ? "식신" : "상관";
  if ((me + 2) % 5 === o) return same ? "편재" : "정재";
  if ((o + 2) % 5 === me) return same ? "편관" : "정관";
  return same ? "편인" : "정인";
}
export const GOD_DESC: Record<string, string> = {
  비견: "주체성·독립심", 겁재: "승부욕·추진력", 식신: "여유·먹복·재능", 상관: "말솜씨·창의·반골", 편재: "사업 수완·큰 돈", 정재: "성실한 재물·알뜰함",
  편관: "카리스마·위기 대처", 정관: "원칙·명예·조직", 편인: "직관·독특한 재능", 정인: "학업·자격증·어른 복",
};
export const DAY_MASTER: Record<number, { title: string; nature: string; work: string; love: string }> = {
  0: { title: "갑목(甲木) · 큰 나무", nature: "곧게 뻗는 리더형. 정의감이 강하고 한번 정한 목표는 끝까지 밀고 가요. 남에게 굽히기 싫어하는 자존심이 매력이자 숙제.", work: "책임자·리더 역할에서 빛나요. 새 프로젝트나 신규 파트 세팅에 강해요.", love: "듬직하게 기대게 해주는 타입. 표현은 서툴러도 한결같아요." },
  1: { title: "을목(乙木) · 꽃과 덩굴", nature: "부드럽지만 질긴 생존력. 사람 사이를 잘 엮고 분위기를 읽는 눈치가 뛰어나요.", work: "협업·조율·고객 응대에 강해요. 어떤 부서에 가도 금방 적응해요.", love: "섬세하게 챙겨주는 다정한 연애. 서운함을 담아두지 않는 게 포인트." },
  2: { title: "병화(丙火) · 태양", nature: "밝고 화끈한 분위기 메이커. 숨김없이 솔직하고 사람들에게 에너지를 나눠줘요.", work: "발표·교육·홍보처럼 앞에 서는 일에 강해요. 팀 사기를 끌어올리는 사람.", love: "적극적이고 표현 풍부한 연애. 뜨겁게 시작해 오래 가려면 배려가 필요해요." },
  3: { title: "정화(丁火) · 촛불", nature: "따뜻하고 섬세한 속불. 겉은 차분해도 마음속엔 열정과 집중력이 가득해요.", work: "디테일이 중요한 일, 한 분야를 깊게 파는 전문직에 잘 맞아요.", love: "은은하게 오래 타는 사랑. 작은 기념일을 소중히 여겨요." },
  4: { title: "무토(戊土) · 큰 산", nature: "묵직하고 믿음직한 중심. 쉽게 흔들리지 않고 모두를 품는 포용력이 있어요.", work: "관리·운영·중재 역할에 탁월해요. 위기 때 더 빛나는 사람.", love: "변함없는 안정감을 주는 연애. 표현을 조금만 더 하면 완벽!" },
  5: { title: "기토(己土) · 논밭", nature: "실속 있고 꼼꼼한 살림꾼. 사람을 키우고 돌보는 데 재능이 있어요.", work: "교육·간호·케어처럼 사람을 돌보는 일, 꼼꼼한 행정에 강해요.", love: "배려 깊고 현실적인 연애. 상대를 성장시키는 사랑을 해요." },
  6: { title: "경금(庚金) · 바위와 쇠", nature: "단단하고 결단력 있는 승부사. 의리 있고 맺고 끊음이 확실해요.", work: "결단이 필요한 자리, 응급·수술처럼 빠른 판단이 필요한 일에 강해요.", love: "직진형 연애. 내 사람은 확실히 지키는 의리파." },
  7: { title: "신금(辛金) · 보석", nature: "섬세하고 완벽주의적인 미적 감각. 자기만의 기준과 품위를 중요하게 여겨요.", work: "정확성이 생명인 검사·분석·디자인 분야에서 두각을 나타내요.", love: "취향이 확실한 연애. 작은 디테일에 감동받아요." },
  8: { title: "임수(壬水) · 바다", nature: "넓고 깊은 지혜와 큰 스케일. 자유로운 사고와 유연함으로 어디든 흘러가요.", work: "기획·전략·대외 업무처럼 넓게 보는 일에 강해요.", love: "넓은 마음으로 품어주는 연애. 구속받는 걸 싫어해요." },
  9: { title: "계수(癸水) · 이슬과 비", nature: "조용하지만 스며드는 영향력. 직관과 공감 능력이 뛰어나요.", work: "상담·연구·기록처럼 섬세한 관찰이 필요한 일에 잘 맞아요.", love: "감성 충만 연애. 상대 마음을 먼저 알아채는 사람." },
};
const LACK: Record<El, string> = {
  목: "목(木)이 약해요 → 새로운 시작·공부에 힘을 실어주세요. 초록색, 동쪽, 식물 키우기가 도움이 돼요.",
  화: "화(火)가 약해요 → 표현·열정을 보충하세요. 빨강·주황, 남쪽, 햇볕 쬐기와 가벼운 운동이 좋아요.",
  토: "토(土)가 약해요 → 안정감이 필요해요. 노랑·베이지, 규칙적인 식사와 생활 리듬이 운을 받쳐줘요.",
  금: "금(金)이 약해요 → 결단력·정리가 필요해요. 흰색·은색, 서쪽, 주변 정리정돈이 운을 열어요.",
  수: "수(水)가 약해요 → 휴식과 유연함이 필요해요. 검정·남색, 북쪽, 물 자주 마시기와 충분한 수면!",
};
const MUCH: Record<El, string> = {
  목: "목 기운이 넘쳐요. 고집이 세질 수 있으니 한 번 더 듣는 연습을.", 화: "화 기운이 넘쳐요. 급한 마음과 말실수를 조심하세요.",
  토: "토 기운이 넘쳐요. 걱정이 많아질 수 있으니 생각을 덜어내세요.", 금: "금 기운이 넘쳐요. 날카로운 말투가 오해를 부를 수 있어요.",
  수: "수 기운이 넘쳐요. 생각이 많아 결정이 늦어질 수 있어요.",
};
export function analyze(birth: string, time?: string | null) {
  const P = pillars(birth, time);
  const list: { p: Pillar; label: string }[] = [{ p: P.year, label: "년주" }, { p: P.month, label: "월주" }, { p: P.day, label: "일주" }, ...(P.hour ? [{ p: P.hour, label: "시주" }] : [])];
  const count: Record<El, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const { p } of list) { count[STEM_EL[p.stem]]++; count[BRANCH_EL[p.branch]]++; }
  const ds = P.day.stem, sorted = EL_ORDER.slice().sort((a, b) => count[a] - count[b]);
  const gods: Record<string, number> = {};
  for (const { p, label } of list) { if (label !== "일주") { const g = tenGod(ds, STEM_EL[p.stem], yang(p.stem)); gods[g] = (gods[g] ?? 0) + 1; } const g2 = tenGod(ds, BRANCH_EL[p.branch], p.branch % 2 === 0); gods[g2] = (gods[g2] ?? 0) + 1; }
  const topGods = Object.entries(gods).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
  const me = DAY_MASTER[ds];
  // 신강·신약 (아주 단순화): 나를 돕는 오행(비겁+인성) 개수
  const meEl = STEM_EL[ds], helpEl = EL_ORDER[(EL_ORDER.indexOf(meEl) + 4) % 5], strong = count[meEl] + count[helpEl] >= (P.hour ? 4 : 3);
  return {
    P, list, count, lack: sorted[0], much: sorted[4], me, meEl, strong, topGods,
    lackText: count[sorted[0]] === 0 ? LACK[sorted[0]] : LACK[sorted[0]].replace("약해요", "부족한 편이에요"), muchText: count[sorted[4]] >= 3 ? MUCH[sorted[4]] : null,
    animal: ANIMALS[P.year.branch],
  };
}
/** 오늘·이번 달·올해 기운과 내 일간의 관계 */
export function flowRel(dayStem: number, otherStem: number) {
  const g = tenGod(dayStem, STEM_EL[otherStem], yang(otherStem));
  const T: Record<string, string> = {
    비견: "동료·친구와 함께할 일이 늘어요. 독립적으로 움직이되 나눠 갖는 마음을.", 겁재: "경쟁이 붙는 시기. 지출과 보증은 조심, 체력 관리는 확실히.",
    식신: "먹을 복·여유가 들어와요. 하고 싶던 취미나 공부를 시작하기 좋아요.", 상관: "아이디어와 말발이 살아나요. 다만 윗사람과의 말다툼은 피하세요.",
    편재: "큰 돈의 흐름이 보여요. 기회는 크지만 무리한 투자는 금물.", 정재: "성실한 만큼 쌓이는 시기. 저축·재테크 계획을 세우기 좋아요.",
    편관: "책임과 압박이 커지지만 버티면 크게 성장해요. 건강 관리 필수.", 정관: "승진·인정·자리 운. 원칙을 지키면 좋은 평가가 따라와요.",
    편인: "직관이 예민해져요. 혼자만의 시간과 새로운 공부가 운을 열어요.", 정인: "귀인·문서·자격 운. 시험이나 계약에 좋은 흐름이에요.",
  };
  return { god: g, text: T[g] };
}
export function yearPillarOf(y: number) { const i = ((y - 4) % 60 + 60) % 60; return { stem: i % 10, branch: i % 12 }; }
export function monthPillarNow(y: number, m: number, d: number) { const yr = yearGanzhi(y, m, d), mb = monthBranch(m, d); return { stem: ((yr.stem % 5) * 2 + 2 + ((mb - 2 + 12) % 12)) % 10, branch: mb }; }
