import { db } from "./supabase";
import { aggregate, SMALL_N, MIN_N, type FactAgg, type HFact } from "./hospFacts";
/** 병원 id들 → 실체 체크 집계 */
export async function loadFacts(hids?: number[]): Promise<Record<number, FactAgg>> {
  let q = db().from("game_state").select("user_id,game,state").like("game", "hfact:%").limit(5000);
  if (hids) { if (!hids.length) return {}; q = q.in("game", hids.map(h => `hfact:${h}`)); }
  let vq = db().from("game_state").select("user_id,game,state").like("game", "hverify:%").limit(5000); if (hids) vq = vq.in("game", hids.map(h => `hverify:${h}`));
  const [{ data }, { data: vs }] = await Promise.all([q, vq]); const by: Record<number, HFact[]> = {};
  const ok = new Set((vs ?? []).filter(v => (v.state as any)?.status === "approved").map(v => `${v.user_id}:${String(v.game).slice(8)}`));
  for (const r of data ?? []) { const id = Number(String(r.game).slice(6)); (by[id] ??= []).push({ ...(r.state as HFact), v: ok.has(`${r.user_id}:${id}`) }); }
  const ids = Object.keys(by); const { data: np } = ids.length ? await db().from("settings").select("key,value").in("key", ids.map(k => `nps:${k}`)) : { data: [] as any[] };
  const small = new Set((np ?? []).filter(r => { try { const c = JSON.parse(r.value).cnt; return c > 0 && c <= 10; } catch { return false; } }).map(r => Number(String(r.key).slice(4))));
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [Number(k), { ...aggregate(v), need: small.has(Number(k)) ? SMALL_N : MIN_N }]));
}
/** give-to-get: 최근 6개월 안에 실체 체크(또는 리뷰)를 남긴 사람만 상세 열람 */
export async function hasContributed(userId: string, role?: string): Promise<boolean> {
  if (role === "admin") return true; const d = db();
  const since = new Date(Date.now() - 183 * 86400000).toISOString(); // 체크 하나면 6개월간 전체 열람 (잡플래닛식 — 계속 새 정보가 들어오게)
  const [{ count: a }, { count: b }] = await Promise.all([d.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", userId).like("game", "hfact:%").gte("updated_at", since), d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since)]);
  return (a ?? 0) + (b ?? 0) > 0;
}
/** ☀️ 3교대 탈출 비교 — 교대(3·2교대) vs 상근 응답 전체를 합쳐서 */
export async function shiftCompare() {
  const { data } = await db().from("game_state").select("game,state").like("game", "hfact:%").limit(10000);
  const rows = (data ?? []).map(r => ({ hid: Number(String(r.game).slice(6)), s: r.state as HFact })).filter(r => r.s.shift === 0 || r.s.shift === 1 || r.s.shift === 2);
  const grp = (f: (x: HFact) => boolean) => { const g = rows.filter(r => f(r.s)).map(r => r.s); return { n: g.length, a: aggregate(g), offPct: g.length ? Math.round(g.filter(x => x.off === 0).length / g.length * 100) : 0 }; };
  const byH: Record<number, { day: number; all: number }> = {}; for (const r of rows) { const b = (byH[r.hid] ??= { day: 0, all: 0 }); b.all++; if (r.s.shift === 2) b.day++; }
  const dayHosp = Object.entries(byH).filter(([, v]) => v.day * 2 > v.all).map(([k]) => Number(k));
  return { shift: grp(x => x.shift !== 2), day: grp(x => x.shift === 2), dayHosp };
}
