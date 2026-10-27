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
  { key: "free", name: "자유수다", icon: "💬", hint: "아무 얘기나" },
  { key: "hospital", name: "그 병원 어때", icon: "🏥", hint: "병원 분위기·복지·급여 솔직 후기" },
  { key: "life", name: "근무일상·고민", icon: "📝", hint: "오늘 있었던 일, 고민 상담" },
  { key: "study", name: "열린 공부방", icon: "📚", hint: "자격·시험·실무 공부" },
  { key: "info", name: "정보통", icon: "💡", hint: "꿀팁·뉴스·제도" },
  { key: "job", name: "구인구직·이직", icon: "💼", hint: "채용 정보, 이직 경험" },
  { key: "qna", name: "질문·답변", icon: "❓", hint: "궁금한 거 뭐든" },
] as const;
export type TopicKey = typeof TOPICS[number]["key"];
export const topicOf = (k: string | null | undefined) => TOPICS.find(t => t.key === k) ?? TOPICS[0];
