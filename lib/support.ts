import { cache } from "react";
import { db } from "./supabase";
import { DEPTS } from "./depts";

export const POINT_PER_WON = 0.1;              // 1,000원 = 100 공동 경험치
export const AMOUNTS = [5000, 10000, 30000, 50000];

/** 파트별 공동 경험치 순위. 1위 = 대표 파트(상위노출) */
export const deptPools = cache(async () => {
  const { data } = await db().from("dept_pool").select("dept,points,updated_at");
  const map = new Map((data ?? []).map(d => [d.dept, d]));
  const rows = DEPTS.map(d => ({ dept: d, points: map.get(d)?.points ?? 0, updated_at: map.get(d)?.updated_at ?? null }))
    .sort((a, b) => b.points - a.points || (a.updated_at ?? "").localeCompare(b.updated_at ?? ""));
  const top = rows[0]?.points > 0 ? rows[0].dept : null;
  return { rows, top };
});
export async function bankInfo() { const { data } = await db().from("settings").select("value").eq("key", "bank").maybeSingle(); return data?.value ?? ""; }
