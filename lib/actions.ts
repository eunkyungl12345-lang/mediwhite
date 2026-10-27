"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "./supabase";
import { createSession, getSession, clearSession, type Session } from "./auth";
import { DEPTS, CATS, NOTICE_CAT } from "./depts";
import { awardXp, repeatXp } from "./xp";
import { signupBonus, can, RANKS, rankOf } from "./ranks";
import { myRank, isDeptLeader } from "./ranksvc";

const admins = () => (process.env.ADMIN_USERNAMES || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);
export type FormState = { error?: string; ok?: string } | undefined;

async function requireUser(): Promise<Session> { const s = await getSession(); if (!s) redirect("/login"); return s; }
async function requireAdmin(): Promise<Session> { const s = await requireUser(); if (s.role !== "admin") redirect("/board"); return s; }

/* ---------- 가입/로그인 ---------- */
export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const username = clean(fd.get("username"), 20).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const nickname = clean(fd.get("nickname"), 12);
  const dept = clean(fd.get("dept"), 30);
  const ref = clean(fd.get("ref"), 20).toLowerCase() || cookies().get("mw_ref")?.value || null;
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { error: "아이디는 영문 소문자·숫자·밑줄 3~20자예요" };
  if (password.length < 4) return { error: "비밀번호는 4자 이상이에요" };
  if (!nickname) return { error: "닉네임을 입력해주세요" };
  if (!(DEPTS as readonly string[]).includes(dept)) return { error: "직종을 선택해주세요" };
  const s = db();
  const { data: exists } = await s.from("users").select("id").eq("username", username).maybeSingle();
  if (exists) return { error: "이미 쓰는 아이디예요" };
  const role = admins().includes(username) ? "admin" : "member";
  const { count } = await s.from("users").select("id", { count: "exact", head: true }).eq("stealth", false);
  const order = (count ?? 0) + 1;
  const { data, error } = await s.from("users").insert({ username, password_hash: await bcrypt.hash(password, 10), nickname, dept, role, referred_by: ref && ref !== username ? ref : null }).select("id").single();
  if (error || !data) return { error: "가입에 실패했어요. 잠시 후 다시 시도해주세요" };
  await awardXp(data.id, signupBonus(order), "signup", "signup");
  if (ref && ref !== username) { const { data: r } = await s.from("users").select("id").eq("username", ref).maybeSingle(); if (r) await repeatXp(r.id, "referral"); }
  await createSession({ id: data.id, username, nickname, dept, role });
  redirect("/board");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = clean(fd.get("username"), 20).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const { data: u } = await db().from("users").select("*").eq("username", username).maybeSingle();
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return { error: "아이디 또는 비밀번호가 맞지 않아요" };
  const role = u.role === "admin" || admins().includes(username) ? "admin" : "member";
  await createSession({ id: u.id, username, nickname: u.nickname, dept: u.dept, role });
  redirect("/board");
}
export async function logout() { clearSession(); redirect("/login"); }

/* ---------- 내 정보 ---------- */
export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const nickname = clean(fd.get("nickname"), 12), bio = clean(fd.get("bio"), 80);
  if (!nickname) return { error: "닉네임을 입력해주세요" };
  await db().from("users").update({ nickname, bio }).eq("id", u.id);
  if (bio) await awardXp(u.id, 50, "bio");
  await createSession({ ...u, nickname });
  revalidatePath("/rank"); revalidatePath(`/u/${u.username}`);
  return { ok: "저장했어요" };
}

export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  if (String(fd.get("confirm") ?? "") !== "탈퇴") return { error: "확인 칸에 '탈퇴'라고 적어주세요" };
  await db().from("users").delete().eq("id", u.id);
  clearSession(); redirect("/login");
}

/* ---------- 채팅 ---------- */
export async function sendMessage(text: string) {
  const u = await requireUser();
  const t = text.trim().slice(0, 500); if (!t) return null;
  const s = db();
  const r = await myRank(u.id);
  const { data } = await s.from("messages").insert({ user_id: u.id, nickname: u.nickname, dept: u.dept, text: t, rank: String(r.index) }).select("id,nickname,dept,text,created_at,user_id,rank").single();
  await awardXp(u.id, 50, "first_chat"); await repeatXp(u.id, "chat");
  return data;
}

/* ---------- 게시판 ---------- */
export async function createPost(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const category = clean(fd.get("category"), 30), title = clean(fd.get("title"), 80), body = clean(fd.get("body"), 4000);
  const boardId = clean(fd.get("board_id"), 40) || null;
  if (!(CATS as readonly string[]).includes(category)) return { error: "칸을 선택해주세요" };
  if (category === NOTICE_CAT && u.role !== "admin" && !can(await myRank(u.id), "준장")) return { error: "공지 칸은 준장 이상만 쓸 수 있어요" };
  if (!title || !body) return { error: "제목과 내용을 적어주세요" };
  const s = db();
  if (boardId) { const { data: b } = await s.from("boards").select("dept").eq("id", boardId).maybeSingle(); if (!b || b.dept !== category) return { error: "탭이 맞지 않아요" }; }
  const { data, error } = await s.from("posts").insert({ author_id: u.id, category, dept: u.dept, title, body, board_id: boardId }).select("id").single();
  if (error || !data) return { error: "올리지 못했어요" };
  await awardXp(u.id, 100, "first_post"); await repeatXp(u.id, "post");
  revalidatePath("/board"); redirect(`/board/${data.id}`);
}
export async function addComment(postId: string, text: string) {
  const u = await requireUser();
  const t = text.trim().slice(0, 500); if (!t) return;
  await db().from("comments").insert({ post_id: postId, author_id: u.id, dept: u.dept, text: t });
  await awardXp(u.id, 50, "first_comment"); await repeatXp(u.id, "comment");
  revalidatePath(`/board/${postId}`);
}
export async function togglePin(postId: string, pinned: boolean) {
  const u = await requireUser(); if (u.role !== "admin") return;
  await db().from("posts").update({ pinned }).eq("id", postId);
  revalidatePath("/board"); revalidatePath(`/board/${postId}`);
}
export async function boostPost(postId: string, on: boolean) {
  const u = await requireUser();
  if (!can(await myRank(u.id), "소령")) return;
  const s = db();
  if (on) await s.from("posts").update({ boosted: false }).eq("author_id", u.id).eq("boosted", true);
  await s.from("posts").update({ boosted: on }).eq("id", postId).eq("author_id", u.id);
  revalidatePath("/board"); revalidatePath(`/board/${postId}`);
}
export async function deletePost(postId: string) {
  const u = await requireUser();
  const q = db().from("posts").delete().eq("id", postId); if (u.role !== "admin") q.eq("author_id", u.id);
  await q; revalidatePath("/board"); redirect("/board");
}
export async function deleteComment(id: number, postId: string) {
  const u = await requireUser();
  const q = db().from("comments").delete().eq("id", id); if (u.role !== "admin") q.eq("author_id", u.id);
  await q; revalidatePath(`/board/${postId}`);
}
/** 파트 리더(또는 관리자): 파트 게시판에 탭 신설 */
export async function createBoard(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const dept = clean(fd.get("dept"), 30), name = clean(fd.get("name"), 20);
  if (!(DEPTS as readonly string[]).includes(dept) || !name) return { error: "탭 이름을 적어주세요" };
  if (u.role !== "admin" && !(await isDeptLeader(u.id, dept))) return { error: "파트 리더만 탭을 만들 수 있어요" };
  const { error } = await db().from("boards").insert({ dept, name, created_by: u.id });
  if (error) return { error: "이미 있는 탭 이름이에요" };
  revalidatePath("/board"); return { ok: `'${name}' 탭을 만들었어요` };
}
export async function deleteBoard(id: string, dept: string) {
  const u = await requireUser();
  if (u.role !== "admin" && !(await isDeptLeader(u.id, dept))) return;
  await db().from("boards").delete().eq("id", id); revalidatePath("/board");
}

/* ---------- 게임 ---------- */
export async function saveScore(game: "dodge" | "sword", value: number, mode?: string) {
  const u = await requireUser();
  if (!Number.isFinite(value) || value < 0) return;
  const s = db();
  if (game === "dodge") { for (const [th, xp] of [[10, 100], [20, 200], [30, 400]] as const) if (value >= th) await awardXp(u.id, xp, `dodge_${th}`); }
  if (game === "sword") { for (const [th, xp] of [[5, 100], [10, 300], [15, 700]] as const) if (value >= th) await awardXp(u.id, xp, `sword_${th}`); }
  const { data: cur } = await s.from("scores").select("value").eq("user_id", u.id).eq("game", game).maybeSingle();
  if (cur && Number(cur.value) >= value) return;
  await s.from("scores").upsert({ user_id: u.id, game, value, mode: mode ?? null, updated_at: new Date().toISOString() });
  revalidatePath("/games"); revalidatePath("/rank");
}
export async function questOnce(key: "roulette_1") {
  const u = await requireUser();
  if (key === "roulette_1") await awardXp(u.id, 30, key);
  revalidatePath("/rank");
}

/* ---------- 관리자 ---------- */
export async function adminCreateUser(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const username = clean(fd.get("username"), 20).toLowerCase(), password = String(fd.get("password") ?? ""), nickname = clean(fd.get("nickname"), 12), dept = clean(fd.get("dept"), 30);
  const rankIdx = Math.max(0, Math.min(RANKS.length - 1, Number(fd.get("rank") ?? 0)));
  const stealth = fd.get("stealth") === "on";
  if (!/^[a-z0-9_]{3,20}$/.test(username) || password.length < 4 || !nickname || !(DEPTS as readonly string[]).includes(dept)) return { error: "입력값을 확인해주세요" };
  const s = db();
  const { data: exists } = await s.from("users").select("id").eq("username", username).maybeSingle();
  if (exists) return { error: "이미 쓰는 아이디예요" };
  const xp = RANKS[rankIdx][1];
  const { error } = await s.from("users").insert({ username, password_hash: await bcrypt.hash(password, 10), nickname, dept, role: "member", xp, stealth });
  if (error) return { error: "생성 실패" };
  revalidatePath("/admin"); return { ok: `${rankName(rankIdx)} [${dept}]${nickname} 계정 생성 (아이디 ${username})` };
}
function rankName(i: number) { return RANKS[i][0]; }
export async function adminSetXp(userId: string, xp: number) {
  await requireAdmin();
  if (!Number.isFinite(xp) || xp < 0) return;
  await db().from("users").update({ xp: Math.round(xp) }).eq("id", userId);
  revalidatePath("/admin"); revalidatePath("/rank");
}
export async function adminSetRank(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = clean(fd.get("user_id"), 40), rankIdx = Math.max(0, Math.min(RANKS.length - 1, Number(fd.get("rank") ?? 0)));
  await db().from("users").update({ xp: RANKS[rankIdx][1] }).eq("id", userId);
  revalidatePath("/admin"); revalidatePath("/rank"); return { ok: "변경했어요" };
}
export async function adminToggleStealth(userId: string, stealth: boolean) {
  await requireAdmin(); await db().from("users").update({ stealth }).eq("id", userId); revalidatePath("/admin");
}
export async function adminDeleteUser(userId: string) {
  const me = await requireAdmin(); if (userId === me.id) return;
  await db().from("users").delete().eq("id", userId); revalidatePath("/admin");
}
export async function adminLoginAs(userId: string) {
  await requireAdmin();
  const { data: u } = await db().from("users").select("*").eq("id", userId).maybeSingle();
  if (!u) return;
  await createSession({ id: u.id, username: u.username, nickname: u.nickname, dept: u.dept, role: u.role === "admin" || admins().includes(u.username) ? "admin" : "member" });
  redirect("/board");
}
