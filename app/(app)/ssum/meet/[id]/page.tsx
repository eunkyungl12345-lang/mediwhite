import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { display } from "@/lib/depts";
import { fmt } from "@/lib/format";
import { kindOf, whenLabel } from "@/lib/meetup";
import { JoinButton, MeetChat, PendingRow } from "@/components/ssum/Meet";
export const dynamic = "force-dynamic";

export default async function MeetPage({ params }: { params: { id: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(params.id);
  const [{ data: m }, { data: mem }] = await Promise.all([d.from("meetups").select("*,host:users!meetups_host_id_fkey(nickname,dept)").eq("id", id).maybeSingle(), d.from("meetup_members").select("user_id,status,msg,user:users(nickname,dept)").eq("meetup_id", id).in("status", ["joined", "pending"]).order("joined_at")]);
  const all = mem ?? []; const pend = all.filter((x: any) => x.status === "pending"); const memJ = all.filter((x: any) => x.status === "joined");
  if (!m) return <div className="detail"><Link className="link" href="/ssum?tab=meet">← 번개</Link><div className="empty">없는 번개예요.</div></div>;
  const joined = memJ.some((x: any) => x.user_id === s.id), pending = pend.some((x: any) => x.user_id === s.id), host = m.host_id === s.id, k = kindOf(m.kind), closed = m.status === "canceled" || Date.parse(m.when_at) < Date.now() - 3 * 3600000;
  const { data: msgs } = joined ? await d.from("meetup_msgs").select("id,user_id,text,created_at,user:users(nickname,dept)").eq("meetup_id", id).order("created_at").limit(300) : { data: null };
  return (
    <div className="detail">
      <Link className="link" href="/ssum?tab=meet">← 번개</Link>
      <div className="mt-head"><span className="mt-ico">{k.icon}</span><div><h2 style={{ margin: 0 }}>{m.title}</h2><div className="muted" style={{ fontSize: 13 }}>{whenLabel(m.when_at)} · {m.area}{m.place ? ` · ${m.place}` : ""} · {memJ.length}/{m.cap}명{m.gender ? ` · ${m.gender}성만` : ""}</div></div></div>
      {m.note && <div className="mt-note">“{m.note}”</div>}
      <div className="mt-members">{memJ.map((x: any) => <span key={x.user_id} className={"tag" + (x.user_id === m.host_id ? " host" : "")}>{x.user_id === m.host_id ? "👑 " : ""}{x.user ? display(x.user.dept, x.user.nickname) : "회원"}</span>)}</div>
      <div style={{ margin: "8px 0" }}><JoinButton id={id} joined={joined} pending={pending} host={host} full={memJ.length >= m.cap} closed={closed} waiting={pend.length} /></div>
      {m.status === "canceled" && <div className="error">주최자가 취소한 번개예요.</div>}
      {host && pend.length > 0 && <div className="card" style={{ padding: 10, display: "grid", gap: 8 }}><b>🙋 참여 신청 {pend.length}명</b><div className="muted" style={{ fontSize: 12 }}>수락한 사람만 모임 채팅방에 들어올 수 있어요.</div>{pend.map((x: any) => <PendingRow key={x.user_id} id={id} userId={x.user_id} name={x.user ? display(x.user.dept, x.user.nickname) : "회원"} msg={x.msg} />)}</div>}
      {joined ? <>
        <div className="muted" style={{ fontSize: 12 }}>참여자끼리만 보는 채팅이에요. 정확한 장소·시간은 여기서 정하고, 처음 만나는 자리는 공개된 장소로!</div>
        <div className="ss-dm">{msgs?.length ? msgs.map((x: any) => <div key={x.id} className={"ss-bub" + (x.user_id === s.id ? " me" : "")}><small style={{ display: "block", opacity: .7 }}>{x.user ? display(x.user.dept, x.user.nickname) : "회원"}</small><span>{x.text}</span><small>{fmt(x.created_at)}</small></div>) : <div className="muted">첫 인사를 남겨보세요 👋 “몇 시쯤 괜찮으세요?”</div>}</div>
        {!closed && <MeetChat id={id} />}
      </> : <div className="empty">{pending ? "⏳ 모임장이 수락하면 채팅방이 열려요. 조금만 기다려주세요!" : "참여를 신청하고 모임장이 수락하면 채팅방이 열려요."}</div>}
    </div>
  );
}
