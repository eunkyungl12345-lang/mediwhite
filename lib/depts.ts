export const DEPTS = ["의사", "총괄", "방사선", "물리치료", "임상병리", "응급구조", "간호사", "간호조무사", "원무", "취준생", "대학생"] as const;
/** 병원 직군(파트 리더·파트 응원전 대상). 취준생/대학생은 게시판 칸만 */
export const HOSPITAL_DEPTS = ["의사", "총괄", "방사선", "물리치료", "임상병리", "응급구조", "간호사", "간호조무사", "원무"] as const;
export type Dept = (typeof DEPTS)[number];
export const NOTICE_CAT = "공지";
export const CATS = [NOTICE_CAT, ...DEPTS] as const;
export const display = (dept: string, nickname: string) => `[${dept}]${nickname}`;

/** 운영 계정 표시 */
export const OFFICIAL: Record<string, string> = { mw_team: "운영팀", mw_bot: "봇" };
/** 운영 소속: 파트 리더·참모총장 경쟁에서 제외, 직종 선택지에도 없음 */
export const STAFF_DEPT = "운영팀";

/** 공감 이모지 */
export const EMOJIS = ["👍", "😂", "😢", "🔥"] as const;
/** 글 주제(모든 직종 공통). 직종 칸 × 주제로 글을 분류 */
export const TOPICS = [
  { key: "free", name: "휴게실", icon: "☕", hint: "아무 얘기나 편하게" },
  { key: "life", name: "당직일지", icon: "📝", hint: "오늘 있었던 일, 고민 상담" },
  { key: "hospital", name: "병원 리뷰", icon: "🏥", hint: "분위기·복지·근무환경 솔직 후기 (실명 금지)" },
  { key: "pay", name: "월급봉투", icon: "💰", hint: "급여·연봉·수당 이야기" },
  { key: "study", name: "훈련소", icon: "📚", hint: "자격·시험·실무 공부" },
  { key: "info", name: "보급창고", icon: "🎒", hint: "꿀팁·뉴스·제도 정보" },
  { key: "job", name: "이직·채용", icon: "🚪", hint: "채용 정보, 이직 경험담" },
  { key: "qna", name: "무전", icon: "📻", hint: "궁금한 거 뭐든 물어보기" },
  { key: "item", name: "써봤더니", icon: "🧤", hint: "간호화·압박스타킹·간식·핸드크림… 직접 써본 솔직 후기 (좋았던 것도, 별로였던 것도)" },
] as const;
export type TopicKey = typeof TOPICS[number]["key"];
export const topicOf = (k: string | null | undefined) => TOPICS.find(t => t.key === k) ?? TOPICS[0];
