import { createHash } from "crypto";
import { db } from "./supabase";

/** 📄 내 이력서 — game_state: game="resume"(내 이력서) · game="japply:<공고 id>"(지원 내역, user_id = 지원자)
 *  새 테이블 없이 기존 game_state만 써서 배포 즉시 동작해요. */
export const RESUME_GAME = "resume";
export const APPLY_GAME = (jobId: number | string) => `japply:${jobId}`;

export type Resume = {
  name: string; contact: string; dept: string; years: string; want: string; region: string;
  skills: string; career: string; at: string;
};

/** 지원 상태 — 구직자에게 보이는 문구 / 병원(작성자)이 고르는 문구 */
export const APP_STATUS = [
  { k: "new", seeker: "✅ 지원 완료", author: "접수" },
  { k: "review", seeker: "👀 검토 중", author: "검토 중" },
  { k: "interview", seeker: "🎉 면접 제안", author: "면접 제안" },
  { k: "no", seeker: "🕊️ 다음 기회에", author: "다음 기회에" },
] as const;
export type AppStatus = typeof APP_STATUS[number]["k"];
export const isStatus = (v: unknown): v is AppStatus => APP_STATUS.some(x => x.k === v);
export const statusOf = (k?: string) => APP_STATUS.find(x => x.k === k) ?? APP_STATUS[0];
/** 작성자가 바꿀 수 있는 상태 (접수는 '지원 직후' 표시라 선택지에서 빼요) */
export const AUTHOR_STATUS = APP_STATUS.filter(s => s.k !== "new");

export type Apply = {
  name: string; contact: string; dept: string; years: string; region: string; want: string;
  skills: string; career: string; msg: string; status: AppStatus; at: string;
};
/** 작성자 화면에 내보내는 지원자 키 — 지원자 user id 대신 해시 */
export const appKey = (uid: string, jobId: number | string) => "a" + createHash("sha1").update(`${uid}:${jobId}:japply:mw`).digest("hex").slice(0, 15);
export type Applicant = Apply & { key: string };
export type MyApply = { jobId: number; status: AppStatus; at: string; job: { id: number; hospital: string; dept: string; closed: boolean; deadline: string | null } | null };

export async function loadResume(uid: string): Promise<Resume | null> {
  const { data } = await db().from("game_state").select("state").eq("user_id", uid).eq("game", RESUME_GAME).maybeSingle();
  return (data?.state as Resume) ?? null;
}

/** 이 공고에 내가 쓴 지원서 */
export async function loadApply(jobId: number, uid: string): Promise<Apply | null> {
  const { data } = await db().from("game_state").select("state").eq("user_id", uid).eq("game", APPLY_GAME(jobId)).maybeSingle();
  return (data?.state as Apply) ?? null;
}

/** 공고 작성자 화면 — 이 공고에 들어온 지원서 전부 (최신순) */
export async function loadApplicants(jobId: number): Promise<Applicant[]> {
  const { data } = await db().from("game_state").select("user_id,state").eq("game", APPLY_GAME(jobId)).order("updated_at", { ascending: false }).limit(300);
  return (data ?? []).map(r => ({ ...(r.state as Apply), status: (isStatus((r.state as Apply)?.status) ? (r.state as Apply).status : "new"), key: appKey(r.user_id, jobId) }));
}

/** 내가 지원한 공고 목록 + 공고 요약 */
export async function loadMyApplies(uid: string): Promise<MyApply[]> {
  const { data } = await db().from("game_state").select("game,state,updated_at").eq("user_id", uid).like("game", "japply:%").order("updated_at", { ascending: false }).limit(200);
  const rows = (data ?? []).map(r => ({ id: Number(String(r.game).slice(7)), st: r.state as Apply, at: r.updated_at }));
  const ids = rows.map(r => r.id).filter(n => Number.isInteger(n) && n > 0);
  const { data: js } = ids.length ? await db().from("jobs").select("id,hospital,dept,closed,deadline").in("id", ids) : { data: [] as any[] };
  const m = new Map((js ?? []).map((j: any) => [j.id, j]));
  return rows.filter(r => r.id > 0).map(r => ({ jobId: r.id, status: isStatus(r.st?.status) ? r.st.status : "new", at: r.st?.at ?? r.at, job: (m.get(r.id) as any) ?? null }));
}

/** 외부 공고에서 '복사해서 쓰기'용 텍스트 */
export function resumeText(r: Resume) {
  const L: [string, string][] = [["이름", r.name], ["연락처", r.contact], ["직종", r.dept], ["경력", r.years], ["희망 근무", r.want], ["희망 지역", r.region], ["보유 술기·자격", r.skills], ["경력·소개", r.career]];
  return L.filter(([, v]) => (v ?? "").trim()).map(([k, v]) => `[${k}] ${String(v).trim()}`).join("\n");
}
/** 연락처를 tel:/mailto: 링크로 (그 밖의 형태는 링크 없이) */
export function contactHref(c: string) {
  const t = (c ?? "").trim();
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(t)) return `mailto:${t}`;
  if (/^[0-9+\-\s().]{7,20}$/.test(t)) return `tel:${t.replace(/[^0-9+]/g, "")}`;
  return "";
}
