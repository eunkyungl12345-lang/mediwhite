import Link from "next/link";
import { db } from "@/lib/supabase";
import { display } from "@/lib/depts";
import { fmt } from "@/lib/format";
import OmokCreate from "@/components/games/OmokCreate";
import OmokAI from "@/components/games/OmokAI";
export const dynamic = "force-dynamic";

export default async function OmokLobby() {
  const d = db();
  // 오래 방치된 대기방 정리 (2시간)
  await d.from("omok_rooms").delete().eq("status", "waiting").lt("updated_at", new Date(Date.now() - 2 * 3600000).toISOString());
  const { data: rooms } = await d.from("omok_rooms").select("id,title,bet,per_team,status,created_at,host_u:users!omok_rooms_host_fkey(nickname,dept),players:omok_players(team)").neq("status", "done").order("updated_at", { ascending: false }).limit(30);
  return (
    <div className="games">
      <Link className="link" href="/games">← 게임</Link>
      <div className="card">
        <h3>⚫⚪ 온라인 오목</h3>
        <div className="muted">회원끼리 실시간 오목. 1:1부터 5:5 팀전까지 — 팀전은 같은 팀끼리 번갈아 한 수씩 둬요. 한 수 30초. 내기는 재미로만 ☕</div>
        <details className="ss-details"><summary><b>➕ 방 만들기</b></summary><OmokCreate /></details>
      </div>
      <div className="card">
        <h3>열린 방</h3>
        {!rooms?.length && <div className="muted">열린 방이 없어요. 첫 방을 만들어 친구를 불러보거나, 아래에서 컴퓨터랑 연습해보세요!</div>}
        {rooms?.map((r: any) => { const b = r.players.filter((p: any) => p.team === "b").length, w = r.players.filter((p: any) => p.team === "w").length;
          return <Link key={r.id} href={`/games/omok/${r.id}`} className="ss-post">
            <div className="ss-post-t">{r.status === "playing" ? "🔴 " : "🟢 "}{r.title}</div>
            {r.bet && <div className="ss-post-b">☕ 내기: {r.bet}</div>}
            <div className="ss-post-m"><span>{r.per_team === 1 ? "1:1" : `${r.per_team}:${r.per_team} 팀전`} · ⚫{b} vs ⚪{w} · 방장 {r.host_u ? display(r.host_u.dept, r.host_u.nickname) : "-"}</span><span>{r.status === "playing" ? "게임 중 · 구경" : "참가하기 ›"}</span></div>
          </Link>; })}
      </div>
      <OmokAI />
    </div>
  );
}
