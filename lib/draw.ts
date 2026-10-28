"use server";
import { redirect } from "next/navigation";
import { db } from "./supabase";
import { getSession, type Session } from "./auth";
import { awardXp } from "./xp";
import { bump } from "./daily";
import { gameEvent } from "./feed";
import { display } from "./depts";

/** 그림 맞히기: 순서대로 한 명이 그리고 나머지가 채팅으로 맞혀요. 정답 확인은 서버에서. */
const ROUND_SEC = 80;
const WORDS = [
  "청진기", "주사기", "수액", "링거", "휠체어", "구급차", "들것", "체온계", "혈압계", "마스크", "붕대", "깁스", "엑스레이", "MRI", "CT", "알약", "캡슐", "반창고",
  "수술실", "응급실", "간호사", "의사", "약사", "환자복", "병상", "산소통", "심전도", "제세동기", "현미경", "시험관", "혈액", "치아", "뼈", "심장", "폐", "뇌", "눈", "귀",
  "야간근무", "인수인계", "콜벨", "회진", "커피", "컵라면", "삼각김밥", "도시락", "퇴근", "월급", "출근", "알람", "침대", "베개", "자판기", "엘리베이터", "계단",
  "고양이", "강아지", "토끼", "펭귄", "기린", "코끼리", "상어", "문어", "나비", "눈사람", "무지개", "우산", "자전거", "비행기", "로켓", "피자", "치킨", "아이스크림",
  "케이크", "수박", "바나나", "딸기", "햄버거", "떡볶이", "김밥", "축구", "농구", "기타", "피아노", "카메라", "핸드폰", "노트북", "시계", "안경", "모자", "신발", "선물",
];
type R = { error?: string } | undefined;
async function me(): Promise<Session> { const s = await getSession(); if (!s) redirect("/login"); return s; }
const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const norm = (t: string) => t.replace(/\s+/g, "").toLowerCase();

export type DrawState = {
  id: string; title: string; host: string | null; status: string; round: number; rounds_total: number; drawer: string | null;
  word: string | null; hint: string | null; round_end: string | null; scores: Record<string, number>; guessed: string[]; last_word: string | null;
  players: { user_id: string; nickname: string; dept: string }[];
};

export async function getDraw(id: string): Promise<DrawState | null> {
  const u = await me(); const s = db();
  const [{ data: r }, { data: ps }] = await Promise.all([s.from("draw_rooms").select("*").eq("id", id).maybeSingle(), s.from("draw_players").select("user_id,joined_at,u:users(nickname,dept)").eq("room_id", id).order("joined_at")]);
  if (!r) return null;
  const w: string | null = r.word;
  return {
    id: r.id, title: r.title, host: r.host, status: r.status, round: r.round, rounds_total: r.rounds_total, drawer: r.drawer, round_end: r.round_end, scores: r.scores ?? {}, guessed: r.guessed ?? [], last_word: r.last_word,
    word: r.drawer === u.id || (r.guessed ?? []).includes(u.id) ? w : null,
    hint: w ? `${"□".repeat(w.length)} (${w.length}글자)` : null,
    players: (ps ?? []).map((p: any) => ({ user_id: p.user_id, nickname: p.u?.nickname ?? "?", dept: p.u?.dept ?? "" })),
  };
}

export async function createDraw(_: R, fd: FormData): Promise<R> {
  const u = await me();
  const { data, error } = await db().from("draw_rooms").insert({ title: clean(fd.get("title"), 30) || `${u.nickname}님의 그림방`, host: u.id }).select("id").single();
  if (error || !data) return { error: "방을 만들지 못했어요" };
  await db().from("draw_players").insert({ room_id: data.id, user_id: u.id });
  redirect(`/games/draw/${data.id}`);
}
export async function joinDraw(id: string) {
  const u = await me(); const { count } = await db().from("draw_players").select("user_id", { count: "exact", head: true }).eq("room_id", id);
  if ((count ?? 0) >= 10) return { error: "방이 꽉 찼어요 (최대 10명)" };
  await db().from("draw_players").upsert({ room_id: id, user_id: u.id }); return {};
}
export async function leaveDraw(id: string) {
  const u = await me(); const s = db(); await s.from("draw_players").delete().eq("room_id", id).eq("user_id", u.id);
  const { data: left } = await s.from("draw_players").select("user_id").eq("room_id", id).order("joined_at");
  if (!left?.length) { await s.from("draw_rooms").delete().eq("id", id); return; }
  const { data: r } = await s.from("draw_rooms").select("host,drawer,status").eq("id", id).maybeSingle();
  if (r?.host === u.id) await s.from("draw_rooms").update({ host: left[0].user_id }).eq("id", id);
  if (r?.status === "playing" && (r.drawer === u.id || left.length < 2)) await nextRound(id, true);
}
const pick = (prev?: string | null) => { let w = WORDS[Math.floor(Math.random() * WORDS.length)]; if (w === prev) w = WORDS[(WORDS.indexOf(w) + 7) % WORDS.length]; return w; };

export async function startDraw(id: string) {
  const u = await me(); const st = await getDraw(id); if (!st || st.host !== u.id) return { error: "방장만 시작할 수 있어요" };
  if (st.players.length < 2) return { error: "2명 이상 있어야 해요" };
  const total = Math.min(10, st.players.length * 2);
  await db().from("draw_rooms").update({ status: "playing", round: 1, rounds_total: total, drawer: st.players[0].user_id, word: pick(), last_word: null, scores: {}, guessed: [], round_end: new Date(Date.now() + ROUND_SEC * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  return {};
}

/** 다음 라운드 (시간 끝 / 모두 맞힘 / 그리는 사람 나감). 같은 라운드에서 한 번만 넘어가게 round 조건으로 업데이트 */
export async function nextRound(id: string, force = false) {
  await me(); const s = db();
  const { data: r } = await s.from("draw_rooms").select("*").eq("id", id).maybeSingle(); if (!r || r.status !== "playing") return;
  const { data: ps } = await s.from("draw_players").select("user_id").eq("room_id", id).order("joined_at"); const ids = (ps ?? []).map(p => p.user_id);
  const allGuessed = ids.filter(x => x !== r.drawer).every(x => (r.guessed ?? []).includes(x));
  if (!force && !allGuessed && Date.now() < new Date(r.round_end).getTime() - 500) return;
  if (r.round >= r.rounds_total || ids.length < 2) {
    const { data: ended } = await s.from("draw_rooms").update({ status: "done", last_word: r.word, word: null, round_end: null, updated_at: new Date().toISOString() }).eq("id", id).eq("round", r.round).eq("status", "playing").select("id");
    if (!ended?.length) return;
    const sc: Record<string, number> = r.scores ?? {}; const top = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] > 0) { await awardXp(top[0], 100, "draw_win_1"); const { data: w } = await s.from("users").select("dept,nickname").eq("id", top[0]).maybeSingle(); if (w) await gameEvent(`${display(w.dept, w.nickname)}님이 그림 맞히기 ${ids.length}명 중 1등! (${top[1]}점)`); }
    await Promise.all(ids.map(x => bump(x, "game")));
    return;
  }
  const di = ids.indexOf(r.drawer), next = ids[(di + 1) % ids.length];
  await s.from("draw_rooms").update({ round: r.round + 1, drawer: next, last_word: r.word, word: pick(r.word), guessed: [], round_end: new Date(Date.now() + ROUND_SEC * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("round", r.round);
}

export async function guessDraw(id: string, text: string) {
  const u = await me(); const s = db();
  const { data: r } = await s.from("draw_rooms").select("*").eq("id", id).maybeSingle();
  if (!r || r.status !== "playing" || r.drawer === u.id || (r.guessed ?? []).includes(u.id)) return { correct: false };
  if (!r.word || norm(clean(text, 40)) !== norm(r.word)) return { correct: false };
  const left = Math.max(0, (new Date(r.round_end).getTime() - Date.now()) / 1000), order = (r.guessed ?? []).length;
  const sc: Record<string, number> = { ...(r.scores ?? {}) };
  sc[u.id] = (sc[u.id] ?? 0) + 10 + Math.round(left / 8) + Math.max(0, 5 - order * 2);
  sc[r.drawer] = (sc[r.drawer] ?? 0) + 5;
  await s.from("draw_rooms").update({ scores: sc, guessed: [...(r.guessed ?? []), u.id], updated_at: new Date().toISOString() }).eq("id", id).eq("round", r.round);
  return { correct: true };
}
export async function rematchDraw(id: string) {
  const u = await me(); const st = await getDraw(id); if (!st || st.status !== "done" || !st.players.some(p => p.user_id === u.id)) return;
  await db().from("draw_rooms").update({ status: "waiting", round: 0, scores: {}, guessed: [], word: null, drawer: null, round_end: null, updated_at: new Date().toISOString() }).eq("id", id);
}
/** 방장: 게임 중단 → 대기실로 */
export async function stopDraw(id: string) {
  const u = await me(); const { data: r } = await db().from("draw_rooms").select("host,status").eq("id", id).maybeSingle();
  if (!r || r.host !== u.id || r.status !== "playing") return { error: "방장만 중단할 수 있어요" };
  await db().from("draw_rooms").update({ status: "waiting", round: 0, guessed: [], word: null, drawer: null, round_end: null, updated_at: new Date().toISOString() }).eq("id", id); return {};
}
/** 그리는 사람(또는 방장): 이번 제시어 패스 → 다음 차례 */
export async function skipDraw(id: string) {
  const u = await me(); const { data: r } = await db().from("draw_rooms").select("host,drawer,status").eq("id", id).maybeSingle();
  if (!r || r.status !== "playing" || (r.drawer !== u.id && r.host !== u.id)) return { error: "그리는 사람만 패스할 수 있어요" };
  await nextRound(id, true); return {};
}
