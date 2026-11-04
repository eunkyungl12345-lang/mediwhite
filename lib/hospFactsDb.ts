import { db } from "./supabase";
import { aggregate, type FactAgg, type HFact } from "./hospFacts";
/** 병원 id들 → 실체 체크 집계 */
export async function loadFacts(hids?: number[]): Promise<Record<number, FactAgg>> {
  let q = db().from("game_state").select("game,state").like("game", "hfact:%").limit(5000);
  if (hids) { if (!hids.length) return {}; q = q.in("game", hids.map(h => `hfact:${h}`)); }
  const { data } = await q; const by: Record<number, HFact[]> = {};
  for (const r of data ?? []) { const id = Number(String(r.game).slice(6)); (by[id] ??= []).push(r.state as HFact); }
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [Number(k), aggregate(v)]));
}
