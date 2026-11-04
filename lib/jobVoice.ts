/** 🗣️ "메디잡·사람인 쓰면서 뭐가 불편했어요?" — 의료직 구직 불편 설문 선택지 */
export const VOICE_OPTS = [
  { id: "mood", label: "병원 분위기·태움을 모르고 지원해요" },
  { id: "shift", label: "교대·근무형태가 안 적혀 있어요" },
  { id: "pay", label: "급여가 '협의'라 알 수가 없어요" },
  { id: "new", label: "신규 가능한지 모르겠어요" },
  { id: "filter", label: "원하는 조건으로 걸러보기 어려워요" },
  { id: "fake", label: "상시채용·허위 공고가 너무 많아요" },
  { id: "scatter", label: "단톡방·지인 공고가 흩어져 있어요" },
] as const;
export const voiceLabel = (id: string) => VOICE_OPTS.find(o => o.id === id)?.label ?? id;
