import { db } from "./supabase";
/** 목록용: 여러 대상의 현재 보는 사람 수 (50초 창) */
export async function liveCounts(kind: string, targets: string[]): Promise<Record<string, number>> {
  if (!targets.length) return {};
  const { data } = await db().from("live_views").select("target").eq("kind", kind).in("target", targets).gte("seen_at", new Date(Date.now() - 50_000).toISOString());
  const m: Record<string, number> = {}; for (const r of data ?? []) m[r.target] = (m[r.target] ?? 0) + 1; return m;
}
