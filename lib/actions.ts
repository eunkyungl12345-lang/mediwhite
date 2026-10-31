"use server";
import { gameEvent } from "./feed";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "./supabase";
import { createSession, getSession, clearSession, type Session } from "./auth";
import { DEPTS, CATS, NOTICE_CAT, EMOJIS, TOPICS, SSUM_CAT, SSUM_TOPICS, ANON_CAT, ANON_TOPICS, VENDOR_FIELDS } from "./depts";
import { bump } from "./daily";
import { validRoom } from "./chatRooms";
import { personMention, placeMention, REPORT_REASONS } from "./safety";
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
  const dept = clean(fd.get("dept"), 30), field = clean(fd.get("field"), 20);
  const ref = clean(fd.get("ref"), 20).toLowerCase() || cookies().get("mw_ref")?.value || null;
  if (fd.get("agree") !== "on") return { error: "커뮤니티 규칙에 동의해주세요" };
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { error: "아이디는 영문 소문자·숫자·밑줄 3~20자예요" };
  if (password.length < 4) return { error: "비밀번호는 4자 이상이에요" };
  if (!nickname) return { error: "닉네임을 입력해주세요" };
  if (!(DEPTS as readonly string[]).includes(dept)) return { error: "직종을 선택해주세요" };
  if (dept === "업체" && !(VENDOR_FIELDS as readonly string[]).includes(field)) return { error: "업체 분야를 선택해주세요" };
  const s = db();
  const { data: exists } = await s.from("users").select("id").eq("username", username).maybeSingle();
  if (exists) return { error: "이미 쓰는 아이디예요" };
  const role = admins().includes(username) ? "admin" : "member";
  const { count } = await s.from("users").select("id", { count: "exact", head: true }).eq("stealth", false);
  const order = (count ?? 0) + 1;
  const { data, error } = await s.from("users").insert({ username, password_hash: await bcrypt.hash(password, 10), nickname, dept, field: dept === "업체" ? field : null, role, join_order: order, referred_by: ref && ref !== username ? ref : null }).select("id").single();
  if (error || !data) return { error: "가입에 실패했어요. 잠시 후 다시 시도해주세요" };
  await awardXp(data.id, signupBonus(order), "signup", "signup");
  if (ref && ref !== username) { const { data: r } = await s.from("users").select("id").eq("username", ref).maybeSingle(); if (r) await repeatXp(r.id, "referral"); }
  await createSession({ id: data.id, username, nickname, dept, role });
  redirect("/home");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = clean(fd.get("username"), 20).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const { data: u } = await db().from("users").select("*").eq("username", username).maybeSingle();
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return { error: "아이디 또는 비밀번호가 맞지 않아요" };
  const role = u.role === "admin" || admins().includes(username) ? "admin" : "member";
  await createSession({ id: u.id, username, nickname: u.nickname, dept: u.dept, role });
  redirect("/home");
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
export async function sendMessage(text: string, room = "all") {
  const u = await requireUser();
  const t = text.trim().slice(0, 500); if (!t) return null;
  if (!validRoom(room, u.dept)) room = "all";
  const s = db();
  const { data: me } = await s.from("users").select("xp").eq("id", u.id).maybeSingle();
  let ri = rankOf(me?.xp ?? 0).index;
  if (ri >= RANKS.length - 1) ri = (await myRank(u.id)).index; // 참모총장 후보만 파트 1위 확인
  const { data } = await s.from("messages").insert({ user_id: u.id, nickname: u.nickname, dept: u.dept, text: t, rank: String(ri), room }).select("id,nickname,dept,text,created_at,user_id,rank").single();
  // 경험치는 응답 뒤로 미루지 않고 병렬로 (한 번의 DB 함수 호출씩)
  await Promise.all([awardXp(u.id, 50, "first_chat"), repeatXp(u.id, "chat"), bump(u.id, "chat")]);
  const mentions = Array.from(t.matchAll(/@([^\s@\[\]]{1,12})/g)).map(m => m[1]);
  if (mentions.length) { const { data: targets } = await s.from("users").select("id").in("nickname", mentions).neq("id", u.id); if (targets?.length) pushToUsers(targets.map(x => x.id), { title: "채팅에서 나를 불렀어요", body: `[${u.dept}]${u.nickname}: ${t.slice(0, 60)}`, url: "/board", tag: "mention" }).catch(() => {}); }
  return data;
}

/* ---------- 게시판 ---------- */
export async function createPost(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const category = clean(fd.get("category"), 30), title = clean(fd.get("title"), 80), body = clean(fd.get("body"), 4000);
  const boardId = clean(fd.get("board_id"), 40) || null;
  const topicRaw = clean(fd.get("topic"), 20);
  const topic = category === SSUM_CAT ? (SSUM_TOPICS.some(t => t.key === topicRaw) ? topicRaw : "moment") : category === ANON_CAT ? (ANON_TOPICS.some(t => t.key === topicRaw) ? topicRaw : "free") : (TOPICS.some(t => t.key === topicRaw) ? topicRaw : "free");
  if (!(CATS as readonly string[]).includes(category) && category !== SSUM_CAT && category !== ANON_CAT) return { error: "칸을 선택해주세요" };
  if (category === NOTICE_CAT && u.role !== "admin" && !can(await myRank(u.id), "준장")) return { error: "공지 칸은 준장 이상만 쓸 수 있어요" };
  if (!title || !body) return { error: "제목과 내용을 적어주세요" };
  const pm = personMention(title + " " + body);
  const plm = category === SSUM_CAT ? placeMention(title + " " + body) : null;
  if (plm) return { error: `"${plm}" — 초성은 괜찮지만, 병원명(초성 포함)·병동·층·부서는 쓸 수 없어요. 누군지 특정될 수 있으니 빼고 올려주세요 💘` };
  if (pm && category === SSUM_CAT) return { error: `"${pm}" — 썸 글엔 실명을 쓸 수 없어요. 초성(예: ㄱㅁㅈ 쌤)으로 바꿔서 써주세요 💘` };
  if (category === ANON_CAT) { const plm2 = placeMention(title + " " + body); if (plm2) return { error: `"${plm2}" — 익명 게시판이라도 병원명·병동·층은 쓸 수 없어요. 누군지 특정될 수 있어요.` }; if (pm) return { error: `"${pm}" — 익명 게시판엔 실명을 쓸 수 없어요. 익명은 서로 지켜줘야 유지돼요 🕶️` }; }
  if (pm && fd.get("confirm_anon") !== "on") return { error: `"${pm}" — 특정 개인을 가리키는 표현 같아요. 실명·식별 정보가 없다면 아래 확인에 체크하고 다시 올려주세요.` };
  const s = db();
  if (boardId) { const { data: b } = await s.from("boards").select("dept").eq("id", boardId).maybeSingle(); if (!b || b.dept !== category) return { error: "탭이 맞지 않아요" }; }
  const { data, error } = await s.from("posts").insert({ author_id: u.id, category, dept: category === ANON_CAT ? null : u.dept, title, body, board_id: boardId, topic }).select("id").single();
  if (error || !data) return { error: "올리지 못했어요" };
  await Promise.all([awardXp(u.id, 100, "first_post"), repeatXp(u.id, "post"), bump(u.id, "write")]);
  if (category === ANON_CAT) { revalidatePath("/anon"); redirect(`/anon/${data.id}`); }
  revalidatePath("/board"); redirect(`/board/${data.id}`);
}
export async function addComment(postId: string, text: string) {
  const u = await requireUser();
  const t = text.trim().slice(0, 500); if (!t) return;
  const s = db();
  const { data: post0 } = await s.from("posts").select("author_id,title,category").eq("id", postId).maybeSingle();
  const anon = post0?.category === ANON_CAT;
  if (anon) { const pm = personMention(t); if (pm) return; }
  await s.from("comments").insert({ post_id: postId, author_id: u.id, dept: anon ? null : u.dept, text: t });
  const [{ data: post }] = await Promise.all([Promise.resolve({ data: post0 }), awardXp(u.id, 50, "first_comment"), repeatXp(u.id, "comment"), bump(u.id, "write")]);
  if (post?.author_id && post.author_id !== u.id) pushToUsers([post.author_id], anon ? { title: "🕶️ 익명 글에 댓글", body: t.slice(0, 60), url: `/anon/${postId}`, tag: `c-${postId}` } : { title: "내 글에 댓글", body: `[${u.dept}]${u.nickname}: ${t.slice(0, 60)}`, url: `/board/${postId}`, tag: `c-${postId}` }).catch(() => {});
  revalidatePath(anon ? `/anon/${postId}` : `/board/${postId}`);
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

/* ---------- 게임 ---------- */
export async function saveScore(game: "dodge" | "sword" | "defense" | "bowling" | "cpr" | "quiz" | "vein" | "runner" | "lightning" | "tycoon" | "trivia" | "econ" | "apoc", value: number, mode?: string) {
  const u = await requireUser();
  if (!Number.isFinite(value) || value < 0) return;
  await bump(u.id, "game");
  const s = db();
  if (game === "dodge") { for (const [th, xp] of [[10, 100], [20, 200], [30, 400]] as const) if (value >= th) await awardXp(u.id, xp, `dodge_${th}`); }
  if (game === "lightning") { const cleared = Math.floor(value / 10); for (const [th, xp] of [[10, 150], [25, 400]] as const) if (cleared >= th) await awardXp(u.id, xp, `lightning_${th}`); }
  if (game === "runner") { for (const [th, xp] of [[700, 150], [1500, 400]] as const) if (value >= th) await awardXp(u.id, xp, `runner_${th}`); }
  if (game === "cpr") { for (const [th, xp] of [[600, 150], [900, 400]] as const) if (value >= th) await awardXp(u.id, xp, `cpr_${th}`); }
  if (game === "trivia" || game === "econ") { for (const [th, xp] of [[300, 150], [500, 400]] as const) if (value >= th) await awardXp(u.id, xp, `${game}_${th}`); }
  if (game === "quiz" || game === "trivia" || game === "econ") { const day = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); const { data: q0 } = await s.from("daily_plays").select("attempts").eq("user_id", u.id).eq("game", "quiz").eq("day", day).maybeSingle(); await s.from("daily_plays").upsert({ user_id: u.id, game: "quiz", day, attempts: (q0?.attempts ?? 0) + 1, best: 1, data: {}, updated_at: new Date().toISOString() }); if (!q0) await awardXp(u.id, 30, `mission:quiz:${day}`, "daily"); const { data: all } = await s.from("daily_plays").select("game").eq("user_id", u.id).eq("day", day).in("game", ["wordle", "roulette", "quiz"]); if ((all ?? []).length >= 3) await awardXp(u.id, 100, `mission_all:${day}`, "daily"); }
  if (game === "quiz") { for (const [th, xp] of [[300, 150], [500, 400]] as const) if (value >= th) await awardXp(u.id, xp, `quiz_${th}`); }
  if (game === "vein") { for (const [th, xp] of [[500, 150], [800, 400]] as const) if (value >= th) await awardXp(u.id, xp, `vein_${th}`); }
  if (game === "bowling") { for (const [th, xp] of [[100, 100], [150, 250], [200, 500]] as const) if (value >= th) await awardXp(u.id, xp, `bowling_${th}`); }
  if (game === "apoc") { for (const [th, xp] of [[3, 150], [7, 400], [12, 800]] as const) if (value >= th) await awardXp(u.id, xp, `apoc_${th}`); }
  if (game === "defense") { for (const [th, xp] of [[5, 150], [10, 400], [20, 800]] as const) if (value >= th) await awardXp(u.id, xp, `defense_${th}`); }
  if (game === "sword") { for (const [th, xp] of [[5, 100], [10, 300], [15, 700]] as const) if (value >= th) await awardXp(u.id, xp, `sword_${th}`); }
  if (game === "tycoon") { for (const [th, xp, k] of [[1e6, 150, "100m"], [1e7, 400, "1000m"], [1e8, 800, "1eok"]] as const) if (value >= th) await awardXp(u.id, xp, `tycoon_${k}`); }
  const { data: cur } = await s.from("scores").select("value").eq("user_id", u.id).eq("game", game).maybeSingle();
  if (cur && Number(cur.value) >= value) return;
  await s.from("scores").upsert({ user_id: u.id, game, value, mode: mode ?? null, updated_at: new Date().toISOString() });
  { const who = u.nickname ? `[${u.dept}]${u.nickname}` : "누군가";
    if (game === "apoc" && value >= 5 && value % 5 === 0) await gameEvent(`${who}님이 병원묵시록에서 ${value}일 생존! 🧟`);
    if (game === "sword" && value >= 15) await gameEvent(`${who}님이 검 +${value} 강화 성공! ⚔️`);
    if (game === "defense" && value % 5 === 0) await gameEvent(`${who}님이 병동사수 ${Math.ceil(value / 10)}-${((value - 1) % 10) + 1} 보스 스테이지 클리어! 🛡️`); }
  revalidatePath("/games"); revalidatePath("/rank");
}
/** 병동 사수 데일리 챌린지 보상(하루 1회, KST) */
export async function defenseDaily(day: string) {
  const u = await requireUser();
  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  if (day !== today) return 0;
  const xp = await awardXp(u.id, 100, `defense_daily:${today}`, "daily");
  if (xp) await db().from("events").insert({ kind: "quest", user_id: u.id, text: `병동 사수 오늘의 챌린지 클리어|${xp}|defense_daily` });
  return xp;
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
  bump(u.id, "game").catch(() => {});
  // 병원 키우기: 누적 매출(total)은 줄어들 수 없어요. 예전 숫자를 든 다른 탭·기기가 덮어쓰는 걸 막음
  if (game === "tycoon") {
    const { data: cur } = await db().from("game_state").select("state").eq("user_id", u.id).eq("game", "tycoon").maybeSingle();
    const ct = Number((cur?.state as any)?.total ?? 0), nt = Number((state as any).total ?? 0), sameV = (cur?.state as any)?.v === (state as any).v;
    if (sameV && nt + 1 < ct) return { stale: true };
  }
  await db().from("game_state").upsert({ user_id: u.id, game, state, updated_at: new Date().toISOString() });
  return { ok: true };
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
  if (action === "water") { bump(u.id, "game").catch(() => {});
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

/* ---------- 사용법 투어 ---------- */
export async function markOnboarded() {
  const u = await requireUser();
  await db().from("users").update({ onboarded: true }).eq("id", u.id);
}

/* ---------- 공감 ---------- */
/** 토글: 같은 이모지면 취소, 다른 이모지면 교체. 글/댓글 작성자에게 경험치(하루 한도). */
export async function toggleReaction(kind: "post" | "comment", targetId: string, emoji: string) {
  const u = await requireUser();
  if (!(EMOJIS as readonly string[]).includes(emoji)) return null;
  const s = db();
  const { data: cur } = await s.from("reactions").select("emoji").eq("user_id", u.id).eq("kind", kind).eq("target_id", targetId).maybeSingle();
  if (cur?.emoji === emoji) { await s.from("reactions").delete().eq("user_id", u.id).eq("kind", kind).eq("target_id", targetId); }
  else {
    await s.from("reactions").upsert({ user_id: u.id, kind, target_id: targetId, emoji });
    if (!cur) { const { data: t } = await s.from(kind === "post" ? "posts" : "comments").select("author_id").eq("id", targetId).maybeSingle(); if (t?.author_id && t.author_id !== u.id) repeatXp(t.author_id, "liked").catch(() => {}); }
  }
  const { data: all } = await s.from("reactions").select("emoji,user_id").eq("kind", kind).eq("target_id", targetId);
  const counts: Record<string, number> = {}; let mine: string | null = null;
  for (const r of all ?? []) { counts[r.emoji] = (counts[r.emoji] ?? 0) + 1; if (r.user_id === u.id) mine = r.emoji; }
  return { counts, mine };
}

/* ---------- 신고·임시조치 (정보통신망법 44조의2) ---------- */
const REPORT_TABLE: Record<string, string> = { post: "posts", comment: "comments", job: "jobs", review: "hospital_reviews" };
const REPORT_LABEL: Record<string, string> = { post: "글", comment: "댓글", job: "채용공고", review: "병원 리뷰" };
export async function reportContent(kind: "post" | "comment" | "job" | "review", targetId: string, reason: string, detail: string) {
  const u = await requireUser();
  if (!REPORT_REASONS.some(r => r[0] === reason)) return { error: "사유를 골라주세요" };
  const s = db(), table = REPORT_TABLE[kind] ?? "posts", ownerCol = kind === "review" ? "user_id" : "author_id";
  const { data: t } = await s.from(table).select(`id,${ownerCol},hidden`).eq("id", targetId).maybeSingle() as any;
  if (!t) return { error: "대상이 없어요" };
  if (t[ownerCol] === u.id) return { error: "내 글은 신고할 수 없어요(삭제하세요)" };
  const { data: dup } = await s.from("reports").select("id").eq("kind", kind).eq("target_id", targetId).eq("reporter_id", u.id).eq("status", "open").maybeSingle();
  if (dup) return { error: "이미 신고했어요. 운영팀이 확인 중이에요" };
  await s.from("reports").insert({ kind, target_id: targetId, reporter_id: u.id, reason, detail: clean(detail, 500) || null });
  // 임시조치: 신고 즉시 블라인드(최대 30일), 운영팀 판단 후 복구/삭제
  if (!t.hidden) await s.from(table).update({ hidden: true, hidden_at: new Date().toISOString() }).eq("id", targetId);
  const { data: admins } = await s.from("users").select("id").eq("role", "admin");
  if (admins?.length) pushToUsers(admins.map(a => a.id), { title: "🚨 신고 접수", body: `${REPORT_LABEL[kind] ?? "글"} 신고 · ${REPORT_REASONS.find(r => r[0] === reason)?.[1]}`, url: "/admin", tag: "report" }).catch(() => {});
  revalidatePath("/board"); if (kind === "post") revalidatePath(`/board/${targetId}`); if (kind === "job") revalidatePath(`/jobs/${targetId}`); if (kind === "review") revalidatePath("/hospitals");
  return { ok: true };
}
export async function resolveReport(id: number, action: "restore" | "delete") {
  await requireAdmin();
  const s = db();
  const { data: r } = await s.from("reports").select("kind,target_id").eq("id", id).maybeSingle(); if (!r) return;
  const table = REPORT_TABLE[r.kind] ?? "comments";
  if (action === "delete") await s.from(table).delete().eq("id", r.target_id);
  else await s.from(table).update({ hidden: false, hidden_at: null }).eq("id", r.target_id);
  await s.from("reports").update({ status: action === "delete" ? "deleted" : "restored", resolved_at: new Date().toISOString() }).eq("kind", r.kind).eq("target_id", r.target_id).eq("status", "open");
  revalidatePath("/admin"); revalidatePath("/board");
}

/* ---------- 채팅방 ---------- */
export async function loadRoom(room: string) {
  const u = await requireUser(); if (!validRoom(room, u.dept)) room = "all";
  const { data } = await db().from("messages").select("id,nickname,dept,text,created_at,user_id,rank").eq("room", room).order("created_at", { ascending: false }).limit(40);
  return (data ?? []).reverse();
}
export async function adminSetChatRooms(on: boolean) {
  await requireAdmin(); await db().from("settings").upsert({ key: "chat_rooms", value: on ? "on" : "off" });
  revalidatePath("/admin"); revalidatePath("/home");
}
/** 동시 접속 최고치 기록 (요금제 업그레이드 시점 판단용) */
export async function reportOnline(n: number) {
  const u = await getSession(); if (!u || !Number.isInteger(n) || n < 1 || n > 100000) return;
  const day = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), s = db();
  const { data } = await s.from("online_peaks").select("peak").eq("day", day).maybeSingle();
  if (!data) await s.from("online_peaks").insert({ day, peak: n }); else if (n > data.peak) await s.from("online_peaks").update({ peak: n, at: new Date().toISOString() }).eq("day", day);
}

/** 병원 키우기 지급금(관리자가 넣어둔 돈) 받기: 열려 있는 게임 화면이 덮어쓰지 않도록 따로 보관했다가 게임이 가져감 */
export async function claimTycoonGrant() {
  const u = await requireUser(); const s = db();
  const { data } = await s.from("game_state").select("state").eq("user_id", u.id).eq("game", "tycoon_grant").maybeSingle();
  const amt = Number((data?.state as any)?.amount ?? 0);
  if (!amt) return 0;
  await s.from("game_state").delete().eq("user_id", u.id).eq("game", "tycoon_grant");
  return amt;
}

/* ---------- 오늘의 운세용 정보 (본인만 보임) ---------- */
export async function saveBirth(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const name = clean(fd.get("fortune_name"), 20), date = String(fd.get("birth_date") ?? ""), time = String(fd.get("birth_time") ?? "");
  if (fd.get("clear")) { await db().from("users").update({ fortune_name: null, birth_date: null, birth_time: null }).eq("id", u.id); revalidatePath("/fortune"); return { ok: "지웠어요" }; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "생년월일을 입력해주세요" };
  const y = Number(date.slice(0, 4)); if (y < 1920 || y > new Date().getFullYear()) return { error: "생년월일을 다시 확인해주세요" };
  await db().from("users").update({ fortune_name: name || null, birth_date: date, birth_time: /^\d{2}:\d{2}$/.test(time) ? time : null }).eq("id", u.id);
  revalidatePath("/fortune"); revalidatePath("/home");
  return { ok: "저장했어요! 오늘의 운세가 매일 자동으로 바뀌어요 🔮" };
}
