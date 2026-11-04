/** 🎤 면접 후기 — 대학병원은 면접이 진짜 중요해서. game_state(game="hintv:<병원id>")에 1인 1병원 */
export const IV_ROUTE = ["공채", "수시", "지인 추천", "헤드헌팅·기타"] as const;
export const IV_STEPS = ["서류", "인적성·AI역량", "필기·술기 시험", "실무 면접", "임원·간호부장 면접", "PT·토론", "신체검사"] as const;
export const IV_RESULT = ["합격", "불합격", "결과 대기"] as const;
export const IV_FEEL = ["😊 좋았어요", "😐 보통", "😣 별로였어요"] as const;
export const IV_LEVEL = ["매우 쉬움", "쉬움", "보통", "어려움", "매우 어려움"] as const;
export type Interview = { dept: string; year: string; route: string; steps: string[]; level: number; result: string; feel: number; q: string; tip?: string; at: string };
export const ivKey = (hid: number) => `hintv:${hid}`;
