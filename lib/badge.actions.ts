"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { pushToUsers } from "./push";

type R = { error?: string; ok?: string } | undefined;
const MAX = 6_000_000;
const tooBig = (f: unknown) => f instanceof File && f.size > MAX;
const okImg = (f: unknown): f is File => f instanceof File && f.size > 0 && f.size <= MAX && /^image\//.test(f.type);
const ext = (f: File) => (f.type.split("/")[1] || "jpg").replace("jpeg", "jpg");

/** 골드뱃지 신청: 운전면허증 + 의료 면허·자격증 사진 2장 (비공개 버킷, 심사 후 즉시 삭제) */
export async function requestBadge(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) redirect("/login");
  const s = db();
  const { data: me } = await s.from("users").select("blue_badge").eq("id", u.id).maybeSingle();
  if (me?.blue_badge) return { error: "이미 골드뱃지 회원이에요" };
  const { data: open } = await s.from("badge_requests").select("id").eq("user_id", u.id).eq("status", "pending").maybeSingle();
  if (open) return { error: "이미 심사 중이에요. 운영팀 확인을 기다려주세요" };
  const idf = fd.get("idcard"), lic = fd.get("license"), note = String(fd.get("note") ?? "").trim().slice(0, 100);
  if (!okImg(idf)) return { error: `운전면허증 사진을 올려주세요${tooBig(idf) ? " (사진이 너무 커요 — 스크린샷으로 올려보세요)" : ""}` };
  if (!okImg(lic)) return { error: `면허·자격증 사진을 올려주세요${tooBig(lic) ? " (사진이 너무 커요 — 스크린샷으로 올려보세요)" : ""}` };
  if (fd.get("agree") !== "on") return { error: "개인정보 처리 안내에 동의해주세요" };
  const st = s.storage.from("badges"), key = `${u.id}/${Date.now()}`;
  const [a, b] = await Promise.all([
    st.upload(`${key}_id.${ext(idf)}`, Buffer.from(await idf.arrayBuffer()), { contentType: idf.type }),
    st.upload(`${key}_lic.${ext(lic)}`, Buffer.from(await lic.arrayBuffer()), { contentType: lic.type }),
  ]);
  if (a.error || b.error) return { error: "업로드에 실패했어요. 잠시 후 다시 시도해주세요" };
  await s.from("badge_requests").insert({ user_id: u.id, id_path: a.data.path, lic_path: b.data.path, note });
  const { data: admins } = await s.from("users").select("id").eq("role", "admin");
  pushToUsers((admins ?? []).map(x => x.id), { title: "🥇 골드뱃지 신청", body: `${u.nickname}님이 인증을 신청했어요`, url: "/admin#badges", tag: "badge" }).catch(() => {});
  revalidatePath("/badge"); return { ok: "신청 완료! 운영팀이 확인하면 알려드릴게요 (보통 1~2일)" };
}

/** 운영팀 심사: 승인/거절 후 서류 사진은 즉시 삭제 */
export async function decideBadge(id: number, approve: boolean, reason = "") {
  const u = await getSession(); if (!u || u.role !== "admin") return { error: "권한이 없어요" };
  const s = db();
  const { data: r } = await s.from("badge_requests").select("id,user_id,id_path,lic_path,status").eq("id", id).maybeSingle();
  if (!r || r.status !== "pending") return { error: "이미 처리된 신청이에요" };
  await s.from("badge_requests").update({ status: approve ? "approved" : "rejected", reason: reason.slice(0, 100), decided_at: new Date().toISOString(), id_path: null, lic_path: null }).eq("id", id);
  if (approve) await s.from("users").update({ blue_badge: true }).eq("id", r.user_id);
  await s.storage.from("badges").remove([r.id_path, r.lic_path].filter(Boolean) as string[]);
  pushToUsers([r.user_id], approve ? { title: "🥇 골드뱃지 승인!", body: "인증이 완료됐어요. 이제 커피챗 번개를 열 수 있어요 ☕", url: "/ssum?tab=meet", tag: "badge" } : { title: "골드뱃지 심사 결과", body: reason ? `아쉽지만 이번엔 승인되지 않았어요: ${reason}` : "아쉽지만 이번엔 승인되지 않았어요. 사진을 다시 확인하고 재신청해주세요", url: "/badge", tag: "badge" }).catch(() => {});
  revalidatePath("/admin"); revalidatePath("/badge"); return { ok: approve ? "승인했어요" : "거절했어요" };
}

/** 운영팀 화면용 임시 보기 링크(10분) */
export async function badgeSignedUrls(paths: string[]) {
  const u = await getSession(); if (!u || u.role !== "admin") return [];
  const { data } = await db().storage.from("badges").createSignedUrls(paths, 600);
  return (data ?? []).map(x => x.signedUrl ?? "");
}

/** 리뷰 재직 인증 심사: 승인 시 리뷰에 ✅ 표시, 서류는 즉시 삭제 */
export async function decideProof(id: number, approve: boolean, reason = "") {
  const u = await getSession(); if (!u || u.role !== "admin") return { error: "권한이 없어요" };
  const s = db();
  const { data: r } = await s.from("review_proofs").select("id,review_id,user_id,hospital_id,path,status,hospital:hospitals(name)").eq("id", id).maybeSingle();
  if (!r || r.status !== "pending") return { error: "이미 처리된 신청이에요" };
  await s.from("review_proofs").update({ status: approve ? "approved" : "rejected", reason: reason.slice(0, 100), decided_at: new Date().toISOString(), path: null }).eq("id", id);
  if (approve) await s.from("hospital_reviews").update({ verified: true }).eq("id", r.review_id);
  if (r.path) await s.storage.from("badges").remove([r.path]);
  const hn = (r as any).hospital?.name ?? "병원";
  pushToUsers([r.user_id], approve ? { title: "✅ 재직 인증 완료", body: `${hn} 리뷰에 재직 인증 마크가 붙었어요`, url: `/hospitals/${r.hospital_id}`, tag: "proof" } : { title: "재직 인증 결과", body: reason ? `${hn} 리뷰 인증이 승인되지 않았어요: ${reason}` : `${hn} 리뷰 인증이 승인되지 않았어요. 서류를 확인하고 다시 올려주세요`, url: `/hospitals/${r.hospital_id}`, tag: "proof" }).catch(() => {});
  revalidatePath("/admin"); revalidatePath(`/hospitals/${r.hospital_id}`); return { ok: approve ? "승인했어요" : "거절했어요" };
}
