/** ✍️ 입력 검사 — 2026-11-10 제한 해제: 빈칸만 막고 나머지(최소 글자수·반복 글자·자음모음·반복 단어)는 모두 허용 */
export function textProblem(t: string, _min = 0): string | null {
  return t.trim() ? null : "내용을 적어주세요";
}
