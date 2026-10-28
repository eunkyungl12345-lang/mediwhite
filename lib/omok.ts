"use server";
import { gameEvent } from "@/lib/feed";
import { display } from "@/lib/depts";
import { redirect } from "next/navigation";
import { db } from "./supabase";
import { getSession, type Session } from "./auth";
import { awardXp } from "./xp";
import { bump } from "./daily";

/** 온라인 오목: 15x15, 흑 선. 팀전은 같은 팀끼리 들어온 순서대로 번갈아 둬요. 모든 수는 서버가 검증. */
const N = 15, TURN_SEC = 30;
type R = { error?: string } | undefined;
async function me(): Promise<Session> { const s = await getSession(); if (!s) redirect("/login"); return s; }
const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export type OmokState = {
  id: string; title: string; bet: string | null; per_team: number; status: string; board: string; turn: string; idx_b: number; idx_w: number;
  deadline: string | null; last_move: number | null; winner: string | null; host: string | null;
  players: { user_id: string; team: string; nickname: string; dept: string; joined_at: string }[];
};

export async function getOmok(id: string): Promise<OmokState | null> {
  await me(); const s = db();
  const [{ data: r }, { data: ps }] = await Promise.all([
    s.from("omok_rooms").select("*").eq("id", id).maybeSingle(),
    s.from("omok_players").select("user_id,team,joined_at,u:users(nickname,dept)").eq("room_id", id).order("joined_at"),
  ]);
  if (!r) return null;
  return { ...(r as any), players: (ps ?? []).map((p: any) => ({ user_id: p.user_id, team: p.team, joined_at: p.joined_at, nickname: p.u?.nickname ?? "?", dept: p.u?.dept ?? "" })) };
}

export async function createOmok(_: R, fd: FormData): Promise<R> {
  const u = await me();
  const title = clean(fd.get("title"), 30) || `${u.nickname}님의 오목방`, bet = clean(fd.get("bet"), 40) || null;
  const per = Math.max(1, Math.min(5, Number(fd.get("per_team")) || 1));
  const { data, error } = await db().from("omok_rooms").insert({ title, bet, per_team: per, host: u.id }).select("id").single();
  if (error || !data) return { error: "방을 만들지 못했어요" };
  await db().from("omok_players").insert({ room_id: data.id, user_id: u.id, team: "b" });
  redirect(`/games/omok/${data.id}`);
}

export async function joinOmok(id: string, team: "b" | "w") {
  const u = await me(); const st = await getOmok(id); if (!st) return { error: "방이 없어요" };
  if (st.status === "playing" && !st.players.some(p => p.user_id === u.id)) return { error: "이미 게임 중이에요" };
  if (st.players.filter(p => p.team === team && p.user_id !== u.id).length >= st.per_team) return { error: "그 팀은 꽉 찼어요" };
  if (st.status === "playing") return { error: "게임 중엔 팀을 바꿀 수 없어요" };
  await db().from("omok_players").upsert({ room_id: id, user_id: u.id, team, joined_at: new Date().toISOString() });
  await touch(id); return {};
}

export async function leaveOmok(id: string) {
  const u = await me(); const s = db(); const st = await getOmok(id); if (!st) return;
  await s.from("omok_players").delete().eq("room_id", id).eq("user_id", u.id);
  const left = st.players.filter(p => p.user_id !== u.id);
  if (!left.length) { await s.from("omok_rooms").delete().eq("id", id); return; }
  const patch: any = { updated_at: new Date().toISOString() };
  if (st.host === u.id) patch.host = left[0].user_id;
  if (st.status === "playing") { const mine = st.players.find(p => p.user_id === u.id)?.team; if (mine && !left.some(p => p.team === mine)) { patch.status = "done"; patch.winner = mine === "b" ? "w" : "b"; } }
  await s.from("omok_rooms").update(patch).eq("id", id);
}

export async function startOmok(id: string) {
  const u = await me(); const st = await getOmok(id); if (!st || st.host !== u.id) return { error: "방장만 시작할 수 있어요" };
  if (!st.players.some(p => p.team === "b") || !st.players.some(p => p.team === "w")) return { error: "흑·백 양쪽에 한 명 이상 있어야 해요" };
  await db().from("omok_rooms").update({ status: "playing", board: ".".repeat(N * N), turn: "b", idx_b: 0, idx_w: 0, winner: null, last_move: null, deadline: new Date(Date.now() + TURN_SEC * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  return {};
}

const current = (st: OmokState) => { const team = st.players.filter(p => p.team === st.turn); if (!team.length) return null; return team[(st.turn === "b" ? st.idx_b : st.idx_w) % team.length]; };
function five(board: string, at: number, c: string) {
  const x0 = at % N, y0 = Math.floor(at / N);
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    let n = 1;
    for (const sgn of [1, -1]) { let x = x0 + dx * sgn, y = y0 + dy * sgn; while (x >= 0 && y >= 0 && x < N && y < N && board[y * N + x] === c) { n++; x += dx * sgn; y += dy * sgn; } }
    if (n >= 5) return true;
  }
  return false;
}
async function advance(st: OmokState, board: string, last: number | null) {
  const patch: any = { board, last_move: last, turn: st.turn === "b" ? "w" : "b", deadline: new Date(Date.now() + TURN_SEC * 1000).toISOString(), updated_at: new Date().toISOString() };
  if (st.turn === "b") patch.idx_b = st.idx_b + 1; else patch.idx_w = st.idx_w + 1;
  return patch;
}

export async function placeStone(id: string, at: number) {
  const u = await me(); const st = await getOmok(id); if (!st || st.status !== "playing") return { error: "게임 중이 아니에요" };
  const cur = current(st); if (!cur || cur.user_id !== u.id) return { error: "내 차례가 아니에요" };
  if (!Number.isInteger(at) || at < 0 || at >= N * N || st.board[at] !== ".") return { error: "둘 수 없는 자리예요" };
  const board = st.board.slice(0, at) + st.turn + st.board.slice(at + 1);
  if (five(board, at, st.turn)) {
    await db().from("omok_rooms").update({ board, last_move: at, status: "done", winner: st.turn, deadline: null, updated_at: new Date().toISOString() }).eq("id", id).eq("board", st.board);
    const winners = st.players.filter(p => p.team === st.turn).map(p => p.user_id);
    await Promise.all(winners.map(w => awardXp(w, 100, "omok_win_1")));
    { const nm = (t: string) => st.players.filter(p => p.team === t).map(p => display(p.dept, p.nickname)).join("·"); const loseT = st.turn === "b" ? "w" : "b"; if (nm(loseT)) await gameEvent(`${nm(st.turn)}님이 ${nm(loseT)}님에게 오목 승리!`); }
    await Promise.all(st.players.map(p => bump(p.user_id, "game")));
    return {};
  }
  const full = !board.includes(".");
  const patch = full ? { board, last_move: at, status: "done", winner: "draw", deadline: null, updated_at: new Date().toISOString() } : await advance(st, board, at);
  // 같은 판 상태일 때만 반영(동시에 두는 것 방지)
  const { data } = await db().from("omok_rooms").update(patch).eq("id", id).eq("board", st.board).select("id");
  if (!data?.length) return { error: "다른 수가 먼저 들어왔어요" };
  return {};
}

/** 시간 초과: 아무 참가자나 호출 가능, 서버가 시간 확인 후 차례를 넘김 */
export async function timeoutOmok(id: string) {
  await me(); const st = await getOmok(id); if (!st || st.status !== "playing" || !st.deadline) return;
  if (Date.now() < new Date(st.deadline).getTime() - 500) return;
  const patch = await advance(st, st.board, st.last_move);
  await db().from("omok_rooms").update(patch).eq("id", id).eq("board", st.board).eq("turn", st.turn);
}

export async function rematchOmok(id: string) {
  const u = await me(); const st = await getOmok(id); if (!st || st.status !== "done") return;
  if (!st.players.some(p => p.user_id === u.id)) return;
  await db().from("omok_rooms").update({ status: "waiting", board: ".".repeat(N * N), winner: null, last_move: null, deadline: null, idx_b: 0, idx_w: 0, turn: "b", updated_at: new Date().toISOString() }).eq("id", id);
}

async function touch(id: string) { await db().from("omok_rooms").update({ updated_at: new Date().toISOString() }).eq("id", id); }
