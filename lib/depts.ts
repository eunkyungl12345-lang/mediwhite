export const DEPTS = ["의사", "총괄", "방사선", "물리치료", "임상병리", "응급구조", "간호", "원무", "취준생", "대학생"] as const;
/** 병원 직군(파트 리더·파트 응원전 대상). 취준생/대학생은 게시판 칸만 */
export const HOSPITAL_DEPTS = ["의사", "총괄", "방사선", "물리치료", "임상병리", "응급구조", "간호", "원무"] as const;
export type Dept = (typeof DEPTS)[number];
export const NOTICE_CAT = "공지";
export const CATS = [NOTICE_CAT, ...DEPTS] as const;
export const display = (dept: string, nickname: string) => `[${dept}]${nickname}`;
