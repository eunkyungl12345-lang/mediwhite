import { db } from "./supabase";
import { awardXp } from "./xp";
import { gameEvent } from "./feed";
import { kstDay } from "./wordle";
import { HOSPITAL_DEPTS } from "./depts";

/** 이번 주 월요일 (KST) */
export const weekStart = (offsetWeeks = 0) => { const n = new Date(Date.now() + 9 * 3600000); const dow = (n.getUTCDay() + 6) % 7; n.setUTCDate(n.getUTCDate() - dow + offsetWeeks * 7); return n.toISOString().slice(0, 10); };
const pts = (g: string, best: number) => g === "wordle" ? (best > 0 ? 10 + best * 10 : 5) : g === "iv" ? Math.round(best / 40) : 10;
/** 부서 대항전: 데일리 게임 기록을 부서별로 합산 */
export async function deptBattle(from: string, to?: string) {
  let q = db().from("daily_plays").select("user_id,game,best,users(dept,username)").gte("day", from).neq("game", "iv");
  if (to) q = q.lt("day", to);
  const { data } = await q.limit(5000);
  const by: Record<string, { pts: number; people: Set<string> }> = {};
  for (const r of (data ?? []) as any[]) { const d = r.users?.dept; if (!d || !(HOSPITAL_DEPTS as readonly string[]).includes(d) || /^zz_/.test(r.users?.username ?? "")) continue; (by[d] ??= { pts: 0, people: new Set() }); by[d].pts += pts(r.game, Number(r.best)); by[d].people.add(r.user_id); }
  return Object.entries(by).map(([dept, v]) => ({ dept, pts: v.pts, people: v.people.size, ids: [...v.people] })).sort((a, b) => b.pts - a.pts);
}
/** 지난주 1위 부서 참가자에게 +200 XP (한 번만) */
export async function settleDeptWeek() {
  const last = weekStart(-1), cur = weekStart(0);
  const rows = await deptBattle(last, cur); const top = rows[0]; if (!top) return null;
  let first = false; for (const id of top.ids) { const got = await awardXp(id, 200, `dept_week:${last}`, "daily"); if (got) first = true; }
  if (first) await gameEvent(`🏆 지난주 미니게임 부서 대항전 1위: [${top.dept}]! 참가자 전원 +200 XP`);
  return top.dept;
}
/** 실시간 방: 최근 30분 안에 움직인 방 · 들어가 있는 사람 수 */
export async function liveRooms() {
  const since = new Date(Date.now() - 30 * 60000).toISOString(), s = db();
  const [{ data: om }, { data: dr }] = await Promise.all([s.from("omok_rooms").select("id,status").gte("updated_at", since), s.from("draw_rooms").select("id,status").gte("updated_at", since)]);
  const live = (rs: any[] | null) => (rs ?? []).filter(r => !["done", "finished", "over", "end"].includes(r.status));
  const oms = live(om), drs = live(dr);
  const [{ count: op }, { count: dp }] = await Promise.all([oms.length ? s.from("omok_players").select("user_id", { count: "exact", head: true }).in("room_id", oms.map(r => r.id)) : Promise.resolve({ count: 0 }), drs.length ? s.from("draw_players").select("user_id", { count: "exact", head: true }).in("room_id", drs.map(r => r.id)) : Promise.resolve({ count: 0 })]);
  return { omok: { rooms: oms.length, people: op ?? 0 }, draw: { rooms: drs.length, people: dp ?? 0 } };
}
export async function myMissions(uid: string) {
  const { data } = await db().from("daily_plays").select("game,attempts,best,data").eq("user_id", uid).eq("day", kstDay()).in("game", ["wordle", "roulette", "quiz"]);
  const m = Object.fromEntries((data ?? []).map((r: any) => [r.game, r]));
  return { wordle: !!m.wordle?.data?.done, roulette: !!m.roulette, quiz: !!m.quiz };
}
