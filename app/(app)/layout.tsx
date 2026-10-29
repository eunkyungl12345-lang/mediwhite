import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions";
import Tabs from "@/components/Tabs";
import Presence from "@/components/Presence";
import PromoToast from "@/components/PromoToast";
import ChatDock from "@/components/ChatDock";
import PushSetup from "@/components/PushSetup";
import { vapid } from "@/lib/push";
import { runSchedulers } from "@/lib/scheduler";
import { memo, memoOnce } from "@/lib/memo";
import Onboarding, { TourButton } from "@/components/Onboarding";
import { bump } from "@/lib/daily";
import Name from "@/components/Name";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { RANKS, GENERAL, rankOf } from "@/lib/ranks";
import { OFFICIAL } from "@/lib/depts";
import { db } from "@/lib/supabase";
import { Suspense } from "react";
import TodayBar from "@/components/TodayBar";
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const d = db();
  runSchedulers().catch(() => {});
  if (memoOnce("visit:" + s.id, 30 * 60_000)) { d.rpc("touch_visit", { p_user: s.id }).then(() => {}, () => {}); bump(s.id, "visit").catch(() => {}); }
  const [{ data: me }, { data: msgs }, { pub }, { data: offs }, roomsOn] = await Promise.all([
    d.from("users").select("id,dept,xp,stealth,onboarded,birth_date,birth_time,fortune_name").eq("id", s.id).maybeSingle(),
    d.from("messages").select("id,nickname,dept,text,created_at,user_id,rank").eq("room", "all").order("created_at", { ascending: false }).limit(40),
    vapid(),
    memo("officials", 5 * 60_000, async () => d.from("users").select("id,username").in("username", Object.keys(OFFICIAL))),
    memo("chat_rooms", 60_000, async () => { const { data } = await d.from("settings").select("value").eq("key", "chat_rooms").maybeSingle(); return data?.value === "on"; }),
  ]);
  const official = Object.fromEntries((offs ?? []).map(o => [o.id, OFFICIAL[o.username]]));
  // 참모총장 후보일 때만 파트 1위 확인 (추가 조회 1번)
  const rank = me && me.xp >= RANKS[GENERAL][1] ? rankFor(me, await deptLeaders()) : rankOf(me?.xp ?? 0);
  return (
    <div className="app">
      <header>
        <div className="brand"><h1><Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>메디화이트웹</Link></h1></div>
        <TourButton /><div className="me"><Name r={rank} dept={s.dept} nickname={s.nickname} username={s.username} />{s.role === "admin" && <span className="tag">관리자</span>}<form action={logout}><button>나가기</button></form></div>
      </header>
      <Tabs admin={s.role === "admin"} />
      <Suspense fallback={<div className="tb" />}><TodayBar birth={me ? { date: (me as any).birth_date, time: (me as any).birth_time, name: (me as any).fortune_name } : null} /></Suspense>
      {pub && <PushSetup vapidPublic={pub} />}
      <main>{children}</main>
      <PromoToast />
      <Onboarding show={!!me && !me.onboarded} />
      <ChatDock me={s} initial={(msgs ?? []).reverse()} myRank={String(rank.index)} official={official} online={<Presence user={s} stealth={!!me?.stealth} />} roomsOn={roomsOn} />
    </div>
  );
}
