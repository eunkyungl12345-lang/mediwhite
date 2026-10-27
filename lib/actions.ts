"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./supabase";
import { createSession, getSession, clearSession, type Session } from "./auth";
import { DEPTS, CATS, NOTICE_CAT } from "./depts";
import { myRank } from "./ranksvc";
import { awardXp, chatXp } from "./xp";
import { REPEAT, signupBonus, can } from "./ranks";

const admins = () => (process.env.ADMIN_USERNAMES || "").split(",").map(s => s.trim()).filter(Boolean);
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export type FormState = { error?: string } | undefined;

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const username = clean(fd.get("username"), 20).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const nickname = clean(fd.get("nickname"), 12);
  const dept = clean(fd.get("dept"), 30);
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { error: "아이디는 영문 소문자·숫자·밑줄 3~20자예요" };
  if (password.length < 4) return { error: "비밀번호는 4자 이상이에요" };
  if (!nickname) return { error: "닉네임을 입력해주세요" };
  if (!(DEPTS as readonly string[]).includes(dept)) return { error: "소속을 선택해주세요" };
  const s = db();
  const { data: exists } = await s.from("users").select("id").eq("username", username).maybeSingle();
  if (exists) return { error: "이미 쓰는 아이디예요" };
  const role = admins().includes(username) ? "admin" : "member";
  const { data, error } = await s.from("users").insert({ username, password_hash: await bcrypt.hash(password, 10), nickname, dept, role }).select("id,seq").single();
  if (error || !data) return { error: "가입에 실패했어요. 잠시 후 다시 시도해주세요" };
  await awardXp(data.id, signupBonus(data.seq), "signup");
  await createSession({ id: data.id, username, nickname, dept, role });
  redirect("/chat");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = clean(fd.get("username"), 20).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const { data: u } = await db().from("users").select("*").eq("username", username).maybeSingle();
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return { error: "아이디 또는 비밀번호가 맞지 않아요" };
  const role = u.role === "admin" || admins().includes(username) ? "admin" : "member";
  await createSession({ id: u.id, username, nickname: u.nickname, dept: u.dept, role });
  redirect("/chat");
}

export async function logout() { clearSession(); redirect("/login"); }

async function requireUser(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function sendMessage(text: string) {
  const u = await requireUser();
  const t = text.trim().slice(0, 500);
  if (!t) return null;
  const s = db();
  const rank = (await myRank(u.id)).name;
  const { data } = await s.from("messages").insert({ user_id: u.id, nickname: u.nickname, dept: u.dept, text: t, rank }).select("id,nickname,dept,text,created_at,user_id,rank").single();
  await chatXp(u.id);
  return data;
}

export async function createPost(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const category = clean(fd.get("category"), 30), title = clean(fd.get("title"), 80), body = clean(fd.get("body"), 4000);
  if (!(CATS as readonly string[]).includes(category)) return { error: "칸을 선택해주세요" };
  if (category === NOTICE_CAT && u.role !== "admin" && !can(await myRank(u.id), "준장")) return { error: "공지 칸은 준장 이상만 쓸 수 있어요" };
  if (!title || !body) return { error: "제목과 내용을 적어주세요" };
  const { data, error } = await db().from("posts").insert({ author_id: u.id, category, dept: u.dept, title, body }).select("id").single();
  if (error || !data) return { error: "올리지 못했어요" };
  await awardXp(u.id, 100, "first_post"); await awardXp(u.id, REPEAT.post, null);
  revalidatePath("/board");
  redirect(`/board/${data.id}`);
}

export async function addComment(postId: string, text: string) {
  const u = await requireUser();
  const t = text.trim().slice(0, 500);
  if (!t) return;
  await db().from("comments").insert({ post_id: postId, author_id: u.id, dept: u.dept, text: t });
  await awardXp(u.id, 50, "first_comment"); await awardXp(u.id, REPEAT.comment, null);
  revalidatePath(`/board/${postId}`);
}

export async function togglePin(postId: string, pinned: boolean) {
  const u = await requireUser();
  if (u.role !== "admin") return;
  await db().from("posts").update({ pinned }).eq("id", postId);
  revalidatePath("/board"); revalidatePath(`/board/${postId}`);
}

export async function deletePost(postId: string) {
  const u = await requireUser();
  const q = db().from("posts").delete().eq("id", postId);
  if (u.role !== "admin") q.eq("author_id", u.id);
  await q;
  revalidatePath("/board");
  redirect("/board");
}

export async function deleteComment(id: number, postId: string) {
  const u = await requireUser();
  const q = db().from("comments").delete().eq("id", id);
  if (u.role !== "admin") q.eq("author_id", u.id);
  await q;
  revalidatePath(`/board/${postId}`);
}

export async function saveScore(game: "dodge" | "sword", value: number, mode?: string) {
  const u = await requireUser();
  if (!Number.isFinite(value) || value < 0) return;
  const s = db();
  // 퀘스트 체크 (1회성)
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

/** 소령 이상: 내 글 1개 밀어올리기 (다른 내 글의 밀어올리기는 해제) */
export async function boostPost(postId: string, on: boolean) {
  const u = await requireUser();
  if (!can(await myRank(u.id), "소령")) return;
  const s = db();
  if (on) await s.from("posts").update({ boosted: false }).eq("author_id", u.id).eq("boosted", true);
  await s.from("posts").update({ boosted: on }).eq("id", postId).eq("author_id", u.id);
  revalidatePath("/board"); revalidatePath(`/board/${postId}`);
}

/** 회원탈퇴: 계정 삭제. 글·댓글·채팅은 익명으로 남고(작성자 null), 점수·경험치는 삭제. */
export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  if (String(fd.get("confirm") ?? "") !== "탈퇴") return { error: "확인 칸에 '탈퇴'라고 적어주세요" };
  await db().from("users").delete().eq("id", u.id);
  clearSession();
  redirect("/login");
}
