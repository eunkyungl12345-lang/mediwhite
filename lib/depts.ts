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
  { key: "free", name: "자유", icon: "💬", hint: "아무 얘기나 편하게" },
  { key: "life", name: "일상·고민", icon: "📝", hint: "오늘 있었던 일, 고민 상담" },
  { key: "hospital", name: "병원 리뷰", icon: "🏥", hint: "분위기·복지·근무환경 솔직 후기 (실명 금지)" },
  { key: "pay", name: "급여·연봉", icon: "💰", hint: "급여·연봉·수당 이야기" },
  { key: "study", name: "공부·시험", icon: "📚", hint: "자격·시험·실무 공부" },
  { key: "info", name: "정보·꿀팁", icon: "💡", hint: "꿀팁·뉴스·제도 정보" },
  { key: "job", name: "이직·채용", icon: "💼", hint: "채용 정보, 이직 경험담" },
  { key: "qna", name: "질문", icon: "❓", hint: "궁금한 거 뭐든 물어보기" },
] as const;
export type TopicKey = typeof TOPICS[number]["key"];
/** 썸 탭 글 (메인 게시판엔 안 보임) */
export const SSUM_CAT = "썸";
export const SSUM_TOPICS = [
  { key: "moment", name: "오늘 설렌 순간", icon: "💓", hint: "사람을 특정하지 않는 설렘 썰 (병원명·실명·직함 X)" },
  { key: "advice", name: "썸 상담소", icon: "💭", hint: "\"이 정도면 저한테 관심 있는 걸까요?\"" },
] as const;
export const topicOf = (k: string | null | undefined) => (TOPICS as readonly { key: string; name: string; icon: string; hint: string }[]).concat(SSUM_TOPICS).find(t => t.key === k) ?? TOPICS[0];
