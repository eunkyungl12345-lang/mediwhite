"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { saveDistrict } from "./districtDb";
import { getSession, type Session } from "./auth";
import { reviewProblem } from "./safety";
import { awardXp } from "./xp";
import { JOB_REGIONS, JOB_DEPTS, EMP_TYPES, HOSP_KINDS, RATING_KEYS } from "./jobs";
import { pushToUsers } from "./push";
import { JOB_TAGS, SHARE_TAG, joinTags, META, joinMeta } from "./jobTags";
import { VOICE_OPTS } from "./jobVoice";
import { PAY, YEARS, MOOD, RISKS, EXIT_STARS, EXIT_REASONS, factKey } from "./hospFacts";
import { textProblem } from "./textQuality";
const okImg = (f: unknown): f is File => f instanceof File && f.size > 0 && f.size <= 6_000_000 && /^image\/(jpeg|png|webp|heic|heif|gif)$/.test(f.type);

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
  if (!body.trim()) return { error: "업무 내용을 적어주세요" };
  if (deadline && isNaN(Date.parse(deadline))) return { error: "마감일 형식이 이상해요" };
  
  const tags = fd.getAll("tag").map(String).filter(t => JOB_TAGS.some(x => x.id === t)).slice(0, 8);
  const shared = fd.get("who") === "share"; if (shared) tags.unshift(SHARE_TAG);
  const meta: Record<string, string> = {}; for (const m of META) { const v = String(fd.get("m_" + m.k) ?? "").replace(/\s+/g, " ").trim().slice(0, 60); if (v) meta[m.k] = v; }
  const { data, error } = await s.from("jobs").insert({ author_id: u.id, hospital, region, dept, emp_type: emp, pay: pay || null, hours: hours || null, welfare: welfare || null, deadline: deadline || null, contact: contact || null, body: joinTags(tags, joinMeta(meta, body)) }).select("id").single();
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
  if (!pros.trim() && !cons.trim()) return { error: "장점이나 단점을 적어주세요" };
  for (const t of [pros, cons, tip]) { const rp = reviewProblem(t); if (rp) return { error: rp }; }
  if (!hospitalId) {
    if (!name || !inList(JOB_REGIONS, region)) return { error: "병원명과 지역을 적어주세요" };
    if (!inList(HOSP_KINDS, kind)) return { error: "병원 종류를 골라주세요" };
    const { data: ex } = await s.from("hospitals").select("id").eq("name", name).eq("region", region).maybeSingle();
    if (ex) hospitalId = ex.id; else { const { data: h, error } = await s.from("hospitals").insert({ name, region, kind, created_by: u.id }).select("id").single(); if (error || !h) return { error: "병원 등록에 실패했어요" }; hospitalId = h.id; await saveDistrict(h.id, region, String(fd.get("gu") ?? "")); }
  }
  const proof = fd.get("proof");
  if (proof instanceof File && proof.size > 0 && !okImg(proof)) return { error: "재직 인증 서류는 jpg/png 6MB 이하로 올려주세요" };
  const { data: old } = await s.from("hospital_reviews").select("id,hidden").eq("hospital_id", hospitalId).eq("user_id", u.id).maybeSingle();
  if (old?.hidden) return { error: "신고가 들어와 운영팀이 검토 중인 리뷰예요. 검토가 끝날 때까지는 수정할 수 없어요 (최대 30일)" };
  const { data: rv, error } = await s.from("hospital_reviews").upsert({ hospital_id: hospitalId, user_id: u.id, dept, status, ...r, pros, cons, tip: tip || null }, { onConflict: "hospital_id,user_id" }).select("id,verified").single();
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

/* ---------- 🔎 병원 실체 체크 (실수령·분위기·치명적 리스크, 익명·탭만) ---------- */
export async function submitHospFact(_: R, fd: FormData): Promise<R> {
  const u = await me(); const s = db();
  let hid = Number(fd.get("hospital_id")) || 0; const name = clean(fd.get("name"), 40), region = clean(fd.get("region"), 10), kind = clean(fd.get("kind"), 10);
  if (!hid) {
    if (!name || !inList(JOB_REGIONS, region) || !inList(HOSP_KINDS, kind)) return { error: "병원을 찾거나, 새 병원 이름·지역·종류를 골라주세요" };
    const { data: ex } = await s.from("hospitals").select("id").eq("name", name).eq("region", region).maybeSingle();
    if (ex) hid = ex.id; else { const { data: h, error } = await s.from("hospitals").insert({ name, region, kind, created_by: u.id }).select("id").single(); if (error || !h) return { error: "병원 등록에 실패했어요" }; hid = h.id; await saveDistrict(h.id, region, String(fd.get("gu") ?? "")); }
  }
  const pay = clean(fd.get("pay"), 12), years = clean(fd.get("years"), 12), status = clean(fd.get("status"), 4), dept = clean(fd.get("dept"), 10);
  if (!inList(PAY, pay)) return { error: "실수령 월급 구간을 골라주세요 (대략이면 돼요)" };
  if (!inList(YEARS, years)) return { error: "연차를 골라주세요" };
  if (!["재직", "퇴사"].includes(status)) return { error: "재직/퇴사를 골라주세요" };
  if (!inList(JOB_DEPTS, dept)) return { error: "직종을 골라주세요" };
  // 빠른 체크: 실제 퇴근(late)만 필수, 나머지 분위기·현장 항목은 '더 알려주기'에서 (답한 것만 저장)
  const mood: Record<string, number> = {}; for (const m of MOOD) { const raw = fd.get(m.k); if (raw === null || raw === "") { if (m.k === "late") return { error: `'${m.q}'를 골라주세요` }; continue; } const v = Number(raw); if (Number.isInteger(v) && v >= 0 && v < m.opts.length) mood[m.k] = v; }
  const rpRaw = String(fd.get("regular_pct") ?? "").trim(), rpN = Math.round(Number(rpRaw)); if (rpRaw !== "" && !(Number.isFinite(rpN) && rpN >= 0 && rpN <= 100)) return { error: "정규직 전환율은 0~100 사이 숫자로 적어주세요" };
  const regularPct = rpRaw === "" ? undefined : rpN;
  const risks = fd.getAll("risk").map(String).filter(r => RISKS.some(x => x.k === r)); const good = fd.get("good") === "1" && !risks.length;
  let exit: Record<string, any> = {};
  const stars: Record<string, number> = {}; for (const st of EXIT_STARS) { const v = Number(fd.get("st_" + st.k)); if (v >= 1 && v <= 5) stars[st.k] = v; }
  const shift = Number(fd.get("shift")); if (![0, 1, 2].includes(shift) || fd.get("shift") === null) return { error: "근무 형태를 골라주세요" };
  const overall = Number(fd.get("st_overall")); if (!(overall >= 1 && overall <= 5)) return { error: "총평점을 매겨주세요" };
  const rec = Number(fd.get("rec")), future = Number(fd.get("future")); if (![0, 1].includes(rec) || fd.get("rec") === null) return { error: "추천 여부를 골라주세요" }; 
  const pros = clean(fd.get("pros"), 1000), cons = clean(fd.get("cons"), 1000), emp = clean(fd.get("emp"), 10);
  for (const [v, n] of [[pros, "장점"], [cons, "단점"]] as const) if (v) { const tp = textProblem(v, 20); if (tp) return { error: `${n}: ${tp}` }; const rp = reviewProblem(v); if (rp) return { error: `${n}: ${rp}` }; }
  const word = clean(fd.get("last"), 100); if (word) { const tp = textProblem(word, 10); if (tp) return { error: `한줄평: ${tp}` }; const rp = reviewProblem(word); if (rp) return { error: `한줄평: ${rp}` }; }
  if (status === "퇴사") {
    const reasons = fd.getAll("reason").map(String).filter(r => inList(EXIT_REASONS, r)); if (!reasons.length && fd.get("more") === "1") return { error: "퇴사 사유를 하나 이상 골라주세요" };
    exit = { reasons };
  }
  const key = factKey(hid); const { data: prev } = await s.from("game_state").select("user_id").eq("user_id", u.id).eq("game", key).maybeSingle();
  const { error } = await s.from("game_state").upsert({ user_id: u.id, game: key, state: { pay, years, status, dept, shift, regularPct, emp: emp || undefined, pros: pros || undefined, cons: cons || undefined, ...mood, stars: Object.keys(stars).length ? stars : undefined, overall, rec, future: [0, 1, 2].includes(future) && fd.get("future") !== null && fd.get("future") !== "" ? future : undefined, risks, good, ...exit, last: word || undefined, at: new Date().toISOString() }, updated_at: new Date().toISOString() });
  if (error) return { error: "저장에 실패했어요. 잠시 후 다시" };
  if (!prev) await awardXp(u.id, 50, `hfact:${hid}`, "quest");
  if (pros && cons) await awardXp(u.id, 20, `hfactpc:${hid}`, "quest");
  if (Object.keys(mood).length >= MOOD.length - 1 && Object.keys(stars).length) await awardXp(u.id, 20, `hfactmore:${hid}`, "quest");
  (await import("./memo")).memoDel("facts_"); (await import("./memo")).memoDel("hosp_feed");
  revalidatePath(`/hospitals/${hid}`); revalidatePath("/jobs"); redirect(`/hospitals/${hid}?checked=1`);
}
