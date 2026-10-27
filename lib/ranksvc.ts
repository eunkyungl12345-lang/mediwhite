import { db } from "./supabase";
import { rankOf, RANKS, GENERAL, type Rank } from "./ranks";

/** 파트별 대장(경험치 1위, 대장 기준 이상) user id. */
export async function deptLeaders(): Promise<Record<string, string>> {
  const { data } = await db().from("users").select("id,dept,xp").gte("xp", RANKS[GENERAL][1]).order("xp", { ascending: false }).order("seq", { ascending: true });
  const out: Record<string, string> = {};
  for (const u of data ?? []) if (!out[u.dept]) out[u.dept] = u.id;
  return out;
}
export function rankFor(u: { id: string; dept: string; xp: number } | null | undefined, leaders: Record<string, string>): Rank {
  if (!u) return rankOf(0);
  return rankOf(u.xp, leaders[u.dept] === u.id);
}
export async function myRank(userId: string): Promise<Rank> {
  const [{ data: u }, leaders] = await Promise.all([db().from("users").select("id,dept,xp").eq("id", userId).maybeSingle(), deptLeaders()]);
  return rankFor(u, leaders);
}

/** 오늘의 파트 총사령관: 파트별 경험치 1위 (계급 무관). */
export async function deptCommanders(): Promise<{ dept: string; nickname: string; xp: number }[]> {
  const { data } = await db().from("users").select("nickname,dept,xp").order("xp", { ascending: false }).order("seq", { ascending: true }).limit(500);
  const seen = new Set<string>(), out: { dept: string; nickname: string; xp: number }[] = [];
  for (const u of data ?? []) if (!seen.has(u.dept)) { seen.add(u.dept); out.push(u); }
  return out;
}
