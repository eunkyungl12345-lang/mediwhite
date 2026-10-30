"use server";
import { db } from "./supabase";
import { getSession } from "./auth";
import { awardXp } from "./xp";
import { gameEvent } from "./feed";
import { answerFor, kstDay, marks, puzzleNo } from "./wordle";
import { revalidatePath } from "next/cache";

async function me() { const s = await getSession(); if (!s) throw new Error("로그인이 필요해요"); return s; }
const who = (s: { dept: string; nickname: string }) => `[${s.dept}]${s.nickname}`;

/* ---------- 오늘의 메디워들 ---------- */
export type WordleState = { no: number; day: string; guesses: string[]; marks: string[]; done: boolean; won: boolean; answer?: string; meaning?: string; xp?: number; error?: string; solvers: number };
async function wordleRow(uid: string, day: string) {
  const { data } = await db().from("daily_plays").select("data,attempts,best").eq("user_id", uid).eq("game", "wordle").eq("day", day).maybeSingle();
  return (data?.data ?? { guesses: [], marks: [], done: false, won: false }) as { guesses: string[]; marks: string[]; done: boolean; won: boolean; xp?: number };
}
async function wordleView(day: string, st: { guesses: string[]; marks: string[]; done: boolean; won: boolean; xp?: number }): Promise<WordleState> {
  const { count } = await db().from("daily_plays").select("user_id", { count: "exact", head: true }).eq("game", "wordle").eq("day", day).gt("best", 0);
  const [a, m] = answerFor(day);
  return { no: puzzleNo(day), day, ...st, solvers: count ?? 0, ...(st.done ? { answer: a, meaning: m } : {}) };
}
export async function wordleLoad(): Promise<WordleState> {
  const s = await me(), day = kstDay();
  return wordleView(day, await wordleRow(s.id, day));
}
export async function wordleGuess(raw: string): Promise<WordleState> {
  const s = await me(), day = kstDay(), guess = String(raw ?? "").toUpperCase().replace(/[^A-Z]/g, "");
  const st = await wordleRow(s.id, day);
  if (st.done) return wordleView(day, st);
  if (guess.length !== 5) return { ...(await wordleView(day, st)), error: "영어 5글자를 입력해 주세요" };
  if (st.guesses.includes(guess)) return { ...(await wordleView(day, st)), error: "이미 넣어본 단어예요" };
  const [ans] = answerFor(day), mk = marks(guess, ans);
  st.guesses.push(guess); st.marks.push(mk);
  if (mk === "ggggg") { st.done = true; st.won = true; } else if (st.guesses.length >= 6) st.done = true;
  if (st.done) {
    const n = st.guesses.length, xp = st.won ? [300, 250, 200, 150, 120, 100][n - 1] : 30;
    st.xp = await awardXp(s.id, xp, `wordle:${day}`, "daily");
    if (st.won && n <= 3 && !/^zz_/.test(s.username)) await gameEvent(`${who(s)}님이 오늘의 메디워들을 ${n}번 만에 맞혔어요! 🟩`);
  }
  await db().from("daily_plays").upsert({ user_id: s.id, game: "wordle", day, attempts: st.guesses.length, best: st.won ? 7 - st.guesses.length : 0, data: st, updated_at: new Date().toISOString() });
  if (st.done) revalidatePath("/rank");
  return wordleView(day, st);
}

/* ---------- 원샷원킬 IV (하루 3번) ---------- */
const IV_TRIES = 3;
export type IvRow = { name: string; best: number; me?: boolean };
export type IvState = { day: string; attempts: number; best: number; today: IvRow[]; myRank: number | null; total: number; yesterday: IvRow[] };
async function ivBoard(day: string, uid: string) {
  const { data } = await db().from("daily_plays").select("user_id,best,users(nickname,dept,username)").eq("game", "iv").eq("day", day).gt("best", 0).order("best", { ascending: false }).limit(200);
  const rows = (data ?? []).filter((r: any) => !/^zz_/.test(r.users?.username ?? "") || r.user_id === uid);
  return rows.map((r: any) => ({ uid: r.user_id as string, name: r.users ? `[${r.users.dept}]${r.users.nickname}` : "?", best: Number(r.best) }));
}
/** 어제 1~3등에게 명사수 보상 (처음 본 사람이 지급, 중복 X) */
async function settleYesterday() {
  const y = kstDay(-1); const rows = await ivBoard(y, "");
  for (const [i, r] of rows.slice(0, 3).entries()) { const got = await awardXp(r.uid, [300, 200, 100][i], `iv_top:${y}`, "daily"); if (got && i === 0) await gameEvent(`🎯 어제의 명사수 1등: ${r.name}님 (${r.best.toLocaleString()}점)!`); }
  return rows.slice(0, 3).map(r => ({ name: r.name, best: r.best }));
}
export async function ivLoad(): Promise<IvState> {
  const s = await me(), day = kstDay();
  const [{ data: mine }, rows, yesterday] = await Promise.all([db().from("daily_plays").select("attempts,best").eq("user_id", s.id).eq("game", "iv").eq("day", day).maybeSingle(), ivBoard(day, s.id), settleYesterday()]);
  const idx = rows.findIndex(r => r.uid === s.id);
  return { day, attempts: mine?.attempts ?? 0, best: Number(mine?.best ?? 0), today: rows.slice(0, 10).map(r => ({ name: r.name, best: r.best, me: r.uid === s.id })), myRank: idx >= 0 ? idx + 1 : null, total: rows.length, yesterday };
}
export async function ivSubmit(score: number): Promise<IvState & { error?: string; xp?: number }> {
  const s = await me(), day = kstDay();
  const v = Math.max(0, Math.min(9999, Math.round(Number(score) || 0)));
  const { data: cur } = await db().from("daily_plays").select("attempts,best").eq("user_id", s.id).eq("game", "iv").eq("day", day).maybeSingle();
  if ((cur?.attempts ?? 0) >= IV_TRIES) return { ...(await ivLoad()), error: "오늘 도전 3번을 다 썼어요. 자정에 다시 열려요!" };
  const best = Math.max(Number(cur?.best ?? 0), v);
  await db().from("daily_plays").upsert({ user_id: s.id, game: "iv", day, attempts: (cur?.attempts ?? 0) + 1, best, data: {}, updated_at: new Date().toISOString() });
  const xp = await awardXp(s.id, 30, `iv_play:${day}`, "daily");
  const st = await ivLoad();
  if (st.myRank === 1 && v === best && st.total >= 3 && !/^zz_/.test(s.username)) await gameEvent(`🎯 ${who(s)}님이 원샷원킬 IV 오늘 1등! (${v.toLocaleString()}점)`);
  return { ...st, xp };
}
