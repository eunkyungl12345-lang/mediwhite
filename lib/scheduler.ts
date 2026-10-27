import { db } from "./supabase";
import { DAILY_POSTS, BOT_LINES } from "./seedContent";
import { memoOnce } from "./memo";

/** 접속이 있을 때마다 가볍게 확인: 오늘 슬롯이 아직 안 돌았으면 실행 (크론 없이). */
/** 임시조치 30일 경과 → 자동 복구 (운영팀이 처리 안 한 건) */
async function restoreExpiredBlinds() {
  const s = db(), cut = new Date(Date.now() - 30 * 86400000).toISOString();
  for (const t of ["posts", "comments"] as const) {
    const { data } = await s.from(t).select("id").eq("hidden", true).lt("hidden_at", cut).limit(50);
    for (const row of data ?? []) { await s.from(t).update({ hidden: false, hidden_at: null }).eq("id", row.id); await s.from("reports").update({ status: "restored", resolved_at: new Date().toISOString() }).eq("kind", t === "posts" ? "post" : "comment").eq("target_id", String(row.id)).eq("status", "open"); }
  }
}
export async function runSchedulers() {
  if (!memoOnce("sched", 60_000)) return; // 인스턴스당 1분에 한 번만 확인
  const s = db();
  const kst = new Date(Date.now() + 9 * 3600000); const day = kst.toISOString().slice(0, 10); const hour = kst.getUTCHours();
  const slot = hour >= 22 ? "night" : hour >= 18 ? "evening" : hour >= 12 ? "lunch" : hour >= 8 ? "morning" : null;
  const claim = async (name: string) => { const { error } = await s.from("daily_runs").insert({ day, slot: name }); return !error; };
  if (await claim("blinds")) restoreExpiredBlinds().catch(() => {});

  // 1) 오늘의 질문 (08시 이후 하루 1회)
  if (hour >= 8 && await claim("post")) {
    const { data: team } = await s.from("users").select("id,dept").eq("username", "mw_team").maybeSingle();
    if (team) {
      const { count } = await s.from("posts").select("id", { count: "exact", head: true }).eq("author_id", team.id);
      const idx = (count ?? 0) % DAILY_POSTS.length; const q = DAILY_POSTS[idx];
      await s.from("posts").insert({ author_id: team.id, category: q.category, dept: team.dept, title: `[오늘의 질문] ${q.title}`, body: q.body + "\n\n— 메디화이트 운영팀" });
    }
  }
  // 2) 라운지봇 채팅 (시간대별 1회)
  if (slot && await claim("bot-" + slot)) {
    const { data: bot } = await s.from("users").select("id,nickname,dept").eq("username", "mw_bot").maybeSingle();
    if (bot) { const lines = BOT_LINES[slot]; const text = lines[Math.floor(Math.random() * lines.length)];
      await s.from("messages").insert({ user_id: bot.id, nickname: bot.nickname, dept: bot.dept, text, rank: "1" }); }
  }
}
