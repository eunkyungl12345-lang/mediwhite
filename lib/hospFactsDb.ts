import { memo } from "./memo";
import { db } from "./supabase";
import { aggregate, SMALL_N, MIN_N, type FactAgg, type HFact } from "./hospFacts";
/** 병원 id들 → 실체 체크 집계 */
/** 📦 전체 집계는 60초 캐시 (병원 리뷰·채용 화면이 매번 수천 줄을 읽지 않게). 리뷰 저장 시 memoDel("facts_") */
export async function loadFacts(hids?: number[]): Promise<Record<number, FactAgg>> {
  if (hids && !hids.length) return {};
  const { memo } = await import("./memo"); const all = await memo("facts_all", 60_000, () => loadFactsRaw());
  if (!hids) return all; const out: Record<number, FactAgg> = {}; for (const h of hids) if (all[h]) out[h] = all[h]; return out;
}
async function loadFactsRaw(hids?: number[]): Promise<Record<number, FactAgg>> {
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
/** 열람 잠금 방식 (관리자 설정 settings.lock_mode): off = 모두 열람 / free3 = 병원 3곳까지 무료 / on = 체크해야 열람 */
export type LockMode = "off" | "free3" | "on";
/** 🎉 오픈 기념 무료 열람 마감일 (settings.open_promo = "YYYY-MM-DD"). 이 날까지는 체크 없이도 전부 열람 */
export async function promoUntil(): Promise<string | null> { const { memo } = await import("./memo"); return memo("open_promo", 60_000, async () => { const { data } = await db().from("settings").select("value").eq("key", "open_promo").maybeSingle(); const v = data?.value ?? ""; const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= today ? v : null; }); }
export async function lockMode(): Promise<LockMode> { if (await promoUntil()) return "off"; const { memo } = await import("./memo"); return memo("lock_mode", 60_000, async () => { const { data } = await db().from("settings").select("value").eq("key", "lock_mode").maybeSingle(); const v = data?.value; return v === "off" || v === "on" ? v : "free3"; }); }
/** give-to-get: 최근 6개월 안에 실체 체크(또는 리뷰)를 남긴 사람만 상세 열람. hid를 주면 'free3' 모드에서 병원 3곳까지 무료 */
export async function hasContributed(userId: string, role?: string, hid?: number): Promise<boolean> {
  if (role === "admin") return true; const mode = await lockMode(); if (mode === "off") return true; const d = db();
  const since = new Date(Date.now() - 183 * 86400000).toISOString();
  const gs = (p: string) => d.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", userId).like("game", p).gte("updated_at", since);
  const [{ count: a }, { count: b }, { count: c }] = await Promise.all([gs("hfact:%"), d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since), gs("hwel:%")]);
  if ((a ?? 0) + (b ?? 0) + (c ?? 0) > 0) return true;
  if (mode !== "free3" || !hid) return false;
  const { data: g } = await d.from("game_state").select("state").eq("user_id", userId).eq("game", "hseen").maybeSingle(); const ids: number[] = (g?.state as any)?.ids ?? [];
  if (ids.includes(hid)) return true; if (ids.length >= FREE_N) return false;
  await d.from("game_state").upsert({ user_id: userId, game: "hseen", state: { ids: [...ids, hid] }, updated_at: new Date().toISOString() }); return true;
}
export const FREE_N = 3;
export async function freeLeft(userId: string): Promise<number> { const { data: g } = await db().from("game_state").select("state").eq("user_id", userId).eq("game", "hseen").maybeSingle(); return Math.max(0, FREE_N - (((g?.state as any)?.ids ?? []).length)); }
/** ☀️ 3교대 탈출 비교 — 대학·종합병원(대부분 교대) vs 로컬 의원·치과·약국(대부분 상근). 병원 종류 기준이라 근무 형태 답이 없어도 비교돼요 */
export async function shiftCompare() {
  const { data } = await db().from("game_state").select("game,state").like("game", "hfact:%").limit(10000);
  const rows0 = (data ?? []).map(r => ({ hid: Number(String(r.game).slice(6)), s: r.state as HFact }));
  const hids = Array.from(new Set(rows0.map(r => r.hid))); const { data: hs } = hids.length ? await db().from("hospitals").select("id,kind").in("id", hids) : { data: [] as any[] };
  const K = new Map((hs ?? []).map(h => [h.id, h.kind as string])), big = (k?: string) => /상급종합|종합병원|^병원$|요양병원/.test(k ?? ""), local = (k?: string) => /의원|치과|약국|한방병원/.test(k ?? "");
  const rows = rows0.filter(r => K.has(r.hid));
  const grp = (f: (hid: number) => boolean) => { const g = rows.filter(r => f(r.hid)).map(r => r.s); return { n: g.length, a: aggregate(g), offPct: g.length ? Math.round(g.filter(x => x.off === 0).length / g.length * 100) : 0 }; };
  const dayHosp = hids.filter(h => local(K.get(h)));
  return { shift: grp(h => big(K.get(h))), day: grp(h => local(K.get(h))), dayHosp };
}

/** 🌱 아직 병원 체크·리뷰가 하나도 없는 회원인가 (첫인상 화면을 리뷰 중심으로 단순하게 보여줄 때 씀). 1분 캐시 */
export async function isFresh(userId: string, role?: string): Promise<boolean> {
  if (role === "admin") return false;
  return memo("fresh:" + userId, 60_000, async () => { const d = db();
    const [{ count: a }, { count: b }] = await Promise.all([d.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", userId).like("game", "hfact:%"), d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("user_id", userId)]);
    return (a ?? 0) + (b ?? 0) === 0; });
}
