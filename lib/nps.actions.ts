"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { npsSearch, npsFetch, saveNps } from "./nps";
async function admin() { const s = await getSession(); return s?.role === "admin"; }
/** 관리자: 병원에 맞는 국민연금 사업장 후보 찾기 */
export async function npsCandidates(hid: number, q?: string) {
  if (!(await admin())) return { error: "관리자만" };
  const { data: h } = await db().from("hospitals").select("name,region").eq("id", hid).maybeSingle(); if (!h) return { error: "병원 없음" };
  const { data: g } = await db().from("settings").select("value").eq("key", `hdist:${hid}`).maybeSingle();
  try { return { list: (await npsSearch(q?.trim() || h.name, h.region, g?.value)).slice(0, 15) }; } catch (e: any) { return { error: String(e?.message ?? e).slice(0, 300) }; }
}
/** 관리자: 후보 하나 골라 연결 (상세·입퇴사 가져와 저장) */
export async function npsLink(hid: number, seq: string, name: string, addr: string) {
  if (!(await admin())) return { error: "관리자만" };
  try { const info = await npsFetch(seq, name, addr); await saveNps(hid, info); revalidatePath(`/hospitals/${hid}`); return { ok: `${info.name} · ${info.cnt}명 연결했어요` }; } catch (e: any) { return { error: String(e?.message ?? e).slice(0, 300) }; }
}
export async function npsUnlink(hid: number) { if (!(await admin())) return; await db().from("settings").delete().eq("key", `nps:${hid}`); await db().from("settings").upsert({ key: `npstry:${hid}`, value: "관리자가 해제" }); revalidatePath(`/hospitals/${hid}`); }
