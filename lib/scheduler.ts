import { db } from "./supabase";
import { DAILY_POSTS, BOT_LINES } from "./seedContent";
import { memoOnce } from "./memo";

/** 접속이 있을 때마다 가볍게 확인: 오늘 슬롯이 아직 안 돌았으면 실행 (크론 없이). */
export async function runSchedulers() {
  if (!memoOnce("sched", 60_000)) return; // 인스턴스당 1분에 한 번만 확인
  const s = db();
  const kst = new Date(Date.now() + 9 * 3600000); const day = kst.toISOString().slice(0, 10); const hour = kst.getUTCHours();
  const slot = hour >= 22 ? "night" : hour >= 18 ? "evening" : hour >= 12 ? "lunch" : hour >= 8 ? "morning" : null;
  const claim = async (name: string) => { const { error } = await s.from("daily_runs").insert({ day, slot: name }); return !error; };

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
