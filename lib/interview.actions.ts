"use server";
import { pledgeGate } from "./pledge";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession } from "./auth";
import { awardXp } from "./xp";
import { personMention } from "./safety";
import { textProblem } from "./textQuality";
import { JOB_DEPTS, JOB_REGIONS } from "./jobs";
import { EXT_JOBS } from "./extJobs";
import { guessKind } from "./interview";
import { IV_ROUTE, IV_STEPS, IV_RESULT, IV_FOLLOW, ivKey } from "./interview";
type R = { error?: string } | undefined;
const clean = (v: FormDataEntryValue | null, n: number) => String(v ?? "").trim().slice(0, n);
export async function submitInterview(_: R, fd: FormData): Promise<R> {
  const u = await getSession(); if (!u) redirect("/login"); const s = db();
  { const pg = await pledgeGate(u.id, fd); if (pg) return { error: pg }; }
  let hid = Number(fd.get("hid")) || 0;
  if (!hid && fd.get("ext")) { // 🔗 외부 공고에서 들어온 병원 — 이름으로 찾고, 없으면 새로 등록
    const e = EXT_JOBS.find(x => x.id === Number(fd.get("ext"))); const region = clean(fd.get("region"), 10);
    if (!e) return { error: "공고를 찾을 수 없어요" }; if (!(JOB_REGIONS as readonly string[]).includes(region)) return { error: "병원 지역을 골라주세요" };
    const { data: ex } = await s.from("hospitals").select("id").eq("name", e.h).limit(1).maybeSingle();
    if (ex) hid = ex.id; else { const { data: nh, error } = await s.from("hospitals").insert({ name: e.h, region, kind: guessKind(e.h), created_by: u.id }).select("id").single(); if (error || !nh) return { error: "병원 등록에 실패했어요" }; hid = nh.id; }
  }
  const { data: h } = await s.from("hospitals").select("id").eq("id", hid).maybeSingle(); if (!h) return { error: "병원을 찾을 수 없어요" };
  const dept = clean(fd.get("dept"), 10), year = clean(fd.get("year"), 4), route = clean(fd.get("route"), 10), result = clean(fd.get("result"), 20);
  const steps = fd.getAll("step").map(String).filter(x => (IV_STEPS as readonly string[]).includes(x)), level = Number(fd.get("level")), feel = Number(fd.get("feel"));
  const q = clean(fd.get("q"), 1000), tip = clean(fd.get("tip"), 500), follow = IV_FOLLOW[result] ? clean(fd.get("follow"), 500) : "", wait = Math.round(Number(fd.get("wait")) || 0);
  if (!(JOB_DEPTS as readonly string[]).includes(dept)) return { error: "지원 직종을 골라주세요" };
  if (!/^20\d\d$/.test(year)) return { error: "면접 본 연도를 골라주세요" };
  if (!(IV_ROUTE as readonly string[]).includes(route)) return { error: "지원 경로를 골라주세요" };
  if (!steps.length) return { error: "전형 단계를 하나 이상 골라주세요" };
  if (!(level >= 1 && level <= 5)) return { error: "난이도를 골라주세요" };
  if (!(IV_RESULT as readonly string[]).includes(result)) return { error: "결과를 골라주세요" };
  if (![0, 1, 2].includes(feel) || fd.get("feel") === null) return { error: "면접 경험을 골라주세요" };
  const tq = textProblem(q, 20); if (tq) return { error: `면접 질문: ${tq}` }; if (tip) { const tt = textProblem(tip, 10); if (tt) return { error: `팁: ${tt}` }; }
  if (follow) { const tf = textProblem(follow, 10); if (tf) return { error: `${IV_FOLLOW[result].tag}: ${tf}` }; }
  for (const t of [q, tip, follow]) { const pm = personMention(t); if (pm) return { error: `특정인을 알 수 있는 표현("${pm}")은 빼주세요` }; }
  const { data: prev } = await s.from("game_state").select("user_id").eq("user_id", u.id).eq("game", ivKey(hid)).maybeSingle();
  const { error } = await s.from("game_state").upsert({ user_id: u.id, game: ivKey(hid), state: { dept, year, route, steps, level, result, feel, q, tip: tip || undefined, follow: follow || undefined, wait: wait >= 1 && wait <= 90 ? wait : undefined, at: new Date().toISOString() }, updated_at: new Date().toISOString() });
  if (error) return { error: "저장에 실패했어요" };
  if (!prev) await awardXp(u.id, 30, `hintv:${hid}`, "quest");
  revalidatePath(`/hospitals/${hid}`); redirect(`/hospitals/${hid}?t=intv`);
}
