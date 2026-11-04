"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { pushToUsers } from "./push";
import { awardXp } from "./xp";
import { vKey, type VState } from "./hverify";
type R = { error?: string; ok?: string } | undefined;
const okImg = (f: unknown): f is File => f instanceof File && f.size > 0 && f.size <= 6_000_000 && /^image\//.test(f.type);

/** 인증 신청 (병원별 1건, 거절되면 다시 신청 가능) */
export async function requestHVerify(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) redirect("/login"); const s = db();
  const hid = Number(fd.get("hid")) || 0, kind = fd.get("kind") === "exit" ? "exit" : "work", photo = fd.get("photo");
  const { data: h } = await s.from("hospitals").select("id,name").eq("id", hid).maybeSingle(); if (!h) return { error: "병원을 찾을 수 없어요" };
  const { data: prev } = await s.from("game_state").select("state").eq("user_id", u.id).eq("game", vKey(hid)).maybeSingle(); const ps = prev?.state as VState | undefined;
  if (ps?.status === "pending") return { error: "이미 심사 중이에요. 조금만 기다려주세요" };
  if (ps?.status === "approved" && ps.kind === kind) return { error: "이미 인증됐어요" };
  if (!okImg(photo)) return { error: "인증 사진을 올려주세요 (6MB 이하 이미지)" };
  if (fd.get("agree") !== "on") return { error: "안내에 동의해주세요" };
  const path = `hverify/${u.id}/${Date.now()}.jpg`;
  const up = await s.storage.from("badges").upload(path, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type }); if (up.error) return { error: "업로드에 실패했어요. 잠시 후 다시" };
  const st: VState = { kind, status: "pending", path: up.data.path, at: new Date().toISOString() };
  const { error } = await s.from("game_state").upsert({ user_id: u.id, game: vKey(hid), state: st, updated_at: st.at });
  if (error) { await s.storage.from("badges").remove([up.data.path]); return { error: "저장에 실패했어요" }; }
  const { data: admins } = await s.from("users").select("id").eq("role", "admin");
  pushToUsers((admins ?? []).map(x => x.id), { title: kind === "work" ? "✅ 재직 인증 신청" : "✅ 퇴사 인증 신청", body: `${u.nickname}님 · ${h.name}`, url: "/admin#hverify", tag: "hverify" }).catch(() => {});
  revalidatePath(`/hospitals/${hid}`); return { ok: "신청 완료! 운영팀이 확인하면 알림으로 알려드려요 (보통 1~2일). 사진은 확인 후 바로 지워져요." };
}

async function admin() { const u = await getSession(); return u?.role === "admin" ? u : null; }
/** 관리자: 대기 목록 */
export async function hverifyPending() {
  if (!(await admin())) return [];
  const s = db(); const { data } = await s.from("game_state").select("user_id,game,state").like("game", "hverify:%").limit(500);
  const pend = (data ?? []).filter(r => (r.state as VState)?.status === "pending"); if (!pend.length) return [];
  const hids = Array.from(new Set(pend.map(r => Number(r.game.slice(8))))), uids = Array.from(new Set(pend.map(r => r.user_id)));
  const [{ data: hs }, { data: us }] = await Promise.all([s.from("hospitals").select("id,name,region").in("id", hids), s.from("users").select("id,nickname,dept,username").in("id", uids)]);
  return pend.map(r => { const st = r.state as VState, hid = Number(r.game.slice(8)); return { uid: r.user_id, hid, kind: st.kind, at: st.at, hospital: hs?.find(h => h.id === hid) ?? null, user: us?.find(x => x.id === r.user_id) ?? null }; }).sort((a, b) => a.at.localeCompare(b.at));
}
export async function hverifyPhoto(uid: string, hid: number) {
  if (!(await admin())) return ""; const s = db();
  const { data } = await s.from("game_state").select("state").eq("user_id", uid).eq("game", vKey(hid)).maybeSingle(); const p = (data?.state as VState)?.path; if (!p) return "";
  const { data: su } = await s.storage.from("badges").createSignedUrl(p, 600); return su?.signedUrl ?? "";
}
/** 관리자: 승인/거절 → 사진 즉시 삭제, 승인 시 그 병원 리뷰도 인증 처리 */
export async function decideHVerify(uid: string, hid: number, approve: boolean, reason = "") {
  if (!(await admin())) return { error: "권한이 없어요" }; const s = db();
  const { data } = await s.from("game_state").select("state").eq("user_id", uid).eq("game", vKey(hid)).maybeSingle(); const st = data?.state as VState | undefined;
  if (!st || st.status !== "pending") return { error: "이미 처리된 신청이에요" };
  if (st.path) await s.storage.from("badges").remove([st.path]);
  await s.from("game_state").update({ state: { ...st, status: approve ? "approved" : "rejected", path: null, reason: reason.slice(0, 100), decided: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq("user_id", uid).eq("game", vKey(hid));
  const { data: h } = await s.from("hospitals").select("name").eq("id", hid).maybeSingle();
  if (approve) { await s.from("hospital_reviews").update({ verified: true }).eq("user_id", uid).eq("hospital_id", hid); await awardXp(uid, 50, `hverify:${hid}`, "quest"); }
  pushToUsers([uid], approve ? { title: st.kind === "work" ? "✅ 재직 인증 완료!" : "✅ 퇴사 인증 완료!", body: `${h?.name ?? "병원"} 인증이 끝났어요. 내 체크·리뷰·자랑에 ✅ 마크가 붙어요 (+50 XP)`, url: `/hospitals/${hid}`, tag: "hverify" }
    : { title: "병원 인증 심사 결과", body: reason ? `아쉽지만 승인되지 않았어요: ${reason}` : "아쉽지만 승인되지 않았어요. 닉네임 포스트잇이 잘 보이게 다시 찍어주세요", url: `/hospitals/verify?id=${hid}`, tag: "hverify" }).catch(() => {});
  revalidatePath("/admin"); revalidatePath(`/hospitals/${hid}`); return { ok: approve ? "승인했어요" : "거절했어요" };
}
