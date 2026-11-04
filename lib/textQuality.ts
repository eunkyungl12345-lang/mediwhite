/** ✍️ 성의 없는 글 거르기 — 잡플래닛보다 한 단계 더 (같은 글자 반복 + 자음·모음만 + 같은 말 반복) */
export function textProblem(t: string, min = 10): string | null {
  const s = t.trim(); if (s.length < min) return `${min}자 이상 적어주세요`;
  if (/(.)\1{4,}/u.test(s.replace(/\s/g, ""))) return "같은 글자를 5번 이상 연속으로 쓸 수 없어요";
  const chars = Array.from(s.replace(/[\s.,!?~^]/g, "")); if (!chars.length) return "내용을 적어주세요";
  const jamo = chars.filter(c => /[ㄱ-ㅎㅏ-ㅣ]/.test(c)).length; if (jamo / chars.length > 0.3) return "ㅋㅋ·ㅎㅎ 같은 자음·모음 말고 문장으로 적어주세요";
  if (chars.length >= 10 && new Set(chars).size / chars.length < 0.3) return "같은 말 반복 말고 실제 경험을 적어주세요";
  const words = s.split(/\s+/).filter(Boolean); if (words.length >= 4) { const top = Math.max(...Object.values(words.reduce((m, w) => (m[w] = (m[w] ?? 0) + 1, m), {} as Record<string, number>))); if (top / words.length > 0.5) return "같은 단어 반복 말고 실제 경험을 적어주세요"; }
  return null;
}
