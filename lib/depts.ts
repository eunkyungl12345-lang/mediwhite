export const DEPTS = ["의사", "총괄", "방사선", "물리치료", "임상병리", "응급구조", "간호", "원무", "취준생", "대학생"] as const;
/** 병원 직군(파트 리더·파트 응원전 대상). 취준생/대학생은 게시판 칸만 */
export const HOSPITAL_DEPTS = ["의사", "총괄", "방사선", "물리치료", "임상병리", "응급구조", "간호", "원무"] as const;
export type Dept = (typeof DEPTS)[number];
export const NOTICE_CAT = "공지";
export const CATS = [NOTICE_CAT, ...DEPTS] as const;
export const display = (dept: string, nickname: string) => `[${dept}]${nickname}`;

/** 운영 계정 표시 */
export const OFFICIAL: Record<string, string> = { mw_team: "운영팀", mw_bot: "봇" };
/** 운영 소속: 파트 리더·참모총장 경쟁에서 제외, 직종 선택지에도 없음 */
export const STAFF_DEPT = "운영팀";
