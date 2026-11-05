"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { pushToUsers } from "./push";
import { JOB_REGIONS } from "./jobs";
import { isGu } from "./district";
type R = { error?: string; ok?: string } | undefined;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
/** 관리자: 집중 지역 설정 */
export async function setFocus(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (u?.role !== "admin") return { error: "권한이 없어요" };
  const region = clean(fd.get("region"), 10);
  if (!region) { await db().from("settings").delete().eq("key", "focus_region"); revalidatePath("/home"); return { ok: "집중 지역을 껐어요" }; }
  if (!(JOB_REGIONS as readonly string[]).includes(region)) return { error: "지역을 골라주세요" };
  await db().from("settings").upsert({ key: "focus_region", value: JSON.stringify({ region, gus: region === "서울" ? fd.getAll("gu").map(String).filter(isGu) : [], label: clean(fd.get("label"), 20), goal: Math.max(10, Number(fd.get("goal")) || 100) }) });
  revalidatePath("/home"); revalidatePath("/hospitals"); return { ok: "저장했어요" };
}
/** 병원 관계자·당사자: 반론·게시중단 요청 (정보통신망법 44조의2 임시조치 요청 창구) */
export async function requestTakedown(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); const hid = Number(fd.get("hid")) || 0;
  const who = clean(fd.get("who"), 40), contact = clean(fd.get("contact"), 80), what = clean(fd.get("what"), 20), detail = clean(fd.get("detail"), 1000);
  if (!hid) return { error: "병원 정보가 없어요" };
  if (!who || !contact) return { error: "소속·직책과 회신받을 연락처를 적어주세요" };
  if (detail.length < 20) return { error: "어떤 내용이 왜 사실과 다르거나 권리를 침해하는지 20자 이상 적어주세요" };
  const { data: h } = await db().from("hospitals").select("name").eq("id", hid).maybeSingle(); if (!h) return { error: "병원을 찾을 수 없어요" };
  await db().from("events").insert({ kind: "takedown", user_id: u?.id ?? null, text: JSON.stringify({ hid, hospital: h.name, who, contact, what, detail, at: new Date().toISOString() }) });
  const { data: admins } = await db().from("users").select("id").eq("role", "admin");
  pushToUsers((admins ?? []).map(a => a.id), { title: "🏥 병원 반론·게시중단 요청", body: `${h.name} · ${who}`, url: "/admin#takedown", tag: "takedown" }).catch(() => {});
  return { ok: "요청이 접수됐어요. 운영팀이 영업일 기준 3일 안에 검토하고, 적어주신 연락처로 결과를 알려드려요. 권리침해가 소명되면 해당 내용은 최대 30일 임시 블라인드돼요." };
}

export async function setPromo(until: string) {
  const u = await getSession(); if (u?.role !== "admin") return; const v = /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : "";
  await db().from("settings").upsert({ key: "open_promo", value: v }); revalidatePath("/admin"); revalidatePath("/home"); revalidatePath("/");
}
export async function setLockMode(mode: string) {
  const u = await getSession(); if (u?.role !== "admin") return; if (!["off", "free3", "on"].includes(mode)) return;
  await db().from("settings").upsert({ key: "lock_mode", value: mode }); revalidatePath("/admin");
}
