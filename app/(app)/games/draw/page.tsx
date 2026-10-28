import Link from "next/link";
import { db } from "@/lib/supabase";
import { display } from "@/lib/depts";
import DrawCreate from "@/components/games/DrawCreate";
export const dynamic = "force-dynamic";
export default async function DrawLobby() {
  const d = db();
  await d.from("draw_rooms").delete().eq("status", "waiting").lt("updated_at", new Date(Date.now() - 2 * 3600000).toISOString());
  const { data: rooms } = await d.from("draw_rooms").select("id,title,status,host_u:users!draw_rooms_host_fkey(nickname,dept),players:draw_players(user_id)").neq("status", "done").order("updated_at", { ascending: false }).limit(30);
  return (
    <div className="games">
      <Link className="link" href="/games">← 게임 목록</Link>
      <div className="card">
        <h3>🎨 그림 맞히기</h3>
        <div className="muted">한 명이 제시어를 그리면 나머지가 채팅으로 맞혀요. 빨리 맞힐수록 점수 UP, 그린 사람도 점수! 2~10명 · 한 라운드 80초 · 병원 제시어 가득 🩺</div>
        <details className="ss-details"><summary><b>➕ 방 만들기</b></summary><DrawCreate /></details>
      </div>
      <div className="card">
        <h3>열린 방</h3>
        {!rooms?.length && <div className="muted">열린 방이 없어요. 방을 만들고 📤 친구 부르기로 링크를 보내보세요!</div>}
        {rooms?.map((r: any) => <Link key={r.id} href={`/games/draw/${r.id}`} className="ss-post">
          <div className="ss-post-t">{r.status === "playing" ? "🔴 " : "🟢 "}{r.title}</div>
          <div className="ss-post-m"><span>👥 {r.players.length}/10 · 방장 {r.host_u ? display(r.host_u.dept, r.host_u.nickname) : "-"}</span><span>{r.status === "playing" ? "게임 중 · 들어가기 ›" : "참가하기 ›"}</span></div>
        </Link>)}
      </div>
    </div>
  );
}
