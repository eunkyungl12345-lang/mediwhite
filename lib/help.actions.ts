"use server";
import { db } from "./supabase";
import { getSession } from "./auth";
/** 👍 도움이 돼요 — events(kind="rvhelp", text="<병원id>:<리뷰키>") 1인 1회, 다시 누르면 취소 */
export async function toggleHelp(hid: number, key: string): Promise<{ on: boolean; n: number } | { error: string }> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" }; const d = db();
  if (!/^[rf][\w-]{1,40}$/.test(key)) return { error: "잘못된 요청" }; const text = `${Number(hid) || 0}:${key}`;
  const { data: ex } = await d.from("events").select("id").eq("kind", "rvhelp").eq("user_id", u.id).eq("text", text).limit(1);
  if (ex?.length) await d.from("events").delete().eq("kind", "rvhelp").eq("user_id", u.id).eq("text", text);
  else await d.from("events").insert({ kind: "rvhelp", user_id: u.id, text });
  const { count } = await d.from("events").select("id", { count: "exact", head: true }).eq("kind", "rvhelp").eq("text", text);
  return { on: !ex?.length, n: count ?? 0 };
}
