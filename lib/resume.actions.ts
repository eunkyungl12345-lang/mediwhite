"use server";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { reviewProblem } from "./safety";
import { pushToUsers } from "./push";
import { JOB_DEPTS, JOB_REGIONS } from "./jobs";
import { SEEK_WANT, SEEK_YEARS } from "./seek";
import { splitTags, SHARE_TAG } from "./jobTags";
import { deptLabel } from "./depts";
import { RESUME_GAME, APPLY_GAME, appKey, isStatus, loadResume, statusOf, type Resume } from "./resume";

type R = { error?: string; ok?: string } | undefined;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
const one = <T extends readonly string[]>(v: FormDataEntryValue | null, arr: T) => (arr as readonly string[]).includes(String(v ?? "")) ? String(v) : "";
const CONTACT = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})|(0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4})|([\w.+-]+@[\w-]+\.[\w.]+)|(카톡|카카오톡|오픈채팅|open\.kakao|인스타|insta)/i;
const touch = (id?: number) => { revalidatePath("/jobs/resume"); revalidatePath("/my"); if (id) revalidatePath(`/jobs/${id}`); };

/** 📄 내 이력서 저장(수정) — 간편 지원에 쓰는 이름·연락처·경력 요약 */
export async function saveResume(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" };
  const name = clean(fd.get("name"), 30), contact = clean(fd.get("contact"), 60);
  const dept = one(fd.get("dept"), JOB_DEPTS), years = one(fd.get("years"), SEEK_YEARS), want = one(fd.get("want"), SEEK_WANT), region = one(fd.get("region"), JOB_REGIONS);
  const skills = clean(fd.get("skills"), 100), career = clean(fd.get("career"), 800);
  if (name.length < 1) return { error: "이름을 적어주세요" };
  if (!CONTACT.test(contact)) return { error: "연락처는 전화번호나 이메일로 적어주세요 (예: 010-1234-5678)" };
  if (!dept || !years || !want || !region) return { error: "직종·경력·근무형태·지역을 골라주세요" };
  if (fd.get("agree") !== "on") return { error: "이력서 정보를 지원한 병원에 전달하는 데 동의해 주세요" };
  for (const t of [skills, career]) { if (!t) continue; const p = reviewProblem(t); if (p) return { error: p }; }
  const now = new Date().toISOString();
  const state: Resume = { name, contact, dept, years, want, region, skills, career, at: now };
  const { error } = await db().from("game_state").upsert({ user_id: u.id, game: RESUME_GAME, state, updated_at: now });
  if (error) return { error: "저장에 실패했어요. 잠시 후 다시" };
  touch();
  return { ok: "이력서를 저장했어요! 이제 공고에서 버튼 한 번으로 지원할 수 있어요" };
}

/** 🗑️ 내 이력서 삭제 (이미 보낸 지원서는 그대로 남아요) */
export async function deleteResume() {
  const u = await getSession(); if (!u) return;
  await db().from("game_state").delete().eq("user_id", u.id).eq("game", RESUME_GAME);
  touch();
}

/** 🚀 내 이력서로 바로 지원 */
export async function applyWithResume(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" };
  const id = Number(fd.get("jobId")); if (!Number.isInteger(id) || id <= 0) return { error: "공고를 찾을 수 없어요" };
  const s = db();
  const { data: j } = await s.from("jobs").select("id,body,closed,hidden,author_id,region,hospital,dept,author:users!jobs_author_id_fkey(username)").eq("id", id).maybeSingle();
  if (!j || j.hidden) return { error: "공고를 찾을 수 없어요" };
  if (j.closed) return { error: "마감된 공고에는 지원할 수 없어요" };
  if ((j.author as any)?.username === "mw_bot") return { error: "공공기관 공고는 원문 공고에서 지원해 주세요" };
  if (splitTags(j.body).tags.includes(SHARE_TAG)) return { error: "제보받은 공고는 안내된 방법이나 원문으로 지원해 주세요" };
  if (j.author_id === u.id) return { error: "내가 올린 공고에는 지원할 수 없어요" };
  const r = await loadResume(u.id); if (!r) return { error: "이력서를 먼저 만들어 주세요" };
  const m = clean(fd.get("msg"), 200); if (m) { const p = reviewProblem(m); if (p) return { error: p }; }
  const { data: had } = await s.from("game_state").select("user_id").eq("user_id", u.id).eq("game", APPLY_GAME(id)).maybeSingle();
  if (had) return { error: "이미 지원한 공고예요" };
  const now = new Date().toISOString();
  const { error } = await s.from("game_state").insert({
    user_id: u.id, game: APPLY_GAME(id), updated_at: now,
    state: { name: r.name, contact: r.contact, dept: r.dept, years: r.years, region: r.region, want: r.want, skills: r.skills, career: r.career, msg: m, status: "new", at: now },
  });
  if (error) return { error: "지원에 실패했어요. 잠시 후 다시" };
  pushToUsers([j.author_id], { title: "📩 새 지원서가 왔어요", body: `${j.hospital} ${deptLabel(j.dept)} 공고 — ${r.name}님(${r.years})이 지원했어요`, url: `/jobs/${id}`, tag: "japply" }).catch(() => {});
  touch(id);
  return { ok: "지원 완료! 이력서가 공고 작성자에게 전달됐어요" };
}

/** ↩️ 지원 취소 — 내 지원서를 지워요 (작성자 목록에서도 사라져요) */
export async function cancelApply(jobId: number) {
  const u = await getSession(); if (!u) return;
  const id = Number(jobId); if (!Number.isInteger(id) || id <= 0) return;
  await db().from("game_state").delete().eq("user_id", u.id).eq("game", APPLY_GAME(id));
  revalidatePath(`/jobs/${id}`); revalidatePath("/jobs/resume"); revalidatePath("/my");
}

/** 📩 공고 작성자·관리자: 지원자 상태 바꾸기 (검토 중 / 면접 제안 / 다음 기회에) */
export async function setAppStatus(jobId: number, key: string, status: string): Promise<R> {
  const u = await getSession(); if (!u) return { error: "로그인이 필요해요" };
  const id = Number(jobId); if (!Number.isInteger(id) || id <= 0) return { error: "공고를 찾을 수 없어요" };
  if (!/^a[0-9a-f]{15}$/.test(key) || !isStatus(status) || status === "new") return { error: "바꿀 수 없는 상태예요" };
  const s = db();
  const { data: j } = await s.from("jobs").select("author_id,hospital").eq("id", id).maybeSingle();
  if (!j) return { error: "공고를 찾을 수 없어요" };
  if (j.author_id !== u.id && u.role !== "admin") return { error: "이 공고의 작성자만 바꿀 수 있어요" };
  const { data: rows } = await s.from("game_state").select("user_id,state").eq("game", APPLY_GAME(id)).limit(300);
  const row = (rows ?? []).find(x => appKey(x.user_id, id) === key);
  if (!row) return { error: "지원서를 찾을 수 없어요" };
  const now = new Date().toISOString();
  const { error } = await s.from("game_state").update({ state: { ...(row.state as object), status, statusAt: now }, updated_at: now }).eq("user_id", row.user_id).eq("game", APPLY_GAME(id));
  if (error) return { error: "상태를 바꾸지 못했어요. 잠시 후 다시" };
  pushToUsers([row.user_id], { title: "📩 지원 현황이 바뀌었어요", body: `${j.hospital} 공고 · ${statusOf(status).seeker}`, url: `/jobs/resume#apps`, tag: "japply" }).catch(() => {});
  touch(id);
  return { ok: `${statusOf(status).author}(으)로 바꿨어요` };
}
