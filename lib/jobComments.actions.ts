"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { reviewProblem } from "./safety";
type R = { error?: string; ok?: boolean } | undefined;
/** 공고 익명 댓글 쓰기 — 직종만 같이 저장, 표시는 "익명(직종)" */
export async function postJobComment(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" };
  const jk = String(fd.get("jk") ?? ""), text = String(fd.get("text") ?? "").trim().slice(0, 300), back = String(fd.get("back") ?? "/jobs");
  if (!/^[jx]\d{1,12}$/.test(jk)) return { error: "공고를 찾을 수 없어요" };
  if (!text) return { error: "내용을 적어주세요" }; const p = reviewProblem(text); if (p) return { error: p };
  const s = db(), since = new Date(Date.now() - 10 * 60000).toISOString();
  const { count } = await s.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", u.id).like("game", "jc:%").gte("updated_at", since);
  if ((count ?? 0) >= 5 && u.role !== "admin") return { error: "잠시 후 다시 써주세요 (10분에 5개까지)" };
  const now = new Date().toISOString(), key = `jc:${jk}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await s.from("game_state").insert({ user_id: u.id, game: key, state: { dept: u.dept, text, at: now }, updated_at: now });
  if (error) return { error: "저장에 실패했어요. 잠시 후 다시" };
  const m = await import("./memo"); m.memoDel("jc_counts"); revalidatePath(back.startsWith("/jobs") ? back : "/jobs"); return { ok: true };
}
/** 내 댓글(또는 관리자) 삭제 */
export async function deleteJobComment(key: string, back: string) {
  const u = await getSession(); if (!u || !/^jc:[jx]\d+:[a-z0-9]+$/.test(key)) return;
  let q = db().from("game_state").delete().eq("game", key); if (u.role !== "admin") q = q.eq("user_id", u.id); await q;
  const m = await import("./memo"); m.memoDel("jc_counts"); revalidatePath(back.startsWith("/jobs") ? back : "/jobs");
}
