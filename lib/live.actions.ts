"use server";
import { db } from "./supabase";
import { getSession } from "./auth";
const WINDOW = 50_000;
/** "지금 N명 보는 중" — 20초마다 핑. 50초 안에 핑한 사람 수를 돌려줘요 */
export async function liveBeat(kind: string, target: string): Promise<number> {
  const s = await getSession(); if (!s) return 0;
  const d = db(), now = Date.now();
  await d.from("live_views").upsert({ kind, target, user_id: s.id, seen_at: new Date(now).toISOString() });
  if (Math.random() < .05) d.from("live_views").delete().lt("seen_at", new Date(now - 10 * 60_000).toISOString()).then(() => {}, () => {});
  const { count } = await d.from("live_views").select("user_id", { count: "exact", head: true }).eq("kind", kind).eq("target", target).gte("seen_at", new Date(now - WINDOW).toISOString());
  return count ?? 0;
}
export async function liveLeave(kind: string, target: string) { const s = await getSession(); if (!s) return; await db().from("live_views").delete().eq("kind", kind).eq("target", target).eq("user_id", s.id); }
