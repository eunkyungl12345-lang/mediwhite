import { YEARS } from "./hospFacts";
/** 💰 연봉 리뷰 · ⏱ 알바(단기) 리뷰 — 병원 체크와 별개로 남기는 가벼운 리뷰 두 종류.
 *  저장: game_state.game = `hx:pay:<병원id>` / `hx:alba:<병원id>` (한 사람이 병원마다 종류별 1개) */
export const XKINDS = ["pay", "alba"] as const; export type XKind = typeof XKINDS[number];
export const xKey = (k: XKind, hid: number) => `hx:${k}:${hid}`;
export const X_YEARS = YEARS;
export const CONTRACT = ["정규직", "계약직", "파트·시간제"] as const;
export const PAY_YEAR = ["올해", "작년", "2년 전 이상"] as const;
export const HOBONG = ["호봉제 아님", "1~3호봉", "4~6호봉", "7~9호봉", "10호봉 이상"] as const;
export const WORK_AREA = ["병동", "외래", "검진센터", "수술실·회복실", "응급실", "중환자실", "영상의학과", "진단검사", "재활·치료실", "원무·행정", "기타"] as const;
/** 연봉 리뷰 세부 평가 (선택, ★1~5) */
export const PAY_SUB = [{ k: "wlb", n: "워라밸" }, { k: "load", n: "업무 강도 (★ 많을수록 여유)" }, { k: "mood", n: "부서 분위기" }, { k: "wel", n: "복지" }] as const;
export const ALBA_UNIT = ["일급", "시급"] as const;
export const ALBA_TAX = ["3.3% 떼고", "일용직 신고", "4대 보험", "잘 모르겠어요"] as const;
export const ALBA_MEAL = ["식사 제공", "식대 지급", "없음"] as const;
export const ALBA_LOAD = ["여유로워요", "보통이에요", "빡세요"] as const;
export type XPay = { kind: "pay"; dept: string; years: string; contract: string; annual: number; hours?: number; year: string; star: number; word?: string; hobong?: string; area?: string; sub?: Record<string, number>; rec?: number; at: string };
export type XAlba = { kind: "alba"; dept: string; unit: string; amount: number; time: string; days?: string; tax: string; meal: string; load: string; again: number; work?: string; note?: string; cases?: number; star?: number; at: string };
/** 연봉 리뷰는 MIN명 이상 모여야 범위를 보여줘요 (한두 명이면 누군지 짐작할 수 있어서) */
export const X_MIN = 3;
/** 🏥 병원 후기(간단 작성) — 후기 구분 · 추천 3단계 */
export const REV_CATS = ["분위기", "업무강도", "면접·합격", "퇴사후기", "연봉"] as const;
export const REC3 = ["👍 추천", "😐 보통", "👎 비추천"] as const;

/** 🛡️ 고용안정성 & 채용실체 — 전환 체감(값 = 저장 번호) · 2년 만료 후 실태 */
export const HIRE_PILLS = [
  { v: 2, tone: "r", n: "🚨 0% 만기퇴사", sub: "희망고문", chip: "🚨 0% 만기퇴사", pct: 0 },
  { v: 1, tone: "y", n: "🟡 20% 바늘구멍", sub: "소수만 전환", chip: "🟡 20% 바늘구멍", pct: 20 },
  { v: 0, tone: "g", n: "🟢 70%+ 대부분 전환", sub: "안정권", chip: "🟢 70%+ 전환", pct: 80 },
  { v: 3, tone: "b", n: "🎯 처음부터 정규직 공채", sub: "계약직 기간 없음", chip: "🎯 정규직 공채", pct: null },
] as const;
export const AFTER2 = ["2년마다 전원 퇴사(물갈이)", "극소수만 남음", "대부분 정규직으로 계속 근무"] as const;
export const hireChip = (regular?: number) => HIRE_PILLS.find(p => p.v === regular)?.chip;
