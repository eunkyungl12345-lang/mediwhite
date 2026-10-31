export const DEPTS = ["의사", "한의사", "총괄", "병원컨설팅", "간호사", "간호조무사", "방사선", "물리치료", "작업치료사", "임상병리", "응급구조", "치과위생사", "치과기공사", "원무", "취준생", "대학생", "타직장인", "업체"] as const;
/** 병원 직군(파트 리더·파트 응원전 대상). 취준생/대학생/타직장인/업체는 게시판 칸만 */
export const HOSPITAL_DEPTS = ["의사", "한의사", "총괄", "병원컨설팅", "간호사", "간호조무사", "방사선", "물리치료", "작업치료사", "임상병리", "응급구조", "치과위생사", "치과기공사", "원무"] as const;
/** 가입 화면 직종 묶음 */
export const DEPT_GROUPS: [string, readonly string[]][] = [
  ["의료진", ["의사", "한의사", "간호사", "간호조무사"]],
  ["치료·검사", ["방사선", "물리치료", "작업치료사", "임상병리", "응급구조", "치과위생사", "치과기공사"]],
  ["행정·운영", ["총괄", "원무", "병원컨설팅"]],
  ["그 외", ["취준생", "대학생", "타직장인", "업체"]],
];
/** 직종 표시 이름(데이터 키는 유지, 화면 라벨만) */
export const DEPT_LABEL: Record<string, string> = { 방사선: "방사선사", 물리치료: "물리치료사", 임상병리: "임상병리사", 응급구조: "응급구조사", 총괄: "병원총괄", 원무: "원무과" };
/** 업체 회원의 분야 (가입 시 선택) */
export const VENDOR_FIELDS = ["노무", "세무", "마케팅", "소모품", "청소", "단말기", "인테리어", "약품", "제약회사", "의료기기", "프로그램"] as const;
export const deptLabel = (d: string) => DEPT_LABEL[d] ?? d;
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
  { key: "job", name: "이직·채용", icon: "💼", hint: "이직 경험담·조언 (공식 채용공고는 💼 채용 탭에!)" },
  { key: "qna", name: "질문", icon: "❓", hint: "궁금한 거 뭐든 물어보기" },
] as const;
export type TopicKey = typeof TOPICS[number]["key"];
/** 썸 탭 글 (메인 게시판엔 안 보임) */
export const SSUM_CAT = "썸";
/** 완전 익명 게시판: 글·댓글에 닉네임·직종·계급이 전혀 안 보여요 */
export const ANON_CAT = "익명";
export const ANON_TOPICS = [
  { key: "free", name: "아무말", icon: "🕶️" }, { key: "vent", name: "속풀이", icon: "😤" }, { key: "worry", name: "고민", icon: "🌧️" }, { key: "secret", name: "비밀", icon: "🤫" }, { key: "pay", name: "급여·이직", icon: "💰" }, { key: "boss", name: "상사·동료", icon: "🙄" }, { key: "qna", name: "질문", icon: "❓" },
] as const;
export const SSUM_TOPICS = [
  { key: "confess", name: "공개고백", icon: "💌", hint: "초성으로 마음을 전해요 (예: ㄱㅁㅈ 쌤, 늘 고마워요). 실명·병원명(초성 포함)·병동·층은 절대 금지! 💘" },
  { key: "moment", name: "오늘 설렌 순간", icon: "💓", hint: "사람을 특정하지 않는 설렘 썰 (병원명·실명·병동 X)" },
  { key: "advice", name: "썸 상담소", icon: "💭", hint: "\"이 정도면 저한테 관심 있는 걸까요?\"" },
] as const;
export const topicOf = (k: string | null | undefined) => (TOPICS as readonly { key: string; name: string; icon: string; hint: string }[]).concat(SSUM_TOPICS).find(t => t.key === k) ?? TOPICS[0];
