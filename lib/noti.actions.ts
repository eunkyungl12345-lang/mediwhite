"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
export async function notiUnread() {
  const s = await getSession(); if (!s) return 0;
  const { count } = await db().from("notis").select("id", { count: "exact", head: true }).eq("user_id", s.id).eq("read", false);
  return count ?? 0;
}
export async function notiReadAll() {
  const s = await getSession(); if (!s) return;
  await db().from("notis").update({ read: true }).eq("user_id", s.id).eq("read", false);
  revalidatePath("/noti");
}
export async function notiClear() {
  const s = await getSession(); if (!s) return;
  await db().from("notis").delete().eq("user_id", s.id);
  revalidatePath("/noti");
}
