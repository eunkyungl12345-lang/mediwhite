import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions";
import Tabs from "@/components/Tabs";
import Presence from "@/components/Presence";
import PromoToast from "@/components/PromoToast";
import ChatDock from "@/components/ChatDock";
import PushSetup from "@/components/PushSetup";
import { vapid } from "@/lib/push";
import Name from "@/components/Name";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { RANKS, GENERAL, rankOf } from "@/lib/ranks";
import { db } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const d = db();
  const [{ data: me }, { data: msgs }, { pub }] = await Promise.all([
    d.from("users").select("id,dept,xp,stealth").eq("id", s.id).maybeSingle(),
    d.from("messages").select("id,nickname,dept,text,created_at,user_id,rank").order("created_at", { ascending: false }).limit(60),
    vapid(),
  ]);
  // 참모총장 후보일 때만 파트 1위 확인 (추가 조회 1번)
  const rank = me && me.xp >= RANKS[GENERAL][1] ? rankFor(me, await deptLeaders()) : rankOf(me?.xp ?? 0);
  return (
    <div className="app">
      <header>
        <div className="brand"><h1>메디화이트웹</h1></div>
        <div className="me"><Name r={rank} dept={s.dept} nickname={s.nickname} username={s.username} />{s.role === "admin" && <span className="tag">관리자</span>}<form action={logout}><button>나가기</button></form></div>
      </header>
      <Tabs admin={s.role === "admin"} />
      {pub && <PushSetup vapidPublic={pub} />}
      <main>{children}</main>
      <PromoToast />
      <ChatDock me={s} initial={(msgs ?? []).reverse()} myRank={String(rank.index)} online={<Presence user={s} stealth={!!me?.stealth} />} />
    </div>
  );
}
