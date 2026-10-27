import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { RANKS, QUESTS, PRIVILEGES, REPEAT, signupBonus, can } from "@/lib/ranks";
import { deptLeaders, rankFor, deptCommanders } from "@/lib/ranksvc";
import { DEPTS, display } from "@/lib/depts";
import RankBadge from "@/components/RankBadge";
import Name from "@/components/Name";
import Insignia from "@/components/Insignia";
import DeleteAccount from "@/components/DeleteAccount";
import ProfileForm from "@/components/ProfileForm";
import InviteLink from "@/components/InviteLink";
export const dynamic = "force-dynamic";

export default async function RankPage() {
  const s = (await getSession())!;
  const d = db();
  const [{ data: me }, { data: done }, { data: top }, { count }, leaders, commanders, { count: invited }] = await Promise.all([
    d.from("users").select("id,username,nickname,dept,xp,join_order,bio").eq("id", s.id).single(),
    d.from("xp_log").select("key").eq("user_id", s.id).not("key", "is", null),
    d.from("users").select("id,username,nickname,dept,xp").eq("stealth", false).order("xp", { ascending: false }).limit(30),
    d.from("users").select("id", { count: "exact", head: true }).eq("stealth", false),
    deptLeaders(), deptCommanders(),
    d.from("users").select("id", { count: "exact", head: true }).eq("referred_by", s.username),
  ]);
  const xp = me?.xp ?? 0, r = rankFor(me, leaders), doneKeys = new Set((done ?? []).map(x => x.key));
  const n = count ?? 0;
  return (
    <div className="games">
      <div className={`card t${r.tier}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><Name r={r} dept={me?.dept ?? s.dept} nickname={me?.nickname ?? s.nickname} username={s.username} size={22} /><RankBadge r={r} /><span className="muted">가입 {me?.join_order ?? "-"}번째</span></div>
        <h3>{xp.toLocaleString()} XP</h3>
        <div className="xpbar"><i style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>
        <div className="muted">{r.capped ? "참모총장 경험치는 채웠지만 파트 1위가 아니라 중장이에요. 1위를 넘으면 참모총장!" : r.next ? `${r.nextName}까지 ${(r.next - xp).toLocaleString()} XP` : "파트 참모총장이에요. 경례!"}</div>
        <div className="ladder">{RANKS.map(([name], i) => <span key={name} className={i === r.index ? "cur" : ""}><Insignia index={i} size={10} /> {name}</span>)}</div>
      </div>

      <div className="card">
        <h3>내 정보</h3>
        <ProfileForm nickname={me?.nickname ?? s.nickname} bio={me?.bio ?? ""} dept={me?.dept ?? s.dept} />
      </div>

      <div className="card">
        <h3>초대 링크 (링크 공유 지수)</h3>
        <div className="muted">이 링크로 가입하면 한 명당 {REPEAT.referral.each} XP (하루 {REPEAT.referral.dailyCap}까지). 지금까지 {invited ?? 0}명 초대.</div>
        <InviteLink username={s.username} />
      </div>

      <div className="card">
        <h3>경험치 얻는 법</h3>
        <div className="muted">빨리 가입할수록 보너스가 커요. 지금 {n}명 · 다음 가입자 {signupBonus(n + 1)} XP (1~10번째 300 / ~30번째 150 / ~100번째 80 / 이후 30).
          매일: 채팅 {REPEAT.chat.each}×(최대 {REPEAT.chat.dailyCap}) · 글 {REPEAT.post.each}×(최대 {REPEAT.post.dailyCap}) · 댓글 {REPEAT.comment.each}×(최대 {REPEAT.comment.dailyCap}). 하루 열심히 하면 약 100 XP → 일병 하루, 하사 열흘, 소위 한 달 반, 소령 넉 달, 참모총장 1년 반.</div>
        <div className="quests">
          <div className="quest done"><span>가입하기</span><span>+{me ? signupBonus(me.join_order ?? 999) : 0}</span></div>
          {QUESTS.map(q => <div key={q.key} className={"quest" + (doneKeys.has(q.key) ? " done" : "")}><span>{q.title}</span><span>+{q.xp}</span></div>)}
        </div>
      </div>

      <div className="card">
        <h3>계급별 권한</h3>
        <div className="quests">{PRIVILEGES.map(p => <div key={p.minRank} className={"quest" + (can(r, p.minRank) ? " have" : "")}><span><b>{p.minRank}↑</b> {p.title} <span className="muted">— {p.desc}</span></span><span>{can(r, p.minRank) ? "✓" : ""}</span></div>)}</div>
      </div>

      <div className="card">
        <h3>파트 리더</h3>
        <div className="muted">파트별 경험치 1위. 파트 게시판에 탭을 만들 수 있어요. 참모총장(★★★★) 계급은 50,000 XP를 채운 리더만.</div>
        <div className="quests">{DEPTS.map(dp => { const u = commanders.find(x => x.dept === dp); return <div key={dp} className="quest"><span>[{dp}]</span><span>{u ? `${u.nickname} · ${u.xp.toLocaleString()} XP` : <span className="muted">공석</span>}</span></div>; })}</div>
      </div>

      <div className="card board">
        <h3>계급표</h3>
        <ol>{(top ?? []).map((u, i) => { const rr = rankFor(u, leaders); return <li key={u.id}><span className="rank">{i + 1}</span><span><Name r={rr} dept={u.dept} nickname={u.nickname} username={u.username} /></span><span className="ms">{u.xp.toLocaleString()}</span></li>; })}</ol>
      </div>
      <DeleteAccount />
    </div>
  );
}
