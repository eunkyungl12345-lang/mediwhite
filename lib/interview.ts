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
/** 화면 표시용 결과 칩 — 합격 / 불합격 / 대기중 */
export const IV_RESULT_LABEL: Record<string, string> = { "합격 후 입사": "✅ 합격 · 입사함", "합격했지만 입사 안 함": "✅ 합격 · 입사 안 함", "불합격": "❌ 불합격", "결과 대기": "⏳ 대기중" };
export const ivResultTone = (r: string) => r.startsWith("합격") ? "ok" : r === "불합격" ? "no" : "wait";
/** 목록 카드용 짧은 결과 배지 — ✅ 합격 / ❌ 불합격 / ⏳ 결과 대기 (입사 여부는 시그널 띠에 따로) */
export const ivResultShort = (r: string) => r.startsWith("합격") ? "✅ 합격" : r === "불합격" ? "❌ 불합격" : "⏳ 결과 대기";
export const IV_WAIT = [3, 7, 14, 30, 60] as const;
export const IV_FEEL = ["😊 좋았어요", "😐 보통", "😣 별로였어요"] as const;
/** 면접이 공정했는지 — '내정자 있고 나머지는 병풍' 후기가 반복돼서 */
export const IV_FAIR = ["🙆 골고루 질문했어요", "🤷 잘 모르겠어요", "🙈 내정자 있는 듯·병풍 느낌"] as const;
export const IV_LEVEL = ["매우 쉬움", "쉬움", "보통", "어려움", "매우 어려움"] as const;
export type Interview = { dept: string; year: string; route: string; steps: string[]; level: number; result: string; feel: number; q: string; tip?: string; follow?: string; wait?: number; fair?: number; gap?: boolean; at: string };
export const ivKey = (hid: number) => `hintv:${hid}`;

/** 외부 공고 주소("서울 광진 · 건대입구역") → 채용 지역 추정. 모르면 "" (직접 고르게) */
export const guessRegion = (area: string, regions: readonly string[]) => { const t = area.split(/\s/)[0];
  if (t === "경기") return /고양|파주|의정부|남양주|구리|양주|동두천|포천|연천|가평|김포/.test(area) ? "경기 북부" : "경기 남부";
  if (/충[남북]|충청/.test(t)) return "충청"; if (/전[남북]|전라/.test(t)) return "전라"; if (/경[남북]|경상/.test(t)) return "경상";
  return regions.includes(t) ? t : ""; };
export const guessKind = (name: string) => /치과/.test(name) ? "치과" : /한의원|한방/.test(name) ? "한방병원" : /요양병원/.test(name) ? "요양병원" : /종합병원|의료원/.test(name) ? "종합병원" : /의원$|의원\s/.test(name) ? "의원" : /병원/.test(name) ? "병원" : "기타";
