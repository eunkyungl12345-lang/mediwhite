import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import { notiReadAll, notiClear } from "@/lib/noti.actions";
export const dynamic = "force-dynamic";

const ICON = (t?: string | null, title?: string) => { const m = (title ?? "").match(/^\p{Extended_Pictographic}/u); if (m) return m[0]; if (!t) return "🔔"; if (t.startsWith("meet")) return "⚡"; if (t.startsWith("dm")) return "💌"; if (t === "report") return "🚨"; return "🔔"; };
export default async function NotiPage() {
  const s = (await getSession())!; const d = db();
  const { data: list } = await d.from("notis").select("id,title,body,url,tag,read,created_at").eq("user_id", s.id).order("created_at", { ascending: false }).limit(60);
  const unread = (list ?? []).filter(n => !n.read).length;
  if (unread) await notiReadAll();
  // 오래된 알림 정리 (60일)
  d.from("notis").delete().eq("user_id", s.id).lt("created_at", new Date(Date.now() - 60 * 86400000).toISOString()).then(() => {});
  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const day = (iso: string) => new Date(Date.parse(iso) + 9 * 3600000).toISOString().slice(0, 10);
  const groups: [string, any[]][] = []; for (const n of list ?? []) { const k = day(n.created_at) === today ? "오늘" : day(n.created_at); const g = groups.find(x => x[0] === k); if (g) g[1].push(n); else groups.push([k, [n]]); }
  return (
    <div className="detail nt-page">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0 }}>🔔 알림</h2>{!!list?.length && <form action={notiClear}><button className="link">모두 지우기</button></form>}</div>
      {!list?.length && <div className="ss-empty-box" style={{ padding: "36px 20px" }}><span style={{ fontSize: 36 }}>🔕</span><b>아직 알림이 없어요</b><p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>댓글·좋아요·대화 신청·번개·심사 결과가 여기에 모여요.</p></div>}
      {groups.map(([k, items]) => <section key={k}><div className="nt-day">{k}</div>{items.map(n => { const inner = <><span className="nt-ico">{ICON(n.tag, n.title)}</span><div className="nt-body"><b>{n.title.replace(/^\p{Extended_Pictographic}\s*/u, "")}</b>{n.body && <p>{n.body}</p>}<small className="muted">{fmt(n.created_at)}</small></div>{!n.read && <span className="nt-dot" />}</>; return n.url ? <Link key={n.id} href={n.url} className={"nt-row" + (n.read ? "" : " unread")}>{inner}</Link> : <div key={n.id} className={"nt-row" + (n.read ? "" : " unread")}>{inner}</div>; })}</section>)}
      <div className="muted" style={{ fontSize: 12 }}>폰으로도 받으려면 홈의 🔔 알림 배너에서 푸시를 켜주세요. 알림은 60일 뒤 자동 삭제돼요.</div>
    </div>
  );
}
