import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { RANKS } from "@/lib/ranks";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { adminToggleStealth, adminDeleteUser, adminLoginAs, adminDemote, resolveReport } from "@/lib/actions";
import AdminForms from "@/components/AdminForms";
import AdminSupport from "@/components/AdminSupport";
import AdminResetPw from "@/components/AdminResetPw";
import { bankInfo, deptPools, contactEmail } from "@/lib/support";
import AdminContact from "@/components/AdminContact";
import AdminBroadcast from "@/components/AdminBroadcast";
import Stats from "@/components/Stats";
import { setInquiryStatus } from "@/lib/actions";
import { confirmContribution } from "@/lib/actions";
import { fmt } from "@/lib/format";
import Link from "next/link";
import { REPORT_REASONS } from "@/lib/safety";
import Name from "@/components/Name";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const s = (await getSession())!;
  if (s.role !== "admin") redirect("/board");
  const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
  const [{ data: vis }, { data: signups }, { count: msg24 }, { count: postsAll }, { count: scores24 }] = await Promise.all([
    db().from("visits").select("day,user_id,hits").gte("day", since),
    db().from("users").select("created_at").eq("stealth", false),
    db().from("messages").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    db().from("posts").select("id", { count: "exact", head: true }),
    db().from("scores").select("user_id", { count: "exact", head: true }).gte("updated_at", new Date(Date.now() - 86400000).toISOString()),
  ]);
  const kst = (d: string | Date) => new Date(new Date(d).getTime() + 9 * 3600000).toISOString().slice(0, 10);
  const days: string[] = Array.from({ length: 14 }, (_, i) => kst(new Date(Date.now() - (13 - i) * 86400000)));
  const visByDay: Record<string, Set<string>> = Object.fromEntries(days.map(d => [d, new Set<string>()])); for (const v of vis ?? []) visByDay[v.day]?.add(v.user_id);
  const signByDay: Record<string, number> = Object.fromEntries(days.map(d => [d, 0])); for (const u of signups ?? []) { const k = kst(u.created_at); if (k in signByDay) signByDay[k]++; }
  const series = days.map(d => ({ day: d.slice(5), visitors: visByDay[d].size, signups: signByDay[d] }));
  const [{ data: inq }, email] = await Promise.all([db().from("inquiries").select("*").order("created_at", { ascending: false }).limit(50), contactEmail()]);
  const KIND: Record<string, string> = { ad: "광고", partner: "협업", bug: "오류", other: "기타" };
  const [{ data: dps }, { data: its }, { count: dmCount }, { count: cfAcc }] = await Promise.all([db().from("dating_profiles").select("gender,visible"), db().from("intros").select("gender"), db().from("dms").select("id", { count: "exact", head: true }), db().from("confessions").select("id", { count: "exact", head: true }).eq("status", "accepted")]);
  const gcount = (rows: any[] | null, g: string) => (rows ?? []).filter(r => r.gender === g).length;
  const { data: reports } = await db().from("reports").select("id,kind,target_id,reason,detail,status,created_at,reporter:users!reports_reporter_id_fkey(nickname,dept)").order("created_at", { ascending: false }).limit(50);
  const openR = (reports ?? []).filter(r => r.status === "open");
  const rPosts = openR.filter(r => r.kind === "post").map(r => r.target_id), rComs = openR.filter(r => r.kind === "comment").map(r => Number(r.target_id));
  const [{ data: rp }, { data: rc }] = await Promise.all([rPosts.length ? db().from("posts").select("id,title,body").in("id", rPosts) : Promise.resolve({ data: [] as any[] }), rComs.length ? db().from("comments").select("id,text").in("id", rComs) : Promise.resolve({ data: [] as any[] })]);
  const preview = (r: any) => r.kind === "post" ? (rp ?? []).find((p: any) => p.id === r.target_id) : (rc ?? []).find((c: any) => String(c.id) === r.target_id);
  const [{ data: users }, leaders, bank, { rows: pools }, { data: pending }] = await Promise.all([
    db().from("users").select("id,username,nickname,dept,xp,role,stealth,seq,join_order,created_at").order("seq"), deptLeaders(), bankInfo(), deptPools(),
    db().from("contributions").select("id,dept,amount,points,depositor,created_at,users(nickname)").eq("status", "pending").order("created_at"),
  ]);
  return (
    <div className="games">
      <Stats series={series} totals={{ users: (signups ?? []).length, today: series[series.length - 1]?.visitors ?? 0, msg24h: msg24 ?? 0, posts: postsAll ?? 0, games24h: scores24 ?? 0 }} />
      <div className="card">
        <h3>전체 폰 알림 보내기</h3>
        <div className="muted">알림을 켠 회원 모두에게 푸시. 이벤트·공지용 (하루 1~2번만 — 많으면 다 꺼버려요).</div>
        <AdminBroadcast />
      </div>
      <div className="card">
        <h3>💘 썸류센터 현황</h3>
        <div className="h-stats">
          <div className="h-stat"><b>{gcount(dps, "여")}</b><span>🙋‍♀️ 여 카드</span></div>
          <div className="h-stat"><b>{gcount(dps, "남")}</b><span>🙋‍♂️ 남 카드</span></div>
          <div className="h-stat"><b>{gcount(its, "여")}/{gcount(its, "남")}</b><span>지인 소개 여/남</span></div>
          <div className="h-stat"><b>{cfAcc ?? 0}</b><span>성사된 고백</span></div>
        </div>
        <div className="muted">공개 카드 {(dps ?? []).filter(r => r.visible).length}장 · 1:1 대화 메시지 {dmCount ?? 0}개 · 유료 전환 신호: 공개 카드 50장 이상 + 남녀 비율 균형</div>
      </div>
      <div className="card">
        <h3>🚩 신고함 — 처리 대기 {openR.length}건</h3>
        <div className="muted">신고 즉시 블라인드돼요. 복구하면 다시 보이고, 삭제하면 영구 삭제. 30일 지나면 자동 복구.</div>
        {!openR.length && <div className="muted">대기 중인 신고가 없어요.</div>}
        <div className="quests">{openR.map((r: any) => { const t = preview(r); return <div key={r.id} className="quest" style={{ display: "grid", gap: 6 }}>
          <div className="meta"><span className="tag">{r.kind === "post" ? "글" : "댓글"}</span><b>{REPORT_REASONS.find(x => x[0] === r.reason)?.[1] ?? r.reason}</b><span>신고자 {r.reporter ? `[${r.reporter.dept}]${r.reporter.nickname}` : "-"}</span><span className="time">{fmt(r.created_at)}</span></div>
          {r.detail && <div className="muted">사유: {r.detail}</div>}
          <div style={{ whiteSpace: "pre-wrap", background: "var(--bg)", borderRadius: 8, padding: 8, fontSize: 13 }}>{t ? (r.kind === "post" ? <><b>{t.title}</b><br />{String(t.body).slice(0, 300)}</> : t.text) : "(이미 삭제됨)"}{r.kind === "post" && t && <> · <Link href={`/board/${r.target_id}`}>열기</Link></>}</div>
          <div className="row"><form action={resolveReport.bind(null, r.id, "restore")}><button className="btn ghost" style={{ padding: "6px 12px" }}>문제없음 · 복구</button></form><form action={resolveReport.bind(null, r.id, "delete")}><button className="btn" style={{ padding: "6px 12px", background: "#E2574C" }}>삭제 확정</button></form></div>
        </div>; })}</div>
      </div>
      <div className="card">
        <h3>문의함 — 새 문의 {(inq ?? []).filter(i => i.status === "new").length}건</h3>
        <AdminContact email={email} />
        {!inq?.length && <div className="muted">아직 문의가 없어요. 문의 페이지: /contact</div>}
        <div className="quests">{inq?.map(i => <div key={i.id} className={"quest" + (i.status === "done" ? " done" : "")} style={{ display: "grid", gap: 4 }}>
          <div className="meta"><span className="tag">{KIND[i.kind] ?? i.kind}</span><b>{i.name}</b><span>{i.contact}</span><span className="time">{fmt(i.created_at)}</span>
            <form action={setInquiryStatus.bind(null, i.id, i.status === "done" ? "new" : "done")}><button className="link">{i.status === "done" ? "다시 열기" : "처리 완료"}</button></form></div>
          <div style={{ whiteSpace: "pre-wrap" }}>{i.body}</div>
        </div>)}</div>
      </div>
      <div className="card">
        <h3>파트 응원전 — 입금 확인 대기 {pending?.length ?? 0}건</h3>
        {!pending?.length && <div className="muted">대기 중인 신청이 없어요.</div>}
        <div className="quests">{pending?.map((c: any) => <div key={c.id} className="quest" style={{ alignItems: "center" }}>
          <span>[{c.dept}] {c.amount.toLocaleString()}원 → +{c.points} XP <span className="muted">· 입금자 <b>{c.depositor}</b> · {c.users?.nickname ?? "탈퇴"} · {fmt(c.created_at)}</span></span>
          <span className="row"><form action={confirmContribution.bind(null, c.id, true)}><button className="btn" style={{ padding: "6px 10px" }}>입금 확인</button></form><form action={confirmContribution.bind(null, c.id, false)}><button className="link">취소</button></form></span>
        </div>)}</div>
        <AdminSupport bank={bank} pools={pools} />
      </div>
      <div className="card">
        <h3>분신 계정 만들기</h3>
        <div className="muted">원하는 계급으로 바로 생성돼요. "숨김"을 켜면 계급표·파트 리더·접속자 수에 안 잡혀요 (일반 회원 눈에는 평범한 회원으로 보여요). 만든 뒤 아래 목록에서 "이 계정으로 전환"으로 들어가서 활동하면 돼요.</div>
        <AdminForms />
      </div>
      <div className="card">
        <h3>회원 {users?.length ?? 0}명</h3>
        <div className="admin-list">
          {users?.map(u => { const r = rankFor(u, leaders); return (
            <div key={u.id} className="admin-row">
              <div className="admin-main"><Name r={r} dept={u.dept} nickname={u.nickname} username={u.username} /><span className="muted">@{u.username} · {u.xp.toLocaleString()} XP · {u.join_order ?? "-"}번째{u.role === "admin" ? " · 관리자" : ""}{u.stealth ? " · 숨김" : ""}</span></div>
              <div className="admin-actions">
                <AdminForms userId={u.id} currentRank={r.index} compact />
                <AdminResetPw userId={u.id} />
                {r.index > 0 && <form action={adminDemote.bind(null, u.id, "19금 발언·욕설")}><button className="link" style={{ color: "var(--signal)" }}>훈련병 강등</button></form>}
                <form action={adminToggleStealth.bind(null, u.id, !u.stealth)}><button className="link">{u.stealth ? "숨김 해제" : "숨김"}</button></form>
                <form action={adminLoginAs.bind(null, u.id)}><button className="link">이 계정으로 전환</button></form>
                {u.id !== s.id && <form action={adminDeleteUser.bind(null, u.id)}><button className="link" style={{ color: "var(--signal)" }}>삭제</button></form>}
              </div>
            </div>); })}
        </div>
      </div>
      <div className="card"><h3>경험치표</h3><div className="ladder">{RANKS.map(([n, x]) => <span key={n}>{n} {x.toLocaleString()}</span>)}</div></div>
    </div>
  );
}
