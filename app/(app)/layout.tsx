import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions";
import Tabs from "@/components/Tabs";
import Presence from "@/components/Presence";
import Ticker from "@/components/Ticker";
import { myRank } from "@/lib/ranksvc";
import { display } from "@/lib/depts";
import { STARS } from "@/lib/ranks";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const rank = await myRank(s.id);
  return (
    <div className="app">
      <header>
        <div className="brand"><h1>메디화이트웹</h1><Presence user={s} /></div>
        <div className="me"><span><span className={`rank-tag t${rank.tier}`}>{STARS[rank.name] ? STARS[rank.name] + " " : ""}{rank.name}</span> {display(s.dept, s.nickname)}{s.role === "admin" ? " · 관리자" : ""}</span><form action={logout}><button>나가기</button></form></div>
      </header>
      <Ticker />
      <Tabs />
      <main>{children}</main>
    </div>
  );
}
