import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { RANKS } from "@/lib/ranks";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { adminToggleStealth, adminDeleteUser, adminLoginAs, adminDemote } from "@/lib/actions";
import AdminForms from "@/components/AdminForms";
import Name from "@/components/Name";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const s = (await getSession())!;
  if (s.role !== "admin") redirect("/board");
  const [{ data: users }, leaders] = await Promise.all([db().from("users").select("id,username,nickname,dept,xp,role,stealth,seq,created_at").order("seq"), deptLeaders()]);
  return (
    <div className="games">
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
              <div className="admin-main"><Name r={r} dept={u.dept} nickname={u.nickname} username={u.username} /><span className="muted">@{u.username} · {u.xp.toLocaleString()} XP · {u.seq}번째{u.role === "admin" ? " · 관리자" : ""}{u.stealth ? " · 숨김" : ""}</span></div>
              <div className="admin-actions">
                <AdminForms userId={u.id} currentRank={r.index} compact />
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
