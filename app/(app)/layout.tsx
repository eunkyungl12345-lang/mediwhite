import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions";
import Tabs from "@/components/Tabs";
import Presence from "@/components/Presence";
import PromoToast from "@/components/PromoToast";
import ChatDock from "@/components/ChatDock";
import Name from "@/components/Name";
import { myRank } from "@/lib/ranksvc";
import { db } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const d = db();
  const [rank, { data: me }, { data: msgs }] = await Promise.all([
    myRank(s.id), d.from("users").select("stealth").eq("id", s.id).maybeSingle(),
    d.from("messages").select("id,nickname,dept,text,created_at,user_id,rank").order("created_at", { ascending: false }).limit(80),
  ]);
  return (
    <div className="app">
      <header>
        <div className="brand"><h1>메디화이트웹</h1></div>
        <div className="me"><Name r={rank} dept={s.dept} nickname={s.nickname} username={s.username} />{s.role === "admin" && <span className="tag">관리자</span>}<form action={logout}><button>나가기</button></form></div>
      </header>
      <Tabs admin={s.role === "admin"} />
      <main>{children}</main>
      <PromoToast />
      <ChatDock me={s} initial={(msgs ?? []).reverse()} online={<Presence user={s} stealth={!!me?.stealth} />} />
    </div>
  );
}
