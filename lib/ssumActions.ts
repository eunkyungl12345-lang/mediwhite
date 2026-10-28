"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { getSession, type Session } from "./auth";
import { pushToUsers } from "./push";
import { personMention } from "./safety";

type R = { error?: string; ok?: string } | undefined;
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
async function me(): Promise<Session> { const s = await getSession(); if (!s) redirect("/login"); return s; }
/** 프로필·소개 글에 연락처 금지 (서로 관심 → 1:1 대화로만 연결) */
const CONTACT = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})|([\w.+-]+@[\w-]+\.[\w.]+)|(카톡|카카오톡|오픈채팅|open\.kakao|인스타|insta|@[a-z0-9_.]{3,})/i;

/* ---------- 닉네임 고백: 받은 사람이 수락해야 공개 ---------- */
export async function sendConfession(_: R, fd: FormData): Promise<R> {
  const u = await me();
  const nick = clean(fd.get("to"), 12).replace(/^\[[^\]]*\]/, ""), text = clean(fd.get("text"), 300);
  if (!nick || !text) return { error: "받는 사람 닉네임과 내용을 적어주세요" };
  if (personMention(text)) return { error: "실명·직함 같은 개인 식별 표현은 빼주세요" };
  const s = db();
  const { data: to } = await s.from("users").select("id").eq("nickname", nick).eq("stealth", false).maybeSingle();
  if (!to) return { error: "그 닉네임을 가진 회원이 없어요" };
  if (to.id === u.id) return { error: "스스로에게는 고백할 수 없어요" };
  const { count } = await s.from("confessions").select("id", { count: "exact", head: true }).eq("from_id", u.id).gte("created_at", new Date(Date.now() - 86400000).toISOString());
  if ((count ?? 0) >= 3) return { error: "고백은 하루 3번까지예요" };
  await s.from("confessions").insert({ from_id: u.id, to_id: to.id, text });
  pushToUsers([to.id], { title: "💌 누군가 고백을 보냈어요", body: "썸 탭 → 내 썸함에서 확인해보세요", url: "/ssum?tab=box", tag: "confess" }).catch(() => {});
  revalidatePath("/ssum"); return { ok: "익명으로 보냈어요. 상대가 수락하면 두 사람 닉네임과 함께 공개돼요 💘" };
}
export async function answerConfession(id: number, accept: boolean) {
  const u = await me(); const s = db();
  const { data: c } = await s.from("confessions").select("from_id,to_id,status").eq("id", id).maybeSingle();
  if (!c || c.to_id !== u.id || c.status !== "pending") return;
  await s.from("confessions").update({ status: accept ? "accepted" : "declined", answered_at: new Date().toISOString() }).eq("id", id);
  if (accept) pushToUsers([c.from_id], { title: "💘 고백이 수락됐어요!", body: "이제 1:1로 대화할 수 있어요", url: `/ssum/dm/${u.id}`, tag: "confess" }).catch(() => {});
  revalidatePath("/ssum");
}

/* ---------- 셀소: 셀프 소개 카드 ---------- */
export async function saveDatingProfile(_: R, fd: FormData): Promise<R> {
  const u = await me();
  if (fd.get("adult") !== "on") return { error: "만 19세 이상만 참여할 수 있어요" };
  const age = Number(fd.get("age")), height = Number(fd.get("height")) || null;
  if (!Number.isInteger(age) || age < 19 || age > 70) return { error: "나이를 확인해주세요 (만 19세 이상)" };
  const gender = clean(fd.get("gender"), 2); if (!["남", "여"].includes(gender)) return { error: "성별을 골라주세요" };
  const f = { region: clean(fd.get("region"), 20), personality: clean(fd.get("personality"), 60), hobby: clean(fd.get("hobby"), 60), style: clean(fd.get("style"), 60), want: clean(fd.get("want"), 60), intro: clean(fd.get("intro"), 300) };
  if (Object.values(f).some(v => CONTACT.test(v))) return { error: "연락처·SNS 아이디는 적을 수 없어요. 서로 '관심 있어요'를 누르면 1:1 대화가 열려요." };
  await db().from("dating_profiles").upsert({ user_id: u.id, age, height, gender, ...f, visible: fd.get("visible") === "on", updated_at: new Date().toISOString() });
  revalidatePath("/ssum"); return { ok: "프로필 카드를 저장했어요" };
}
export async function deleteDatingProfile() { const u = await me(); await db().from("dating_profiles").delete().eq("user_id", u.id); await db().from("likes").delete().eq("kind", "profile").eq("target", u.id); revalidatePath("/ssum"); }

/* ---------- 지인을 소개합니다 (본인 동의 필수) ---------- */
export async function saveIntro(_: R, fd: FormData): Promise<R> {
  const u = await me();
  if (fd.get("consent") !== "on") return { error: "소개할 분께 동의를 받았는지 체크해주세요" };
  const age = Number(fd.get("age")), height = Number(fd.get("height")) || null;
  if (!Number.isInteger(age) || age < 19 || age > 70) return { error: "나이를 확인해주세요 (만 19세 이상)" };
  const gender = clean(fd.get("gender"), 2); if (!["남", "여"].includes(gender)) return { error: "지인의 성별을 골라주세요" };
  const f = { dept: clean(fd.get("dept"), 20), region: clean(fd.get("region"), 20), personality: clean(fd.get("personality"), 60), hobby: clean(fd.get("hobby"), 60), style: clean(fd.get("style"), 60), want: clean(fd.get("want"), 60), intro: clean(fd.get("intro"), 300) };
  if (Object.values(f).some(v => CONTACT.test(v)) || personMention(f.intro)) return { error: "이름·연락처·SNS 등 지인을 알아볼 수 있는 정보는 빼주세요" };
  const { count } = await db().from("intros").select("id", { count: "exact", head: true }).eq("author_id", u.id);
  if ((count ?? 0) >= 5) return { error: "지인 소개는 5명까지 올릴 수 있어요" };
  await db().from("intros").insert({ author_id: u.id, age, height, gender, ...f });
  revalidatePath("/ssum"); return { ok: "지인 소개를 올렸어요" };
}
export async function deleteIntro(id: number) {
  const u = await me(); const q = db().from("intros").delete().eq("id", id);
  await (u.role === "admin" ? q : q.eq("author_id", u.id)); await db().from("likes").delete().eq("kind", "intro").eq("target", String(id)); revalidatePath("/ssum");
}

/* ---------- 관심 있어요 → 서로 관심이면 1:1 대화 ---------- */
export async function toggleLike(kind: "profile" | "intro", target: string) {
  const u = await me(); const s = db();
  const { data: cur } = await s.from("likes").select("from_id").eq("from_id", u.id).eq("kind", kind).eq("target", target).maybeSingle();
  if (cur) { await s.from("likes").delete().eq("from_id", u.id).eq("kind", kind).eq("target", target); revalidatePath("/ssum"); return { liked: false, mutual: false }; }
  await s.from("likes").insert({ from_id: u.id, kind, target });
  let mutual = false;
  if (kind === "profile") {
    if (target === u.id) return { liked: false, mutual: false };
    const { data: back } = await s.from("likes").select("from_id").eq("from_id", target).eq("kind", "profile").eq("target", u.id).maybeSingle();
    mutual = !!back;
    pushToUsers([target], mutual ? { title: "💘 서로 관심!", body: "1:1 대화가 열렸어요", url: `/ssum/dm/${u.id}`, tag: "like" } : { title: "💗 누군가 내 카드에 관심을 보였어요", body: "썸 탭 → 내 썸함", url: "/ssum?tab=box", tag: "like" }).catch(() => {});
  } else {
    const { data: it } = await s.from("intros").select("author_id").eq("id", Number(target)).maybeSingle();
    if (it && it.author_id !== u.id) { mutual = true; pushToUsers([it.author_id], { title: "🤝 소개한 지인에게 관심이 왔어요", body: "1:1 대화로 연결해보세요", url: `/ssum/dm/${u.id}`, tag: "like" }).catch(() => {}); }
  }
  revalidatePath("/ssum"); return { liked: true, mutual };
}

/** 1:1 대화 가능 여부: 서로 관심 / 고백 수락 / 지인 소개 관심 */
export async function canDm(a: string, b: string) {
  if (a === b) return false; const s = db();
  const [{ data: l1 }, { data: l2 }, { data: cf }, { data: myIntros }, { data: theirIntros }] = await Promise.all([
    s.from("likes").select("from_id").eq("from_id", a).eq("kind", "profile").eq("target", b).maybeSingle(),
    s.from("likes").select("from_id").eq("from_id", b).eq("kind", "profile").eq("target", a).maybeSingle(),
    s.from("confessions").select("id").eq("status", "accepted").or(`and(from_id.eq.${a},to_id.eq.${b}),and(from_id.eq.${b},to_id.eq.${a})`).limit(1),
    s.from("intros").select("id").eq("author_id", a), s.from("intros").select("id").eq("author_id", b),
  ]);
  if (l1 && l2) return true;
  if (cf?.length) return true;
  const ids = (x: any[] | null) => (x ?? []).map(i => String(i.id));
  const [{ data: bLikesMine }, { data: aLikesTheirs }] = await Promise.all([
    ids(myIntros).length ? s.from("likes").select("from_id").eq("from_id", b).eq("kind", "intro").in("target", ids(myIntros)).limit(1) : Promise.resolve({ data: [] as any[] }),
    ids(theirIntros).length ? s.from("likes").select("from_id").eq("from_id", a).eq("kind", "intro").in("target", ids(theirIntros)).limit(1) : Promise.resolve({ data: [] as any[] }),
  ]);
  return !!(bLikesMine?.length || aLikesTheirs?.length);
}
export async function sendDm(other: string, text: string) {
  const u = await me(); const t = text.trim().slice(0, 500); if (!t) return;
  if (!(await canDm(u.id, other))) return;
  const [a, b] = [u.id, other].sort();
  await db().from("dms").insert({ a, b, sender: u.id, text: t });
  pushToUsers([other], { title: `💬 ${u.nickname}`, body: t.slice(0, 60), url: `/ssum/dm/${u.id}`, tag: "dm" }).catch(() => {});
  revalidatePath(`/ssum/dm/${other}`);
}

/* ---------- 오늘의 솔로 (요미 픽) ---------- */
export async function pickSolo(userId: string, comment: string) {
  const u = await me(); if (u.role !== "admin") return;
  const day = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  await db().from("settings").upsert({ key: "solo_pick", value: JSON.stringify({ userId, comment: comment.slice(0, 100), day }) });
  revalidatePath("/ssum");
}
