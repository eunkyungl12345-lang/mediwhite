"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession, type Session } from "./auth";
import { pushToUsers } from "./push";
import { personMention } from "./safety";
import { awardXp } from "./xp";
import { MEET_KINDS, MEET_AREAS, needsBadge } from "./meetup";

type R = { error?: string; ok?: string } | undefined;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
async function me(): Promise<Session> { const s = await getSession(); if (!s) redirect("/login"); return s; }
const CONTACT = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})|([\w.+-]+@[\w-]+\.[\w.]+)|(카톡|카카오톡|오픈채팅|open\.kakao|인스타|insta|@[a-z0-9_.]{3,})/i;

export async function createMeetup(_: R, fd: FormData): Promise<R> {
  const u = await me(); const s = db();
  const title = clean(fd.get("title"), 40), kind = clean(fd.get("kind"), 10), area = clean(fd.get("area"), 10), place = clean(fd.get("place"), 30), note = clean(fd.get("note"), 200), gender = clean(fd.get("gender"), 2);
  const cap = Math.max(2, Math.min(10, Number(fd.get("cap")) || 4)), when = new Date(String(fd.get("when") ?? ""));
  if (!title) return { error: "제목을 적어주세요" };
  if (!MEET_KINDS.some(k => k.key === kind)) return { error: "종류를 골라주세요" };
  if (needsBadge(kind)) { const { data: me0 } = await s.from("users").select("blue_badge").eq("id", u.id).maybeSingle(); if (!me0?.blue_badge) return { error: "커피챗은 골드뱃지 회원만 열 수 있어요. 번개 탭의 🥇 골드뱃지 인증에서 신청해주세요" }; }
  if (!(MEET_AREAS as readonly string[]).includes(area)) return { error: "지역을 골라주세요" };
  if (isNaN(when.getTime())) return { error: "시간을 골라주세요" };
  if (when.getTime() < Date.now() - 3600000) return { error: "이미 지난 시간이에요" };
  if (when.getTime() > Date.now() + 14 * 86400000) return { error: "번개는 2주 안으로만 잡을 수 있어요" };
  for (const t of [title, place, note]) { if (CONTACT.test(t)) return { error: "연락처·오픈채팅 링크는 적을 수 없어요. 모임 채팅방에서 정하세요" }; const pm = personMention(t); if (pm) return { error: `특정인·병원을 알 수 있는 표현("${pm}")은 뺄게요` }; }
  const { count } = await s.from("meetups").select("id", { count: "exact", head: true }).eq("host_id", u.id).eq("status", "open").gte("when_at", new Date().toISOString());
  if ((count ?? 0) >= 3) return { error: "진행 중인 번개는 3개까지만 열 수 있어요" };
  const { data, error } = await s.from("meetups").insert({ host_id: u.id, title, kind, area, place, when_at: when.toISOString(), cap, gender: ["남", "여"].includes(gender) ? gender : "", note }).select("id").single();
  if (error || !data) return { error: "잠시 후 다시 시도해주세요" };
  await s.from("meetup_members").insert({ meetup_id: data.id, user_id: u.id, status: "joined" });
  await awardXp(u.id, 30, `meetup_host:${data.id}`, "quest");
  revalidatePath("/ssum"); return { ok: "번개를 열었어요! ⚡" };
}
export async function joinMeetup(id: number, msg = "") {
  const u = await me(); const s = db(); const note = msg.trim().slice(0, 100);
  const [{ data: m }, { data: mem }, { data: ug }] = await Promise.all([s.from("meetups").select("id,host_id,cap,gender,status,when_at,title").eq("id", id).maybeSingle(), s.from("meetup_members").select("user_id,status").eq("meetup_id", id), s.from("dating_profiles").select("gender").eq("user_id", u.id).maybeSingle()]);
  if (!m || m.status === "canceled" || Date.parse(m.when_at) < Date.now()) return { error: "마감된 번개예요" };
  const joined = (mem ?? []).filter(x => x.status === "joined");
  if (joined.some(x => x.user_id === u.id)) return { error: "이미 참여 중이에요" };
  if ((mem ?? []).some(x => x.user_id === u.id && x.status === "pending")) return { error: "이미 신청했어요. 모임장 수락을 기다려주세요" };
  if ((mem ?? []).some(x => x.user_id === u.id && x.status === "declined")) return { error: "이 번개는 신청할 수 없어요" };
  if (m.gender && ug?.gender && ug.gender !== m.gender) return { error: `${m.gender}성만 모집하는 번개예요` };
  if (m.gender && !ug?.gender) return { error: `${m.gender}성 한정 번개예요. 셀소 카드에 성별을 등록하면 참여할 수 있어요` };
  if (joined.length >= m.cap) return { error: "정원이 찼어요" };
  if (CONTACT.test(note)) return { error: "연락처는 적을 수 없어요" };
  await s.from("meetup_members").upsert({ meetup_id: id, user_id: u.id, status: "pending", msg: note, joined_at: new Date().toISOString() });
  pushToUsers([m.host_id], { title: "⚡ 번개 참여 신청", body: `${u.nickname}님이 "${m.title}"에 참여를 신청했어요. 수락해 주세요`, url: `/ssum/meet/${id}`, tag: "meet" }).catch(() => {});
  revalidatePath("/ssum"); revalidatePath(`/ssum/meet/${id}`); return { ok: "신청했어요! 모임장이 수락하면 모임 채팅방이 열려요" };
}
export async function answerJoin(id: number, userId: string, accept: boolean) {
  const u = await me(); const s = db();
  const { data: m } = await s.from("meetups").select("host_id,cap,status,title").eq("id", id).maybeSingle();
  if (!m || m.host_id !== u.id) return { error: "모임장만 할 수 있어요" };
  const { data: mem } = await s.from("meetup_members").select("user_id,status").eq("meetup_id", id);
  const joined = (mem ?? []).filter(x => x.status === "joined").length;
  if (accept && joined >= m.cap) return { error: "정원이 찼어요" };
  await s.from("meetup_members").update({ status: accept ? "joined" : "declined", joined_at: new Date().toISOString() }).eq("meetup_id", id).eq("user_id", userId).eq("status", "pending");
  if (accept && joined + 1 >= m.cap) await s.from("meetups").update({ status: "full" }).eq("id", id);
  pushToUsers([userId], accept ? { title: "⚡ 번개 참여 수락!", body: `"${m.title}" 모임장이 수락했어요. 모임 채팅방에서 인사해요`, url: `/ssum/meet/${id}`, tag: "meet" } : { title: "⚡ 번개 신청 결과", body: `"${m.title}" 참여가 어렵게 됐어요. 다른 번개도 둘러보세요`, url: "/ssum?tab=meet", tag: "meet" }).catch(() => {});
  revalidatePath("/ssum"); revalidatePath(`/ssum/meet/${id}`); return { ok: accept ? "수락했어요" : "거절했어요" };
}
export async function leaveMeetup(id: number) {
  const u = await me(); const s = db();
  const { data: m } = await s.from("meetups").select("host_id,status").eq("id", id).maybeSingle(); if (!m) return;
  if (m.host_id === u.id) { await s.from("meetups").update({ status: "canceled" }).eq("id", id); const { data: mem } = await s.from("meetup_members").select("user_id").eq("meetup_id", id).neq("user_id", u.id); pushToUsers((mem ?? []).map(x => x.user_id), { title: "⚡ 번개가 취소됐어요", body: "주최자가 모임을 취소했어요", url: "/ssum?tab=meet", tag: "meet" }).catch(() => {}); }
  else { await s.from("meetup_members").update({ status: "left" }).eq("meetup_id", id).eq("user_id", u.id); if (m.status === "full") await s.from("meetups").update({ status: "open" }).eq("id", id); }
  revalidatePath("/ssum"); revalidatePath(`/ssum/meet/${id}`);
}
export async function sendMeetMsg(id: number, text: string) {
  const u = await me(); const s = db(); const t = text.trim().slice(0, 300); if (!t) return;
  const { data: mem } = await s.from("meetup_members").select("user_id").eq("meetup_id", id).eq("user_id", u.id).eq("status", "joined").maybeSingle(); if (!mem) return;
  await s.from("meetup_msgs").insert({ meetup_id: id, user_id: u.id, text: t });
  const { data: others } = await s.from("meetup_members").select("user_id").eq("meetup_id", id).eq("status", "joined").neq("user_id", u.id);
  pushToUsers((others ?? []).map(x => x.user_id), { title: `⚡ ${u.nickname}`, body: t.slice(0, 60), url: `/ssum/meet/${id}`, tag: `meet${id}` }).catch(() => {});
  revalidatePath(`/ssum/meet/${id}`);
}
