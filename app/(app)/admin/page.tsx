import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { RANKS } from "@/lib/ranks";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { adminToggleStealth, adminDeleteUser, adminLoginAs, adminDemote } from "@/lib/actions";
import AdminForms from "@/components/AdminForms";
import AdminSupport from "@/components/AdminSupport";
import AdminResetPw from "@/components/AdminResetPw";
import { bankInfo, deptPools, contactEmail } from "@/lib/support";
import AdminContact from "@/components/AdminContact";
import { setInquiryStatus } from "@/lib/actions";
import { confirmContribution } from "@/lib/actions";
import { fmt } from "@/lib/format";
import Name from "@/components/Name";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const s = (await getSession())!;
  if (s.role !== "admin") redirect("/board");
  const [{ data: inq }, email] = await Promise.all([db().from("inquiries").select("*").order("created_at", { ascending: false }).limit(50), contactEmail()]);
  const KIND: Record<string, string> = { ad: "광고", partner: "협업", bug: "오류", other: "기타" };
  const [{ data: users }, leaders, bank, { rows: pools }, { data: pending }] = await Promise.all([
    db().from("users").select("id,username,nickname,dept,xp,role,stealth,seq,join_order,created_at").order("seq"), deptLeaders(), bankInfo(), deptPools(),
    db().from("contributions").select("id,dept,amount,points,depositor,created_at,users(nickname)").eq("status", "pending").order("created_at"),
  ]);
  return (
    <div className="games">
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
