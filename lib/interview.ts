/** 🎤 면접 후기 — 대학병원은 면접이 진짜 중요해서. game_state(game="hintv:<병원id>")에 1인 1병원 */
export const IV_ROUTE = ["공채", "수시", "지인 추천", "헤드헌팅·기타"] as const;
export const IV_STEPS = ["서류", "인적성·AI역량", "필기·술기 시험", "실무 면접", "임원·간호부장 면접", "PT·토론", "신체검사"] as const;
export const IV_RESULT = ["합격 후 입사", "합격했지만 입사 안 함", "불합격", "결과 대기"] as const;
/** 결과마다 따로 묻는 한 가지 (잡플래닛 참고) */
export const IV_FOLLOW: Record<string, { q: string; ph: string; tag: string }> = {
  "합격 후 입사": { q: "처우·연봉 협상은 어땠나요?", ph: "예) 호봉표대로라 협상은 없었고, 경력 인정은 70%만 됐어요", tag: "처우" },
  "합격했지만 입사 안 함": { q: "왜 입사하지 않기로 했나요?", ph: "예) 면접 때 들은 근무표·급여가 공고와 달랐어요", tag: "안 간 이유" },
  "불합격": { q: "다음 지원자에게 조언 한마디", ph: "예) 술기 시험 비중이 커요. 활력징후·IV 연습하고 가세요", tag: "조언" },
};
export const isPass = (r: string) => r.startsWith("합격");
export const IV_WAIT = [3, 7, 14, 30, 60] as const;
export const IV_FEEL = ["😊 좋았어요", "😐 보통", "😣 별로였어요"] as const;
export const IV_LEVEL = ["매우 쉬움", "쉬움", "보통", "어려움", "매우 어려움"] as const;
export type Interview = { dept: string; year: string; route: string; steps: string[]; level: number; result: string; feel: number; q: string; tip?: string; follow?: string; wait?: number; at: string };
export const ivKey = (hid: number) => `hintv:${hid}`;
