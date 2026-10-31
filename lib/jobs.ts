/** 채용·병원 리뷰 공통 상수 */
export const JOB_REGIONS = ["서울", "경기 남부", "경기 북부", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충청", "전라", "경상", "제주"] as const;
export const JOB_DEPTS = ["간호사", "간호조무사", "방사선", "물리치료", "작업치료사", "임상병리", "응급구조", "치과위생사", "치과기공사", "원무", "총괄", "병원컨설팅", "의사", "한의사", "기타"] as const;
export const EMP_TYPES = ["정규직", "계약직", "파트타임", "대체근무", "인턴"] as const;
export const HOSP_KINDS = ["의원", "병원", "종합병원", "상급종합", "요양병원", "한방병원", "치과", "기타"] as const;
export const RATING_KEYS = [
  { key: "r_welfare", name: "복지·혜택", icon: "🎁" },
  { key: "r_balance", name: "워라밸", icon: "⚖️" },
  { key: "r_pay", name: "급여", icon: "💰" },
  { key: "r_culture", name: "분위기·사람", icon: "🤝" },
  { key: "r_growth", name: "성장·배움", icon: "📈" },
] as const;
export type RatingKey = typeof RATING_KEYS[number]["key"];
export const avg = (rows: any[], k: string) => rows.length ? Math.round(rows.reduce((a, r) => a + (r[k] ?? 0), 0) / rows.length * 10) / 10 : 0;
export const overall = (rows: any[]) => rows.length ? Math.round(RATING_KEYS.reduce((a, k) => a + avg(rows, k.key), 0) / RATING_KEYS.length * 10) / 10 : 0;
export const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
export const dday = (d?: string | null) => { if (!d) return "상시"; const n = Math.ceil((Date.parse(d + "T23:59:59+09:00") - Date.now()) / 86400000); return n < 0 ? "마감" : n === 0 ? "오늘 마감" : `D-${n}`; };
