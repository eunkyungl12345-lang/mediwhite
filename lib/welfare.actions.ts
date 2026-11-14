"use server";
import { pledgeGate } from "./pledge";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { awardXp } from "./xp";
import { personMention } from "./safety";
import { textProblem } from "./textQuality";
import { WEL_CATS, welKey } from "./welfare";
type R = { error?: string } | undefined;
const ALL = WEL_CATS.flatMap(c => c.items as readonly string[]);
export async function submitWelfare(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) redirect("/login"); const s = db();
  { const pg = await pledgeGate(u.id, fd, false); if (pg) return { error: pg }; }
  const hid = Number(fd.get("hid")) || 0; const { data: h } = await s.from("hospitals").select("id").eq("id", hid).maybeSingle(); if (!h) return { error: "병원을 찾을 수 없어요" };
  let raw: Record<string, number> = {}; try { raw = JSON.parse(String(fd.get("items") ?? "{}")); } catch {}
  const items: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw).slice(0, 40)) {
    const n = Math.round(Number(v)); if (!(n >= 1 && n <= 5)) continue;
    if (ALL.includes(k)) items[k] = n;
    else if (k.startsWith("+")) { const name = k.slice(1).replace(/\s+/g, " ").trim().slice(0, 20); if (name.length >= 2 && !personMention(name)) items["+" + name] = n; }
  }
  if (!Object.keys(items).length) return { error: "써본 복지를 하나 이상 고르고 별점을 매겨주세요" };
  const text = String(fd.get("text") ?? "").trim().slice(0, 1000);
  const tq = textProblem(text, 20); if (tq) return { error: `사용 경험: ${tq}` };
  const pm = personMention(text); if (pm) return { error: `특정인을 알 수 있는 표현("${pm}")은 빼주세요` };
  const status = fd.get("status") === "퇴사" ? "퇴사" : "재직";
  const { data: prev } = await s.from("game_state").select("user_id").eq("user_id", u.id).eq("game", welKey(hid)).maybeSingle();
  const { error } = await s.from("game_state").upsert({ user_id: u.id, game: welKey(hid), state: { items, text, dept: u.dept, status, at: new Date().toISOString() }, updated_at: new Date().toISOString() });
  if (error) return { error: "저장에 실패했어요" };
  if (!prev) await awardXp(u.id, 30, `hwel:${hid}`, "quest");
  revalidatePath(`/hospitals/${hid}`); redirect(`/hospitals/${hid}?t=welfare&done=1`);
}
