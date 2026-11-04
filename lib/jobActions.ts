"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession, type Session } from "./auth";
import { personMention } from "./safety";
import { awardXp } from "./xp";
import { JOB_REGIONS, JOB_DEPTS, EMP_TYPES, HOSP_KINDS, RATING_KEYS } from "./jobs";
import { pushToUsers } from "./push";
import { JOB_TAGS, SHARE_TAG, joinTags } from "./jobTags";
import { VOICE_OPTS } from "./jobVoice";
const okImg = (f: unknown): f is File => f instanceof File && f.size > 0 && f.size <= 6_000_000 && /^image\//.test(f.type);

type R = { error?: string; ok?: string } | undefined;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
async function me(): Promise<Session> { const s = await getSession(); if (!s) redirect("/login"); return s; }
const inList = (list: readonly string[], v: string) => list.includes(v);

/* ---------- 채용공고 ---------- */
export async function createJob(_: R, fd: FormData): Promise<R> {
  const u = await me(); const s = db();
  const hospital = clean(fd.get("hospital"), 40), region = clean(fd.get("region"), 10), dept = clean(fd.get("dept"), 10), emp = clean(fd.get("emp_type"), 10);
  const pay = clean(fd.get("pay"), 60), hours = clean(fd.get("hours"), 60), welfare = clean(fd.get("welfare"), 200), contact = clean(fd.get("contact"), 300), body = clean(fd.get("body"), 2000), deadline = clean(fd.get("deadline"), 10);
  if (!hospital) return { error: "병원명을 적어주세요" };
  if (!inList(JOB_REGIONS, region)) return { error: "지역을 골라주세요" };
  if (!inList(JOB_DEPTS, dept)) return { error: "모집 직종을 골라주세요" };
  if (!inList(EMP_TYPES, emp)) return { error: "고용 형태를 골라주세요" };
  if (body.length < 20) return { error: "업무 내용·자격 요건을 20자 이상 적어주세요" };
  if (deadline && isNaN(Date.parse(deadline))) return { error: "마감일 형식이 이상해요" };
  const { count } = await s.from("jobs").select("id", { count: "exact", head: true }).eq("author_id", u.id).gte("created_at", new Date(Date.now() - 86400000).toISOString());
  if ((count ?? 0) >= 5) return { error: "채용공고는 하루 5개까지만 올릴 수 있어요" };
  const tags = fd.getAll("tag").map(String).filter(t => JOB_TAGS.some(x => x.id === t)).slice(0, 8);
  const shared = fd.get("who") === "share"; if (shared) tags.unshift(SHARE_TAG);
  const { data, error } = await s.from("jobs").insert({ author_id: u.id, hospital, region, dept, emp_type: emp, pay: pay || null, hours: hours || null, welfare: welfare || null, deadline: deadline || null, contact: contact || null, body: joinTags(tags, body) }).select("id").single();
  if (error || !data) return { error: "잠시 후 다시 시도해주세요" };
  await awardXp(u.id, shared ? 30 : 20, `job:${data.id}`, "quest");
  revalidatePath("/jobs"); redirect(`/jobs/${data.id}`);
}
export async function closeJob(id: number) {
  const u = await me(); const s = db();
  const { data: j } = await s.from("jobs").select("author_id,closed").eq("id", id).maybeSingle(); if (!j) return;
  if (j.author_id !== u.id && u.role !== "admin") return;
  await s.from("jobs").update({ closed: !j.closed }).eq("id", id);
  revalidatePath("/jobs"); revalidatePath(`/jobs/${id}`);
}
export async function deleteJob(id: number) {
  const u = await me(); const s = db();
  const { data: j } = await s.from("jobs").select("author_id").eq("id", id).maybeSingle(); if (!j) return;
  if (j.author_id !== u.id && u.role !== "admin") return;
  await s.from("jobs").delete().eq("id", id);
  revalidatePath("/jobs"); redirect("/jobs");
}

/* ---------- 병원 리뷰 ---------- */
export async function createReview(_: R, fd: FormData): Promise<R> {
  const u = await me(); const s = db();
  let hospitalId = Number(fd.get("hospital_id")) || 0;
  const name = clean(fd.get("name"), 40), region = clean(fd.get("region"), 10), kind = clean(fd.get("kind"), 10);
  const dept = clean(fd.get("dept"), 10), status = clean(fd.get("status"), 4), pros = clean(fd.get("pros"), 600), cons = clean(fd.get("cons"), 600), tip = clean(fd.get("tip"), 300);
  const r: Record<string, number> = {};
  for (const k of RATING_KEYS) { const v = Number(fd.get(k.key)); if (!(v >= 1 && v <= 5)) return { error: `${k.name} 별점을 골라주세요` }; r[k.key] = v; }
  if (!inList(JOB_DEPTS, dept)) return { error: "직종을 골라주세요" };
  if (!["재직", "퇴사"].includes(status)) return { error: "재직/퇴사를 골라주세요" };
  if (pros.length < 15 || cons.length < 15) return { error: "장점·단점을 각각 15자 이상 적어주세요 (다른 분들에게 진짜 도움이 되게!)" };
  for (const t of [pros, cons, tip]) { const pm = personMention(t); if (pm) return { error: `특정인을 알 수 있는 표현("${pm}")은 뺄게요. 사람이 아니라 병원에 대한 후기만!` }; }
  if (!hospitalId) {
    if (!name || !inList(JOB_REGIONS, region)) return { error: "병원명과 지역을 적어주세요" };
    if (!inList(HOSP_KINDS, kind)) return { error: "병원 종류를 골라주세요" };
    const { data: ex } = await s.from("hospitals").select("id").eq("name", name).eq("region", region).maybeSingle();
    if (ex) hospitalId = ex.id; else { const { data: h, error } = await s.from("hospitals").insert({ name, region, kind, created_by: u.id }).select("id").single(); if (error || !h) return { error: "병원 등록에 실패했어요" }; hospitalId = h.id; }
  }
  const proof = fd.get("proof");
  if (proof instanceof File && proof.size > 0 && !okImg(proof)) return { error: "재직 인증 서류는 jpg/png 4MB 이하로 올려주세요" };
  const { data: rv, error } = await s.from("hospital_reviews").upsert({ hospital_id: hospitalId, user_id: u.id, dept, status, ...r, pros, cons, tip: tip || null, hidden: false, hidden_at: null }, { onConflict: "hospital_id,user_id" }).select("id,verified").single();
  if (error || !rv) return { error: "저장에 실패했어요. 잠시 후 다시" };
  if (okImg(proof) && !rv.verified) {
    const { data: open } = await s.from("review_proofs").select("id").eq("review_id", rv.id).eq("status", "pending").maybeSingle();
    if (!open) {
      const key = `proof/${u.id}/${Date.now()}.${(proof.type.split("/")[1] || "jpg").replace("jpeg", "jpg")}`;
      const up = await s.storage.from("badges").upload(key, Buffer.from(await proof.arrayBuffer()), { contentType: proof.type });
      if (!up.error) {
        await s.from("review_proofs").insert({ review_id: rv.id, user_id: u.id, hospital_id: hospitalId, path: up.data.path });
        const { data: admins } = await s.from("users").select("id").eq("role", "admin");
        pushToUsers((admins ?? []).map(x => x.id), { title: "✅ 리뷰 재직 인증 신청", body: `${u.nickname}님이 병원 리뷰 재직 인증을 신청했어요`, url: "/admin#proofs", tag: "proof" }).catch(() => {});
      }
    }
  }
  await awardXp(u.id, 40, `review:${hospitalId}`, "quest");
  revalidatePath("/hospitals"); revalidatePath(`/hospitals/${hospitalId}`); redirect(`/hospitals/${hospitalId}`);
}
export async function deleteReview(id: number) {
  const u = await me(); const s = db();
  const { data: r } = await s.from("hospital_reviews").select("user_id,hospital_id").eq("id", id).maybeSingle(); if (!r) return;
  if (r.user_id !== u.id && u.role !== "admin") return;
  await s.from("hospital_reviews").delete().eq("id", id);
  revalidatePath("/hospitals"); revalidatePath(`/hospitals/${r.hospital_id}`);
}
export async function searchHospitals(q: string) {
  await me(); const t = q.trim(); if (t.length < 1) return [];
  const { data } = await db().from("hospitals").select("id,name,region,kind").ilike("name", `%${t}%`).limit(8);
  return data ?? [];
}

/** 관리자: 공공 채용 지금 가져오기 */
export async function runJobImport() {
  const { getSession } = await import("./auth"); const s = await getSession(); if (!s || s.role !== "admin") return { ok: false, fetched: 0, hospitals: 0, added: 0, error: "관리자만" };
  const { importPublicJobs } = await import("./jobImport"); const r = await importPublicJobs(); const { revalidatePath } = await import("next/cache"); revalidatePath("/jobs"); return r;
}

/* ---------- 🗣️ 의료직 구직 불편 설문 (메디잡·사람인 써보니) ---------- */
export async function submitJobVoice(_: R, fd: FormData): Promise<R> {
  const u = await me(); const s = db();
  const picks = fd.getAll("v").map(String).filter(v => VOICE_OPTS.some(o => o.id === v)).slice(0, 7), free = clean(fd.get("free"), 300).replace(/\|/g, "/");
  if (!picks.length && free.length < 4) return { error: "하나 이상 골라주거나 한 줄 적어주세요" };
  const { data: ex } = await s.from("events").select("id").eq("kind", "jobvoice").eq("user_id", u.id).limit(1).maybeSingle();
  if (ex) await s.from("events").update({ text: `${picks.join(",")}|${free}|${u.dept}` }).eq("id", ex.id);
  else { await s.from("events").insert({ kind: "jobvoice", user_id: u.id, text: `${picks.join(",")}|${free}|${u.dept}` }); await awardXp(u.id, 10, "jobvoice", "quest"); }
  revalidatePath("/jobs"); return { ok: "고마워요! 이 의견대로 채용 게시판을 고쳐갈게요 🙏" };
}
