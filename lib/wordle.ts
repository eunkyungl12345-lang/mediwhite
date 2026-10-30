/** 오늘의 메디워들 정답 목록 (서버 전용으로만 import 해요) */
export const WORDS: [string, string][] = [
  ["HEART", "심장"], ["BLOOD", "혈액"], ["NERVE", "신경"], ["TIBIA", "경골(정강뼈)"], ["FEMUR", "대퇴골"], ["SKULL", "두개골"], ["SPINE", "척추"], ["PULSE", "맥박"],
  ["ORGAN", "장기"], ["LIVER", "간"], ["COLON", "결장"], ["AORTA", "대동맥"], ["RENAL", "신장의"], ["GAUZE", "거즈"], ["SERUM", "혈청"], ["VIRUS", "바이러스"],
  ["TUMOR", "종양"], ["ULCER", "궤양"], ["EDEMA", "부종"], ["FEVER", "발열"], ["SCRUB", "수술복·손 소독"], ["STENT", "스텐트"], ["CHEST", "흉부"], ["ELBOW", "팔꿈치"],
  ["WRIST", "손목"], ["ANKLE", "발목"], ["THUMB", "엄지"], ["BOWEL", "장"], ["LUNGS", "폐"], ["MOLAR", "어금니"], ["GLAND", "샘(분비선)"], ["LYMPH", "림프"],
  ["ILEUM", "회장"], ["SUGAR", "혈당"], ["NURSE", "간호사"], ["SHOCK", "쇼크"], ["APNEA", "무호흡"], ["COUGH", "기침"], ["CRAMP", "경련·쥐"], ["STOMA", "장루"],
  ["GLOVE", "장갑"], ["VITAL", "활력징후"], ["PILLS", "알약"], ["ENEMA", "관장"], ["URINE", "소변"], ["LABOR", "분만"], ["FETUS", "태아"], ["OVARY", "난소"],
  ["NASAL", "코의"], ["OPTIC", "시신경의"], ["MUCUS", "점액"], ["SWEAT", "땀"], ["TOXIN", "독소"], ["CYSTS", "낭종"], ["SCARS", "흉터"], ["DOSES", "용량"],
  ["BRAIN", "뇌"], ["TEETH", "치아"], ["BONES", "뼈"], ["SPLEN", ""], ["JOINT", "관절"], ["MUSCLE", ""], ["SINUS", "부비동"], ["PALSY", "마비"],
  ["ANGIO", "혈관조영"], ["CLAMP", "겸자"], ["PROBE", "탐촉자"], ["SCOPE", "내시경"], ["XRAYS", "엑스레이"], ["SPRAY", "분무"], ["DRAIN", "배액관"], ["SWABS", "면봉"],
  ["TONIC", "강장제"], ["VOMIT", "구토"], ["RASHY", ""], ["ACUTE", "급성"], ["SPASM", "연축"], ["SEPTA", "중격(복수)"], ["CARDS", ""], ["HYOID", "설골"],
  ["CARPI", "손목뼈(복수)"], ["RADII", "요골(복수)"], ["TALUS", "거골"], ["PATEL", ""], ["ATRIA", "심방(복수)"], ["VAGUS", "미주신경"], ["PLEXUS", ""], ["DERMA", "피부"],
].filter(([w, m]) => /^[A-Z]{5}$/.test(w) && m) as [string, string][];
export const kstDay = (offset = 0) => new Date(Date.now() + 9 * 3600000 + offset * 86400000).toISOString().slice(0, 10);
const EPOCH = Date.UTC(2026, 9, 30);
export const puzzleNo = (day: string) => Math.floor((Date.parse(day + "T00:00:00Z") - EPOCH) / 86400000) + 1;
/** 날짜마다 섞인 순서로 하나씩 (같은 날은 모두 같은 단어) */
export function answerFor(day: string): [string, string] {
  const n = puzzleNo(day), L = WORDS.length, i = ((n * 37 + 11) % L + L) % L;
  return WORDS[i];
}
export function marks(guess: string, ans: string) {
  const r = Array(5).fill("b"), left: Record<string, number> = {};
  for (let i = 0; i < 5; i++) if (guess[i] === ans[i]) r[i] = "g"; else left[ans[i]] = (left[ans[i]] ?? 0) + 1;
  for (let i = 0; i < 5; i++) if (r[i] !== "g" && left[guess[i]] > 0) { r[i] = "y"; left[guess[i]]--; }
  return r.join("");
}
