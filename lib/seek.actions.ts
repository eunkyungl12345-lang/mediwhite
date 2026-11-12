"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { reviewProblem } from "./safety";
import { pushToUsers } from "./push";
import { JOB_REGIONS, JOB_DEPTS } from "./jobs";
import { SEEK_WANT, SEEK_YEARS, seekKey, seekerByKey, offerSenderKey } from "./seek";
type R = { error?: string; ok?: string } | undefined;
const CONTACT = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})|([\w.+-]+@[\w-]+\.[\w.]+)|(카톡|카카오톡|오픈채팅|open\.kakao|인스타|insta|@[a-z0-9_.]{3,})/i;
const one = <T extends readonly string[]>(v: FormDataEntryValue | null, arr: T) => (arr as readonly string[]).includes(String(v ?? "")) ? String(v) : "";
/** 🙋 내 구직 프로필 저장 — 이름·연락처 없이 경력·희망 조건만 */
export async function saveSeek(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" };
  const dept = one(fd.get("dept"), JOB_DEPTS), years = one(fd.get("years"), SEEK_YEARS), region = one(fd.get("region"), JOB_REGIONS), want = one(fd.get("want"), SEEK_WANT);
  const skills = String(fd.get("skills") ?? "").trim().slice(0, 60), intro = String(fd.get("intro") ?? "").trim().slice(0, 200), open = fd.get("open") === "on";
  if (!dept || !years || !region || !want) return { error: "직종·연차·지역·근무형태를 골라주세요" };
  for (const t of [skills, intro]) { if (CONTACT.test(t)) return { error: "익명 프로필이라 연락처·SNS는 쓸 수 없어요. 병원이 제안을 보내면 그때 직접 연락하면 돼요" }; const p = t && reviewProblem(t); if (p) return { error: p }; }
  const now = new Date().toISOString();
  const { error } = await db().from("game_state").upsert({ user_id: u.id, game: "seek", state: { dept, years, region, want, skills, intro, open, at: now }, updated_at: now });
  if (error) return { error: "저장에 실패했어요. 잠시 후 다시" };
  revalidatePath("/jobs/seek"); return { ok: open ? "프로필을 올렸어요! 병원이 제안을 보내면 알림으로 알려드릴게요" : "저장했어요 (지금은 비공개)" };
}
/** 내 프로필 + 받은 제안 모두 삭제 */
export async function deleteSeek() {
  const u = await getSession(); if (!u) return; const s = db();
  await s.from("game_state").delete().eq("user_id", u.id).eq("game", "seek");
  await s.from("game_state").delete().eq("game", `soffer:${seekKey(u.id)}`);
  revalidatePath("/jobs/seek");
}
/** 📨 병원 → 구직자 채용 제안 (구직자 1명당 1건, 하루 10건) */
export async function sendOffer(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" };
  const key = String(fd.get("key") ?? ""), hosp = String(fd.get("hosp") ?? "").trim().slice(0, 40), msg = String(fd.get("msg") ?? "").trim().slice(0, 300), contact = String(fd.get("contact") ?? "").trim().slice(0, 60);
  if (!/^s[0-9a-f]{14}$/.test(key)) return { error: "프로필을 찾을 수 없어요" };
  if (!hosp || !msg || !contact) return { error: "병원명·제안 내용·연락처를 모두 적어주세요" };
  const p = reviewProblem(msg); if (p) return { error: p };
  const t = await seekerByKey(key); if (!t || !t.st.open) return { error: "지금은 제안을 받지 않는 프로필이에요" };
  if (t.uid === u.id) return { error: "내 프로필에는 보낼 수 없어요" };
  const s = db(), since = new Date(Date.now() - 24 * 3600e3).toISOString();
  const { count } = await s.from("game_state").select("user_id", { count: "exact", head: true }).eq("user_id", u.id).like("game", "soffer:%").gte("updated_at", since);
  if ((count ?? 0) >= 10) return { error: "제안은 하루 10건까지 보낼 수 있어요" };
  const now = new Date().toISOString();
  const { error } = await s.from("game_state").upsert({ user_id: u.id, game: `soffer:${key}`, state: { hosp, msg, contact, at: now }, updated_at: now });
  if (error) return { error: "보내지 못했어요. 잠시 후 다시" };
  pushToUsers([t.uid], { title: "📨 채용 제안이 왔어요", body: `${hosp}: "${msg.slice(0, 40)}"`, url: "/jobs/seek#offers", tag: "soffer" }).catch(() => {});
  revalidatePath("/jobs/seek"); return { ok: "제안을 보냈어요! 관심 있으면 구직자가 적어주신 연락처로 직접 연락해요" };
}
/** 받은 제안 지우기 (구직자 본인) */
export async function deleteOffer(senderKey: string) {
  const u = await getSession(); if (!u || !/^[0-9a-f]{12}$/.test(senderKey)) return; const s = db(); const g = `soffer:${seekKey(u.id)}`;
  const { data } = await s.from("game_state").select("user_id").eq("game", g).limit(200);
  const r = (data ?? []).find(x => offerSenderKey(x.user_id) === senderKey); if (r) await s.from("game_state").delete().eq("user_id", r.user_id).eq("game", g);
  revalidatePath("/jobs/seek");
}
