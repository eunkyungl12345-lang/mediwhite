import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canDm } from "@/lib/ssumActions";
import { display } from "@/lib/depts";
import { fmt } from "@/lib/format";
import { DmForm } from "@/components/ssum/Forms";
export const dynamic = "force-dynamic";

export default async function DmPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const d = db();
  const other = params.id;
  const [{ data: u }, ok] = await Promise.all([d.from("users").select("id,nickname,dept").eq("id", other).maybeSingle(), canDm(s.id, other)]);
  if (!u || !ok) return <div className="detail"><Link className="link" href="/ssum?tab=box">← 매칭·채팅</Link><div className="empty">서로 관심이 생기거나 고백이 수락돼야 대화할 수 있어요.</div></div>;
  const [a, b] = [s.id, other].sort();
  const { data: msgs } = await d.from("dms").select("id,sender,text,created_at").eq("a", a).eq("b", b).order("created_at").limit(300);
  return (
    <div className="detail">
      <Link className="link" href="/ssum?tab=box">← 매칭·채팅</Link>
      <h2 style={{ marginTop: 8 }}>💬 {display(u.dept, u.nickname)}</h2>
      <div className="muted" style={{ fontSize: 12 }}>둘만 보는 대화예요. 연락처 교환은 충분히 대화해본 뒤 신중하게. 불쾌한 일이 있으면 문의하기로 알려주세요.</div>
      <div className="ss-dm">{msgs?.length ? msgs.map(m => <div key={m.id} className={"ss-bub" + (m.sender === s.id ? " me" : "")}><span>{m.text}</span><small>{fmt(m.created_at)}</small></div>) : <div className="muted">첫 인사를 건네보세요 👋</div>}</div>
      <DmForm other={other} />
    </div>
  );
}
