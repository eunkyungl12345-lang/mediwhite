import { cache } from "react";
import { db } from "./supabase";
import { rankOf, RANKS, GENERAL, type Rank } from "./ranks";

/** 파트별 참모총장(경험치 1위, 기준 이상, 분신 제외) user id */
export const deptLeaders = cache(async (): Promise<Record<string, string>> => {
  const { data } = await db().from("users").select("id,dept,xp").eq("stealth", false).gte("xp", RANKS[GENERAL][1]).order("xp", { ascending: false }).order("seq", { ascending: true });
  const out: Record<string, string> = {};
  for (const u of data ?? []) if (!out[u.dept]) out[u.dept] = u.id;
  return out;
});
export function rankFor(u: { id: string; dept: string; xp: number } | null | undefined, leaders: Record<string, string>): Rank {
  if (!u) return rankOf(0);
  return rankOf(u.xp, leaders[u.dept] === u.id);
}
export async function myRank(userId: string): Promise<Rank> {
  const [{ data: u }, leaders] = await Promise.all([db().from("users").select("id,dept,xp").eq("id", userId).maybeSingle(), deptLeaders()]);
  return rankFor(u, leaders);
}
/** 파트 리더(계급 무관 파트 경험치 1위) — 파트 게시판 탭 신설 권한 */
export const deptCommanders = cache(async (): Promise<{ id: string; dept: string; nickname: string; username: string; xp: number }[]> => {
  const { data } = await db().from("users").select("id,nickname,username,dept,xp").eq("stealth", false).order("xp", { ascending: false }).order("seq", { ascending: true }).limit(1000);
  const seen = new Set<string>(), out: any[] = [];
  for (const u of data ?? []) if (!seen.has(u.dept)) { seen.add(u.dept); out.push(u); }
  return out;
});
export async function isDeptLeader(userId: string, dept: string) {
  return (await deptCommanders()).some(c => c.id === userId && c.dept === dept);
}
