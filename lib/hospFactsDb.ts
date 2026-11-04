import { db } from "./supabase";
import { aggregate, type FactAgg, type HFact } from "./hospFacts";
/** 병원 id들 → 실체 체크 집계 */
export async function loadFacts(hids?: number[]): Promise<Record<number, FactAgg>> {
  let q = db().from("game_state").select("user_id,game,state").like("game", "hfact:%").limit(5000);
  if (hids) { if (!hids.length) return {}; q = q.in("game", hids.map(h => `hfact:${h}`)); }
  let vq = db().from("game_state").select("user_id,game,state").like("game", "hverify:%").limit(5000); if (hids) vq = vq.in("game", hids.map(h => `hverify:${h}`));
  const [{ data }, { data: vs }] = await Promise.all([q, vq]); const by: Record<number, HFact[]> = {};
  const ok = new Set((vs ?? []).filter(v => (v.state as any)?.status === "approved").map(v => `${v.user_id}:${String(v.game).slice(8)}`));
  for (const r of data ?? []) { const id = Number(String(r.game).slice(6)); (by[id] ??= []).push({ ...(r.state as HFact), v: ok.has(`${r.user_id}:${id}`) }); }
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [Number(k), aggregate(v)]));
}
/** give-to-get: 실체 체크를 1번이라도 했거나 병원 리뷰를 남긴 사람만 상세 열람 */
export async function hasContributed(userId: string, role?: string): Promise<boolean> {
  if (role === "admin") return true; const d = db();
  const [{ count: a }, { count: b }] = await Promise.all([d.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", userId).like("game", "hfact:%"), d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("user_id", userId)]);
  return (a ?? 0) + (b ?? 0) > 0;
}
