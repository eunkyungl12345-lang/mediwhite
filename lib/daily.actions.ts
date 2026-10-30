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
  if (st.done) { await missionAll(s.id, day); revalidatePath("/rank"); }
  return wordleView(day, st);
}

/* ---------- 오늘의 데일리 미션 ---------- */
const MISSION_XP = 30, MISSION_ALL = 100;
/** 룰렛·퀴즈처럼 기록이 따로 없는 게임의 '오늘 했음' 표시 + 미션 XP */
export async function missionMark(game: "roulette" | "quiz") {
  const s = await me(); const day = kstDay();
  const { data: cur } = await db().from("daily_plays").select("attempts").eq("user_id", s.id).eq("game", game).eq("day", day).maybeSingle();
  await db().from("daily_plays").upsert({ user_id: s.id, game, day, attempts: (cur?.attempts ?? 0) + 1, best: 1, data: {}, updated_at: new Date().toISOString() });
  let xp = cur ? 0 : await awardXp(s.id, MISSION_XP, `mission:${game}:${day}`, "daily");
  xp += await missionAll(s.id, day);
  return xp;
}
async function missionAll(uid: string, day: string) {
  const { data } = await db().from("daily_plays").select("game").eq("user_id", uid).eq("day", day).in("game", ["wordle", "roulette", "quiz"]);
  return (data ?? []).length >= 3 ? await awardXp(uid, MISSION_ALL, `mission_all:${day}`, "daily") : 0;
}
