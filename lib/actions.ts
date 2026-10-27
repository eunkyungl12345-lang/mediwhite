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
import { POINT_PER_WON, AMOUNTS } from "./support";
import { pushToUsers, pushToAll } from "./push";

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
  const { data, error } = await s.from("users").insert({ username, password_hash: await bcrypt.hash(password, 10), nickname, dept, role, join_order: order, referred_by: ref && ref !== username ? ref : null }).select("id").single();
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
/** 아이디 찾기: 닉네임+직종으로 일부 가린 아이디 안내 (개인정보 없이) */
export async function findUsername(_: FormState, fd: FormData): Promise<FormState> {
  const nickname = clean(fd.get("nickname"), 12), dept = clean(fd.get("dept"), 30);
  if (!nickname || !dept) return { error: "닉네임과 직종을 입력해주세요" };
  const { data } = await db().from("users").select("username").eq("nickname", nickname).eq("dept", dept).eq("stealth", false).limit(3);
  if (!data?.length) return { error: "일치하는 계정이 없어요. 닉네임을 바꿨다면 관리자에게 문의하세요" };
  const mask = (u: string) => u.slice(0, Math.min(3, Math.max(1, u.length - 2))) + "*".repeat(Math.max(2, u.length - 3));
  return { ok: `아이디: ${data.map(d => mask(d.username)).join(", ")}  (비밀번호를 잊었다면 관리자에게 초기화를 요청하세요)` };
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

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const cur = String(fd.get("current") ?? ""), next = String(fd.get("next") ?? ""), again = String(fd.get("again") ?? "");
  if (next.length < 4) return { error: "새 비밀번호는 4자 이상이에요" };
  if (next !== again) return { error: "새 비밀번호 두 칸이 서로 달라요" };
  const s = db();
  const { data: row } = await s.from("users").select("password_hash").eq("id", u.id).single();
  if (!row || !(await bcrypt.compare(cur, row.password_hash))) return { error: "현재 비밀번호가 맞지 않아요" };
  await s.from("users").update({ password_hash: await bcrypt.hash(next, 10) }).eq("id", u.id);
  return { ok: "비밀번호를 바꿨어요" };
}
export async function adminResetPassword(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = clean(fd.get("user_id"), 40), next = String(fd.get("next") ?? "");
  if (next.length < 4) return { error: "4자 이상" };
  await db().from("users").update({ password_hash: await bcrypt.hash(next, 10) }).eq("id", userId);
  return { ok: "초기화했어요" };
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
  const { data: me } = await s.from("users").select("xp").eq("id", u.id).maybeSingle();
  let ri = rankOf(me?.xp ?? 0).index;
  if (ri >= RANKS.length - 1) ri = (await myRank(u.id)).index; // 참모총장 후보만 파트 1위 확인
  const { data } = await s.from("messages").insert({ user_id: u.id, nickname: u.nickname, dept: u.dept, text: t, rank: String(ri) }).select("id,nickname,dept,text,created_at,user_id,rank").single();
  // 경험치는 응답 뒤로 미루지 않고 병렬로 (한 번의 DB 함수 호출씩)
  await Promise.all([awardXp(u.id, 50, "first_chat"), repeatXp(u.id, "chat")]);
  const mentions = Array.from(t.matchAll(/@([^\s@\[\]]{1,12})/g)).map(m => m[1]);
  if (mentions.length) { const { data: targets } = await s.from("users").select("id").in("nickname", mentions).neq("id", u.id); if (targets?.length) pushToUsers(targets.map(x => x.id), { title: "채팅에서 나를 불렀어요", body: `[${u.dept}]${u.nickname}: ${t.slice(0, 60)}`, url: "/board", tag: "mention" }).catch(() => {}); }
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
  await Promise.all([awardXp(u.id, 100, "first_post"), repeatXp(u.id, "post")]);
  revalidatePath("/board"); redirect(`/board/${data.id}`);
}
export async function addComment(postId: string, text: string) {
  const u = await requireUser();
  const t = text.trim().slice(0, 500); if (!t) return;
  const s = db();
  await s.from("comments").insert({ post_id: postId, author_id: u.id, dept: u.dept, text: t });
  const [{ data: post }] = await Promise.all([s.from("posts").select("author_id,title").eq("id", postId).maybeSingle(), awardXp(u.id, 50, "first_comment"), repeatXp(u.id, "comment")]);
  if (post?.author_id && post.author_id !== u.id) pushToUsers([post.author_id], { title: "내 글에 댓글", body: `[${u.dept}]${u.nickname}: ${t.slice(0, 60)}`, url: `/board/${postId}`, tag: `c-${postId}` }).catch(() => {});
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
export async function saveScore(game: "dodge" | "sword" | "defense" | "bowling" | "cpr" | "quiz" | "vein" | "runner", value: number, mode?: string) {
  const u = await requireUser();
  if (!Number.isFinite(value) || value < 0) return;
  const s = db();
  if (game === "dodge") { for (const [th, xp] of [[10, 100], [20, 200], [30, 400]] as const) if (value >= th) await awardXp(u.id, xp, `dodge_${th}`); }
  if (game === "runner") { for (const [th, xp] of [[700, 150], [1500, 400]] as const) if (value >= th) await awardXp(u.id, xp, `runner_${th}`); }
  if (game === "cpr") { for (const [th, xp] of [[600, 150], [900, 400]] as const) if (value >= th) await awardXp(u.id, xp, `cpr_${th}`); }
  if (game === "quiz") { for (const [th, xp] of [[300, 150], [500, 400]] as const) if (value >= th) await awardXp(u.id, xp, `quiz_${th}`); }
  if (game === "vein") { for (const [th, xp] of [[500, 150], [800, 400]] as const) if (value >= th) await awardXp(u.id, xp, `vein_${th}`); }
  if (game === "bowling") { for (const [th, xp] of [[100, 100], [150, 250], [200, 500]] as const) if (value >= th) await awardXp(u.id, xp, `bowling_${th}`); }
  if (game === "defense") { for (const [th, xp] of [[5, 150], [10, 400], [20, 800]] as const) if (value >= th) await awardXp(u.id, xp, `defense_${th}`); }
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
  const { count } = await s.from("users").select("id", { count: "exact", head: true }).eq("stealth", false);
  const { error } = await s.from("users").insert({ username, password_hash: await bcrypt.hash(password, 10), nickname, dept, role: "member", xp, stealth, join_order: stealth ? null : (count ?? 0) + 1 });
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
/** 관리자: 훈련병 강등 (19금/욕설). 경험치 0으로, 처음부터 다시. */
export async function adminDemote(userId: string, reason: string) {
  await requireAdmin();
  const s = db();
  const { data: u } = await s.from("users").select("id,nickname,dept").eq("id", userId).maybeSingle();
  if (!u) return;
  await s.from("users").update({ xp: 0 }).eq("id", userId);
  await s.from("xp_log").insert({ user_id: userId, key: null, amount: 0, kind: "demote" });
  await s.from("events").insert({ kind: "promotion", text: `${u.nickname ? `[${u.dept}]${u.nickname}` : "회원"}님이 ${reason || "규정 위반"}으로 훈련병 강등되었습니다.|0|${u.dept}|${u.nickname}` });
  revalidatePath("/admin"); revalidatePath("/rank");
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

/* ---------- 파트 응원 (공동 경험치) ---------- */
export async function requestContribution(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const amount = Number(fd.get("amount")), depositor = clean(fd.get("depositor"), 20);
  if (!AMOUNTS.includes(amount)) return { error: "금액을 선택해주세요" };
  if (!depositor) return { error: "입금자명을 적어주세요 (입금 확인용)" };
  const { error } = await db().from("contributions").insert({ user_id: u.id, dept: u.dept, amount, points: Math.round(amount * POINT_PER_WON), depositor });
  if (error) return { error: "신청에 실패했어요" };
  revalidatePath("/support"); return { ok: `신청 완료! ${amount.toLocaleString()}원 입금하시면 관리자가 확인 후 [${u.dept}] 파트에 ${Math.round(amount * POINT_PER_WON)} XP가 쌓여요.` };
}
export async function confirmContribution(id: number, ok: boolean) {
  await requireAdmin();
  const s = db();
  const { data: c } = await s.from("contributions").select("*").eq("id", id).eq("status", "pending").maybeSingle();
  if (!c) return;
  await s.from("contributions").update({ status: ok ? "confirmed" : "rejected", confirmed_at: new Date().toISOString() }).eq("id", id);
  if (ok) {
    const { data: pool } = await s.from("dept_pool").select("points").eq("dept", c.dept).maybeSingle();
    await s.from("dept_pool").upsert({ dept: c.dept, points: (pool?.points ?? 0) + c.points, updated_at: new Date().toISOString() });
    if (c.user_id) await awardXp(c.user_id, Math.round(c.points / 2), null, "support"); // 후원자 개인에게도 절반
    await s.from("events").insert({ kind: "support", text: `[${c.dept}] 파트에 ${c.points} XP가 응원으로 쌓였습니다.|-1|${c.dept}|` });
  }
  revalidatePath("/support"); revalidatePath("/admin"); revalidatePath("/board");
}
export async function adminSetBank(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  await db().from("settings").upsert({ key: "bank", value: clean(fd.get("bank"), 80) });
  revalidatePath("/support"); revalidatePath("/admin"); return { ok: "저장했어요" };
}
export async function adminAdjustPool(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const dept = clean(fd.get("dept"), 30), delta = Number(fd.get("delta"));
  if (!(DEPTS as readonly string[]).includes(dept) || !Number.isFinite(delta)) return { error: "입력 확인" };
  const s = db(); const { data: pool } = await s.from("dept_pool").select("points").eq("dept", dept).maybeSingle();
  await s.from("dept_pool").upsert({ dept, points: Math.max(0, (pool?.points ?? 0) + delta), updated_at: new Date().toISOString() });
  revalidatePath("/support"); revalidatePath("/board"); return { ok: `[${dept}] ${delta > 0 ? "+" : ""}${delta}` };
}

/* ---------- 게임 이어하기 (서버 저장) ---------- */
export async function loadGameState(game: string) {
  const u = await requireUser();
  const { data } = await db().from("game_state").select("state").eq("user_id", u.id).eq("game", game).maybeSingle();
  return (data?.state as Record<string, unknown> | undefined) ?? null;
}
export async function saveGameState(game: string, state: Record<string, unknown>) {
  const u = await requireUser();
  if (JSON.stringify(state).length > 20000) return;
  await db().from("game_state").upsert({ user_id: u.id, game, state, updated_at: new Date().toISOString() });
}

/* ---------- 문의 ---------- */
export async function submitInquiry(_: FormState, fd: FormData): Promise<FormState> {
  const s = await getSession();
  const kind = clean(fd.get("kind"), 20), name = clean(fd.get("name"), 30), contact = clean(fd.get("contact"), 80), body = clean(fd.get("body"), 2000);
  if (!["ad", "partner", "bug", "other"].includes(kind)) return { error: "문의 종류를 선택해주세요" };
  if (!name || !contact || !body) return { error: "이름, 연락처, 내용을 모두 적어주세요" };
  const { error } = await db().from("inquiries").insert({ kind, name, contact, body, user_id: s?.id ?? null });
  if (error) return { error: "접수에 실패했어요. 잠시 후 다시 시도해주세요" };
  revalidatePath("/admin");
  return { ok: "접수됐어요. 확인 후 적어주신 연락처로 답변드릴게요." };
}
export async function setInquiryStatus(id: number, status: "new" | "done") {
  await requireAdmin(); await db().from("inquiries").update({ status }).eq("id", id); revalidatePath("/admin");
}
export async function adminSetContactEmail(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin(); await db().from("settings").upsert({ key: "contact_email", value: clean(fd.get("email"), 80) });
  revalidatePath("/contact"); revalidatePath("/admin"); return { ok: "저장했어요" };
}

/* ---------- 푸시 알림 ---------- */
export async function savePushSub(sub: { endpoint: string; keys?: { p256dh: string; auth: string } }) {
  const u = await requireUser();
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;
  await db().from("push_subs").upsert({ endpoint: sub.endpoint, user_id: u.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
}
export async function adminBroadcast(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const title = clean(fd.get("title"), 40) || "메디화이트웹", body = clean(fd.get("body"), 140), url = clean(fd.get("url"), 200) || "/board";
  if (!body) return { error: "내용을 적어주세요" };
  await pushToAll({ title, body, url, tag: "broadcast" });
  return { ok: "보냈어요" };
}

/* ---------- 식물키우기 (서버가 규칙 판정) ---------- */
export type Plant = { kind: string; waters: number; lastWater: number; lastSun: number; planted: number; harvests: number; wilted: boolean };
const PLANT_STAGES = [0, 2, 5, 9, 14, 20]; // 씨앗·새싹·잎·꽃봉오리·개화·열매(수확)
const WATER_GAP = 3 * 3600 * 1000, SUN_GAP = 20 * 3600 * 1000, WILT_AFTER = 48 * 3600 * 1000;
function plantStage(p: Plant) { let st = 0; PLANT_STAGES.forEach((t, i) => { if (p.waters >= t) st = i; }); return st; }
export async function plantAction(action: "load" | "plant" | "water" | "sun" | "harvest", kind?: string): Promise<{ plant: Plant | null; stage: number; msg?: string; gained?: number }> {
  const u = await requireUser(); const s = db(); const now = Date.now();
  const { data } = await s.from("game_state").select("state").eq("user_id", u.id).eq("game", "plant").maybeSingle();
  let p = (data?.state as Plant | undefined) ?? null; let msg = "", gained = 0;
  const save = async () => { await s.from("game_state").upsert({ user_id: u.id, game: "plant", state: p as any, updated_at: new Date().toISOString() }); };
  if (action === "plant") { if (p && plantStage(p) < 5) return { plant: p, stage: plantStage(p), msg: "지금 키우는 화분을 먼저 수확하거나 끝까지 키워주세요" };
    p = { kind: ["알로에", "몬스테라", "선인장", "방울토마토"].includes(kind ?? "") ? kind! : "알로에", waters: 0, lastWater: 0, lastSun: 0, planted: now, harvests: p?.harvests ?? 0, wilted: false }; await save(); return { plant: p, stage: 0, msg: `${p.kind} 씨앗을 심었어요. 3시간마다 물을 주세요` }; }
  if (!p) return { plant: null, stage: 0 };
  if (p.lastWater && now - p.lastWater > WILT_AFTER && plantStage(p) < 5) p.wilted = true;
  if (action === "water") {
    if (plantStage(p) >= 5) return { plant: p, stage: 5, msg: "다 자랐어요! 수확하세요" };
    if (now - p.lastWater < WATER_GAP) { const m = Math.ceil((WATER_GAP - (now - p.lastWater)) / 60000); return { plant: p, stage: plantStage(p), msg: `아직 흙이 촉촉해요. ${Math.floor(m / 60)}시간 ${m % 60}분 뒤에 다시` }; }
    const before = plantStage(p); p.waters++; p.lastWater = now; p.wilted = false; const after = plantStage(p);
    if (after > before) { gained = await repeatXp(u.id, "plant"); msg = `쑥! ${["씨앗", "새싹", "잎", "꽃봉오리", "개화", "열매"][after]} 단계가 됐어요${gained ? ` (+${gained} XP)` : ""}`; } else msg = "물을 줬어요 💧";
    await save(); return { plant: p, stage: after, msg, gained };
  }
  if (action === "sun") {
    if (plantStage(p) >= 5) return { plant: p, stage: 5, msg: "다 자랐어요! 수확하세요" };
    if (now - p.lastSun < SUN_GAP) return { plant: p, stage: plantStage(p), msg: "햇빛은 하루에 한 번이에요" };
    const before = plantStage(p); p.waters++; p.lastSun = now; const after = plantStage(p);
    if (after > before) { gained = await repeatXp(u.id, "plant"); msg = `햇빛 쬐고 쑥! ${["씨앗", "새싹", "잎", "꽃봉오리", "개화", "열매"][after]} 단계${gained ? ` (+${gained} XP)` : ""}`; } else msg = "창가로 옮겨 햇빛을 쬐었어요 ☀️";
    await save(); return { plant: p, stage: after, msg, gained };
  }
  if (action === "harvest") {
    if (plantStage(p) < 5) return { plant: p, stage: plantStage(p), msg: "아직 열매가 안 열렸어요" };
    p.harvests++; const n = p.harvests; const g = await awardXp(u.id, n === 1 ? 300 : n === 3 ? 500 : 0, n === 1 ? "plant_harvest_1" : n === 3 ? "plant_harvest_3" : null, "quest");
    const g2 = await repeatXp(u.id, "plant"); gained = g + g2;
    const kindDone = p.kind; p = { kind: kindDone, waters: 0, lastWater: 0, lastSun: 0, planted: 0, harvests: n, wilted: false }; await save();
    return { plant: p, stage: 0, msg: `${kindDone} 수확! ${n}번째 수확이에요${gained ? ` (+${gained} XP)` : ""}. 새 씨앗을 심어보세요`, gained };
  }
  return { plant: p, stage: plantStage(p) };
}
