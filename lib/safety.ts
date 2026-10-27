/** 특정 개인을 지칭하는 표현 감지(실명·직함). 완벽하지 않지만 올리기 전 한 번 멈추게 하는 용도 */
const TITLES = "(선생님|쌤|샘|과장님?|원장님?|부장님?|팀장님?|실장님?|수간호사|간호사|의사|교수님?|대리님?|주임님?|사원|조무사|방사선사|치료사|병리사)";
const RE = [
  new RegExp(`[가-힣]{2,4}\\s?${TITLES}`),          // 홍길동 선생님 / 김과장
  /[가-힣]{3}\s?(이|가|은|는|씨|님)\s/,                 // 홍길동이 / 홍길동씨
  /[가-힣]{2,3}\s?\(\s?[가-힣]{2,10}\s?\)/,          // 김OO(간호사)
  /010[-\s]?\d{3,4}[-\s]?\d{4}/,                     // 전화번호
  /[A-Za-z]\.[가-힣]{2,}|[가-힣]\s?[OoㅇX*]{1,2}\s?[가-힣]/, // 김O수, 김ㅇㅇ
];
export function personMention(text: string): string | null {
  for (const r of RE) { const m = text.match(r); if (m) return m[0]; }
  return null;
}
export const REPORT_REASONS = [
  ["defame", "특정 개인 실명·비방"],
  ["privacy", "환자·개인정보 노출"],
  ["adult", "19금·욕설"],
  ["spam", "광고·도배"],
  ["other", "기타"],
] as const;
