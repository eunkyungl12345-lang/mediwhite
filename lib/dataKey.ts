import { db } from "./supabase";
import { memo } from "./memo";
/** 공공데이터포털 인증키 — Vercel 환경변수(DATA_GO_KR_KEY) 우선, 없으면 settings(비공개, RLS로 외부 읽기 차단)의 data_go_kr_key */
export async function dataKey(): Promise<string> {
  const env = (process.env.DATA_GO_KR_KEY || "").trim(); if (env) return env;
  return memo("data_go_kr_key", 10 * 60_000, async () => { const { data } = await db().from("settings").select("value").eq("key", "data_go_kr_key").maybeSingle(); return (data?.value ?? "").trim(); });
}
