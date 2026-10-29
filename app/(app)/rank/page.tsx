import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { RANKS, QUESTS, PRIVILEGES, REPEAT, signupBonus, can } from "@/lib/ranks";
import { deptLeaders, rankFor, deptCommanders } from "@/lib/ranksvc";
import { HOSPITAL_DEPTS as DEPTS, display } from "@/lib/depts";
import RankBadge from "@/components/RankBadge";
import Name from "@/components/Name";
import Insignia from "@/components/Insignia";
import DeleteAccount from "@/components/DeleteAccount";
import BirthForm from "@/components/BirthForm";
import ProfileForm from "@/components/ProfileForm";
import PasswordForm from "@/components/PasswordForm";
import InviteLink from "@/components/InviteLink";
import Hero from "@/components/Hero";
import { dailyStatus, DAILY_BONUS, STREAK_BONUS } from "@/lib/daily";
export const dynamic = "force-dynamic";

export default async function RankPage() {
  const s = (await getSession())!;
  const d = db();
  const [{ data: me }, { data: done }, { data: top }, { count }, leaders, commanders, { count: invited }, daily] = await Promise.all([
    d.from("users").select("id,username,nickname,dept,xp,join_order,bio,fortune_name,birth_date,birth_time").eq("id", s.id).single(),
    d.from("xp_log").select("key").eq("user_id", s.id).not("key", "is", null),
    d.from("users").select("id,username,nickname,dept,xp").eq("stealth", false).order("xp", { ascending: false }).limit(30),
    d.from("users").select("id", { count: "exact", head: true }).eq("stealth", false),
    deptLeaders(), deptCommanders(),
    d.from("users").select("id", { count: "exact", head: true }).eq("referred_by", s.username),
    dailyStatus(s.id),
  ]);
  const xp = me?.xp ?? 0, r = rankFor(me, leaders), doneKeys = new Set((done ?? []).map(x => x.key));
  const n = count ?? 0;
  return (
    <div className="games">
      <Hero img="/img/rank.jpg" title="내 계급" sub="참여할수록 진급" />
      <div className={`card t${r.tier}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><Name r={r} dept={me?.dept ?? s.dept} nickname={me?.nickname ?? s.nickname} username={s.username} size={22} /><RankBadge r={r} /><span className="muted">가입 {me?.join_order ?? "-"}번째</span></div>
        <h3>{xp.toLocaleString()} XP</h3>
        <div className="xpbar"><i style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>
        <div className="muted">{r.capped ? "참모총장 경험치는 채웠지만 파트 1위가 아니라 중장이에요. 1위를 넘으면 참모총장!" : r.next ? `${r.nextName}까지 ${(r.next - xp).toLocaleString()} XP` : "파트 참모총장이에요. 경례!"}</div>
        <div className="ladder">{RANKS.map(([name], i) => <span key={name} className={i === r.index ? "cur" : ""}><Insignia index={i} size={10} /> {name}</span>)}</div>
      </div>

      <div className="card daily">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}><h3 style={{ margin: 0 }}>📅 오늘의 퀘스트</h3><span className="muted">자정에 초기화 · 3개 다 하면 +{DAILY_BONUS} XP</span></div>
        <div className="dq-list">{daily.quests.map(q => <div key={q.key} className={"dq" + (q.done ? " done" : "")}><span className="dq-chk">{q.done ? "✓" : ""}</span><span className="dq-ico">{q.icon}</span><span className="dq-t">{q.title}</span><span className="dq-n">{q.n}/{q.target}</span><span className="tag">+{q.xp}</span></div>)}</div>
        {daily.all && <div className="dq-all">🎉 오늘 퀘스트 올클리어! 보너스 +{DAILY_BONUS} XP</div>}
        <div className="dq-streak"><span><b>{daily.streak}일</b> 연속 출석</span><span className="dq-stamps">{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < (daily.streak % 7 === 0 && daily.streak > 0 ? 7 : daily.streak % 7) ? "on" : ""}>{i < (daily.streak % 7 === 0 && daily.streak > 0 ? 7 : daily.streak % 7) ? "✓" : i + 1}</i>)}</span><span className="muted">7일마다 +{STREAK_BONUS} XP</span></div>
      </div>

      <div className="card">
        <h3>내 정보</h3>
        <ProfileForm nickname={me?.nickname ?? s.nickname} bio={me?.bio ?? ""} dept={me?.dept ?? s.dept} />
        <details className="ss-details" style={{ marginTop: 8 }}><summary><b>🔮 운세용 생일 정보</b> <span className="muted" style={{ fontSize: 12 }}>(본인만 보여요)</span></summary><BirthForm name={(me as any)?.fortune_name} date={(me as any)?.birth_date} time={(me as any)?.birth_time} /></details>
        <details><summary className="muted" style={{ cursor: "pointer" }}>비밀번호 변경</summary><div style={{ paddingTop: 10 }}><PasswordForm /></div></details>
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
