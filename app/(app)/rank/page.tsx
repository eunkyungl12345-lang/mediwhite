import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { RANKS, QUESTS, PRIVILEGES, signupBonus, can } from "@/lib/ranks";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { DEPTS, display } from "@/lib/depts";
import RankBadge from "@/components/RankBadge";
import DeleteAccount from "@/components/DeleteAccount";
export const dynamic = "force-dynamic";

export default async function RankPage() {
  const s = (await getSession())!;
  const d = db();
  const [{ data: me }, { data: done }, { data: top }, { count }, leaders] = await Promise.all([
    d.from("users").select("id,dept,xp,seq").eq("id", s.id).single(),
    d.from("xp_log").select("key").eq("user_id", s.id).not("key", "is", null),
    d.from("users").select("id,nickname,dept,xp").order("xp", { ascending: false }).limit(30),
    d.from("users").select("id", { count: "exact", head: true }),
    deptLeaders(),
  ]);
  const xp = me?.xp ?? 0, r = rankFor(me, leaders), doneKeys = new Set((done ?? []).map(x => x.key));
  const n = count ?? 0;
  const leaderRows = (top ?? []).filter(u => leaders[u.dept] === u.id);
  return (
    <div className="games">
      <div className="card">
        <div className="meta"><RankBadge r={r} /><span>{display(s.dept, s.nickname)}</span><span className="muted">가입 {me?.seq ?? "-"}번째</span></div>
        <h3>{xp.toLocaleString()} XP</h3>
        <div className="xpbar"><i style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>
        <div className="muted">{r.capped ? "대장 경험치는 채웠지만, 파트 1위가 아니라 중장이에요. 1위를 넘으면 대장!" : r.next ? `${r.nextName}까지 ${(r.next - xp).toLocaleString()} XP 남았어요` : "파트 대장이에요. 경례!"}</div>
        <div className="ladder">{RANKS.map(([name], i) => <span key={name} className={i === r.index ? "cur" : ""}>{name}</span>)}</div>
      </div>
      <div className="card">
        <h3>계급별 권한</h3>
        <div className="quests">{PRIVILEGES.map(p => <div key={p.minRank} className={"quest" + (can(r, p.minRank) ? " have" : "")}><span><b>{p.minRank}↑</b> {p.title} <span className="muted">— {p.desc}</span></span><span>{can(r, p.minRank) ? "✓" : ""}</span></div>)}</div>
      </div>
      <div className="card">
        <h3>파트별 대장</h3>
        <div className="quests">{DEPTS.map(dp => { const u = leaderRows.find(x => x.dept === dp); return <div key={dp} className="quest"><span>[{dp}]</span><span>{u ? "★★★★ " + u.nickname : <span className="muted">공석 — 15,500 XP 먼저 찍는 사람</span>}</span></div>; })}</div>
      </div>
      <div className="card">
        <h3>퀘스트</h3>
        <div className="muted">빨리 가입할수록 보너스가 커요. 지금 {n}명 가입 · 다음 가입자 보너스 {signupBonus(n + 1)} XP (1~10번째 300, ~30번째 150, ~100번째 80, 이후 30). 채팅 1건 2 XP(하루 60까지), 글 20, 댓글 10.</div>
        <div className="quests">
          <div className="quest done"><span>가입하기</span><span>+{me ? signupBonus(me.seq) : 0}</span></div>
          {QUESTS.map(q => <div key={q.key} className={"quest" + (doneKeys.has(q.key) ? " done" : "")}><span>{q.title}</span><span>+{q.xp}</span></div>)}
        </div>
      </div>
      <div className="card board">
        <h3>계급표</h3>
        <ol>{(top ?? []).map((u, i) => { const rr = rankFor(u, leaders); return <li key={u.id}><span className="rank">{i + 1}</span><span><RankBadge r={rr} /> {display(u.dept, u.nickname)}</span><span className="ms">{u.xp.toLocaleString()}</span></li>; })}</ol>
      </div>
      <DeleteAccount />
    </div>
  );
}
