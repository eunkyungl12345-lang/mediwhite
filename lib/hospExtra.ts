import { YEARS } from "./hospFacts";
/** 💰 연봉 리뷰 · ⏱ 알바(단기) 리뷰 — 병원 체크와 별개로 남기는 가벼운 리뷰 두 종류.
 *  저장: game_state.game = `hx:pay:<병원id>` / `hx:alba:<병원id>` (한 사람이 병원마다 종류별 1개) */
export const XKINDS = ["pay", "alba"] as const; export type XKind = typeof XKINDS[number];
export const xKey = (k: XKind, hid: number) => `hx:${k}:${hid}`;
export const X_YEARS = YEARS;
export const CONTRACT = ["정규직", "계약직", "파트·시간제"] as const;
export const PAY_YEAR = ["올해", "작년", "2년 전 이상"] as const;
export const ALBA_UNIT = ["일급", "시급"] as const;
export const ALBA_TAX = ["3.3% 떼고", "일용직 신고", "4대 보험", "잘 모르겠어요"] as const;
export const ALBA_MEAL = ["식사 제공", "식대 지급", "없음"] as const;
export const ALBA_LOAD = ["여유로워요", "보통이에요", "빡세요"] as const;
export type XPay = { kind: "pay"; dept: string; years: string; contract: string; annual: number; hours?: number; year: string; star: number; word?: string; at: string };
export type XAlba = { kind: "alba"; dept: string; unit: string; amount: number; time: string; days?: string; tax: string; meal: string; load: string; again: number; work?: string; note?: string; at: string };
/** 연봉 리뷰는 MIN명 이상 모여야 범위를 보여줘요 (한두 명이면 누군지 짐작할 수 있어서) */
export const X_MIN = 3;
