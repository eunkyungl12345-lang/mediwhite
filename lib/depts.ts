export const DEPTS = ["총괄", "간호", "원무과", "임상병리", "물리치료", "방사선"] as const;
export type Dept = (typeof DEPTS)[number];
export const NOTICE_CAT = "공지";
export const CATS = [NOTICE_CAT, ...DEPTS] as const;
export const display = (dept: string, nickname: string) => `[${dept}]${nickname}`;
