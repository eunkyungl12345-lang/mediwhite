import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { SSUM_TOPICS, topicOf, display } from "@/lib/depts";
import { answerConfession, deleteIntro } from "@/lib/ssumActions";
import { fmt } from "@/lib/format";
import Name from "@/components/Name";
import { ConfessForm, ProfileForm, IntroForm, LikeButton, PickSolo } from "@/components/ssum/Forms";
export const dynamic = "force-dynamic";

type Tab = "lounge" | "me" | "intro" | "box";
const TABS: [Tab, string][] = [["lounge", "💘 라운지"], ["me", "🙋 나어때"], ["intro", "🤝 지인 소개"], ["box", "💌 내 썸함"]];

function Card({ p, head, foot }: { p: any; head: React.ReactNode; foot?: React.ReactNode }) {
  const rows: [string, any][] = [["성별", p.gender ? (p.gender === "남" ? "🙋‍♂️ 남" : "🙋‍♀️ 여") : null], ["나이", p.age ? `${p.age}세` : null], ["지역", p.region], ["키", p.height ? `${p.height}cm` : null], ["성격", p.personality], ["취미", p.hobby], ["연애 스타일", p.style], ["원하는 상대", p.want]];
  return (
    <div className="ss-card">
      <div className="ss-card-head">{head}</div>
      <dl>{rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {p.intro && <p className="ss-intro">“{p.intro}”</p>}
      {foot && <div className="ss-card-foot">{foot}</div>}
    </div>
  );
}

export default async function SsumPage({ searchParams }: { searchParams: { tab?: string; g?: string } }) {
  const s = (await getSession())!; const d = db();
  const tab = (TABS.some(t => t[0] === searchParams.tab) ? searchParams.tab : "lounge") as Tab;
  const admin = s.role === "admin";
  const gf = searchParams.g === "남" || searchParams.g === "여" ? searchParams.g : "";
  const GFilter = ({ t }: { t: string }) => <div className="sorts">{[["", "전체"], ["여", "🙋‍♀️ 여성"], ["남", "🙋‍♂️ 남성"]].map(([k, n]) => <Link key={k} href={`/ssum?tab=${t}${k ? `&g=${encodeURIComponent(k)}` : ""}`} aria-current={gf === k ? "true" : undefined}>{n}</Link>)}</div>;
  const [leaders, { data: myLikes }, { data: soloRow }] = await Promise.all([deptLeaders(), d.from("likes").select("kind,target").eq("from_id", s.id), d.from("settings").select("value").eq("key", "solo_pick").maybeSingle()]);
  const liked = (kind: string, t: string) => (myLikes ?? []).some(l => l.kind === kind && l.target === t);
  let solo: any = null;
  try { const v = soloRow?.value ? JSON.parse(soloRow.value) : null; if (v?.userId) { const [{ data: sp }, { data: su }] = await Promise.all([d.from("dating_profiles").select("*").eq("user_id", v.userId).eq("visible", true).maybeSingle(), d.from("users").select("id,username,nickname,dept,xp").eq("id", v.userId).maybeSingle()]); if (sp && su) solo = { ...sp, user: su, comment: v.comment, day: v.day }; } } catch {}

  let body: React.ReactNode = null;
  if (tab === "lounge") {
    const [{ data: accepted }, { data: posts }] = await Promise.all([
      d.from("confessions").select("id,text,answered_at,from:users!confessions_from_id_fkey(nickname,dept),to:users!confessions_to_id_fkey(nickname,dept)").eq("status", "accepted").order("answered_at", { ascending: false }).limit(10),
      d.from("posts").select("id,title,topic,created_at,hidden,author:users(id,username,nickname,dept,xp)").eq("category", "썸").eq("hidden", false).order("created_at", { ascending: false }).limit(40),
    ]);
    body = <>
      <section className="card">
        <div className="ss-head"><h3>💌 닉네임 고백</h3><span className="muted">수락된 고백만 공개돼요</span></div>
        {accepted?.length ? <div className="ss-confs">{accepted.map((c: any) => <div key={c.id} className="ss-conf"><div className="ss-conf-who">{c.from ? display(c.from.dept, c.from.nickname) : "?"} <span>💘</span> {c.to ? display(c.to.dept, c.to.nickname) : "?"}</div><div className="ss-conf-text">“{c.text}”</div><div className="time">{fmt(c.answered_at)} 수락</div></div>)}</div> : <div className="muted">아직 성사된 고백이 없어요. 첫 커플의 주인공이 되어보세요.</div>}
        <details className="ss-details"><summary>💌 나도 고백하기</summary><ConfessForm /></details>
      </section>
      {SSUM_TOPICS.map(t => { const list = (posts ?? []).filter((p: any) => p.topic === t.key).slice(0, 8);
        return <section key={t.key} className="card">
          <div className="ss-head"><h3>{t.icon} {t.name}</h3><Link className="btn" style={{ padding: "6px 12px" }} href={`/board/new?cat=${encodeURIComponent("썸")}&topic=${t.key}`}>글쓰기</Link></div>
          <div className="muted" style={{ fontSize: 12 }}>{t.hint}</div>
          {list.length ? list.map((p: any) => <Link key={p.id} href={`/board/${p.id}`} className="h-row"><span className="h-topic">{topicOf(p.topic).icon}</span><span className="h-title">{p.title}</span><span className="h-meta">{p.author ? display(p.author.dept, p.author.nickname) : ""} · {fmt(p.created_at)}</span></Link>) : <div className="h-empty">첫 글을 기다려요.</div>}
        </section>; })}
    </>;
  }
  if (tab === "me") {
    const [{ data: mine }, { data: profs }] = await Promise.all([
      d.from("dating_profiles").select("*").eq("user_id", s.id).maybeSingle(),
      (gf ? d.from("dating_profiles").select("*,user:users!inner(id,username,nickname,dept,xp,stealth)").eq("gender", gf) : d.from("dating_profiles").select("*,user:users!inner(id,username,nickname,dept,xp,stealth)")).eq("visible", true).neq("user_id", s.id).order("updated_at", { ascending: false }).limit(60),
    ]);
    body = <>
      <details className="card ss-details" open={!mine}><summary><b>{mine ? "✏️ 내 프로필 카드 수정" : "🙋 나어때? 내 프로필 카드 만들기"}</b></summary><ProfileForm p={mine} /></details>
      {mine && <Card p={mine} head={<><b>{display(s.dept, s.nickname)}</b><span className="muted" style={{ fontSize: 12 }}>내 카드</span><span className="tag">{mine.visible ? "공개 중" : "비공개"}</span></>} />}
      <GFilter t="me" />
      <div className="ss-cards">{(profs ?? []).filter((p: any) => !p.user.stealth).map((p: any) => <Card key={p.user_id} p={p}
        head={<Name r={rankFor(p.user, leaders)} dept={p.user.dept} nickname={p.user.nickname} username={p.user.username} />}
        foot={<><LikeButton kind="profile" target={p.user_id} liked={liked("profile", p.user_id)} />{admin && <PickSolo userId={p.user_id} />}</>} />)}
        {!profs?.length && <div className="muted">아직 공개된 카드가 없어요. 첫 카드를 올려보세요!</div>}
      </div>
    </>;
  }
  if (tab === "intro") {
    const iq = d.from("intros").select("*,author:users(id,username,nickname,dept,xp)"); const { data: intros } = await (gf ? iq.eq("gender", gf) : iq).order("created_at", { ascending: false }).limit(60);
    body = <>
      <details className="card ss-details"><summary><b>🤝 지인을 소개합니다</b> <span className="muted">— 소개할 분의 동의를 꼭 받아주세요</span></summary><IntroForm /></details>
      <GFilter t="intro" />
      <div className="ss-cards">{(intros ?? []).map((p: any) => <Card key={p.id} p={p}
        head={<><span className="tag">{p.dept || "지인"}</span><span className="muted" style={{ fontSize: 12 }}>{p.author ? `${display(p.author.dept, p.author.nickname)}님의 지인` : ""}</span></>}
        foot={<>{p.author_id !== s.id && <LikeButton kind="intro" target={String(p.id)} liked={liked("intro", String(p.id))} label="소개받고 싶어요" />}{(admin || p.author_id === s.id) && <form action={deleteIntro.bind(null, p.id)}><button className="link">삭제</button></form>}</>} />)}
        {!intros?.length && <div className="muted">아직 소개된 분이 없어요.</div>}
      </div>
    </>;
  }
  if (tab === "box") {
    const [{ data: got }, { data: sent }, { data: likers }, { data: myIntros }, { data: threads }] = await Promise.all([
      d.from("confessions").select("id,text,status,created_at,from_id").eq("to_id", s.id).order("created_at", { ascending: false }).limit(30),
      d.from("confessions").select("id,text,status,created_at,to:users!confessions_to_id_fkey(nickname,dept)").eq("from_id", s.id).order("created_at", { ascending: false }).limit(30),
      d.from("likes").select("from_id,created_at,user:users!likes_from_id_fkey(id,nickname,dept)").eq("kind", "profile").eq("target", s.id),
      d.from("intros").select("id").eq("author_id", s.id),
      d.from("dms").select("a,b,sender,text,created_at").or(`a.eq.${s.id},b.eq.${s.id}`).order("created_at", { ascending: false }).limit(200),
    ]);
    const introIds = (myIntros ?? []).map(i => String(i.id));
    const { data: introLikers } = introIds.length ? await d.from("likes").select("from_id,target,user:users!likes_from_id_fkey(id,nickname,dept)").eq("kind", "intro").in("target", introIds) : { data: [] as any[] };
    const mutual = (likers ?? []).filter((l: any) => liked("profile", l.from_id));
    const acceptedIds = [...(got ?? []).filter(c => c.status === "accepted").map(c => c.from_id)];
    const seen = new Set<string>(); const lastBy: any[] = [];
    for (const m of threads ?? []) { const other = m.a === s.id ? m.b : m.a; if (!seen.has(other)) { seen.add(other); lastBy.push({ other, ...m }); } }
    const otherIds = Array.from(new Set([...lastBy.map(t => t.other), ...acceptedIds]));
    const { data: others } = otherIds.length ? await d.from("users").select("id,nickname,dept").in("id", otherIds) : { data: [] as any[] };
    const nameOf = (id: string) => { const u = (others ?? []).find((x: any) => x.id === id); return u ? display(u.dept, u.nickname) : "회원"; };
    body = <>
      <section className="card"><h3>💬 1:1 대화</h3>
        {lastBy.length ? lastBy.map(t => <Link key={t.other} href={`/ssum/dm/${t.other}`} className="h-row"><span className="h-topic">💬</span><span className="h-title">{nameOf(t.other)}</span><span className="h-meta">{t.sender === s.id ? "나: " : ""}{t.text.slice(0, 40)} · {fmt(t.created_at)}</span></Link>) : <div className="muted">서로 관심이 생기거나 고백이 수락되면 여기서 대화할 수 있어요.</div>}
        {[...mutual.map((l: any) => l.from_id), ...acceptedIds, ...(introLikers ?? []).map((l: any) => l.from_id)].filter(id => !seen.has(id)).filter((v, i, a) => a.indexOf(v) === i).map(id => <Link key={id} href={`/ssum/dm/${id}`} className="ss-newdm">💘 {(likers ?? []).find((l: any) => l.from_id === id)?.user ? display((likers as any).find((l: any) => l.from_id === id).user.dept, (likers as any).find((l: any) => l.from_id === id).user.nickname) : (introLikers ?? []).find((l: any) => l.from_id === id)?.user ? display((introLikers as any).find((l: any) => l.from_id === id).user.dept, (introLikers as any).find((l: any) => l.from_id === id).user.nickname) : nameOf(id)} 님과 대화 시작하기 →</Link>)}
      </section>
      <a className="ss-promo small" href="https://ssumcenter.vercel.app" target="_blank" rel="noopener"><span className="ss-promo-ico">☕</span><span className="ss-promo-txt"><b>대화가 잘 통한다면, 썸류센터에서 직접 만나보세요</b><small>오프라인 로테이션 소개팅 · 1:1 매칭</small></span><span className="ss-promo-go">보기 →</span></a>
      <section className="card"><h3>💌 받은 고백</h3>
        {got?.length ? got.map(c => <div key={c.id} className="ss-conf"><div className="ss-conf-text">“{c.text}”</div><div className="meta"><span className="time">{fmt(c.created_at)}</span>
          {c.status === "pending" ? <><form action={answerConfession.bind(null, c.id, true)}><button className="btn" style={{ padding: "4px 12px" }}>💘 수락 (공개)</button></form><form action={answerConfession.bind(null, c.id, false)}><button className="link">정중히 거절</button></form></> : <span className="tag">{c.status === "accepted" ? `수락함 · ${nameOf(c.from_id)}` : "거절함"}</span>}</div></div>) : <div className="muted">아직 받은 고백이 없어요.</div>}
      </section>
      <section className="card"><h3>💗 내 카드에 관심 보낸 사람</h3>
        {likers?.length ? likers.map((l: any) => <div key={l.from_id} className="meta"><b>{l.user ? display(l.user.dept, l.user.nickname) : "회원"}</b><span className="time">{fmt(l.created_at)}</span>{liked("profile", l.from_id) ? <span className="tag">💘 서로 관심</span> : <span className="muted">나도 그 사람 카드에 관심을 누르면 대화가 열려요</span>}</div>) : <div className="muted">아직 없어요. 나어때 카드를 공개해두면 관심이 올 수 있어요.</div>}
      </section>
      <section className="card"><h3>📤 보낸 고백</h3>
        {sent?.length ? sent.map((c: any) => <div key={c.id} className="meta"><b>{c.to ? display(c.to.dept, c.to.nickname) : "?"}</b><span>“{c.text.slice(0, 30)}”</span><span className="tag">{c.status === "pending" ? "대기 중" : c.status === "accepted" ? "💘 수락됨" : "다음 기회에"}</span></div>) : <div className="muted">보낸 고백이 없어요.</div>}
      </section>
    </>;
  }

  return (
    <div className="games">
      <div className="ss-hero"><div><b>💘 썸류센터</b><span>병원 사람끼리, 조심스럽게 설레는 곳</span></div><span className="muted" style={{ fontSize: 11 }}>만 19세 이상 · 실명·연락처 금지</span></div>
      <a className="ss-promo" href="https://ssumcenter.vercel.app" target="_blank" rel="noopener">
        <span className="ss-promo-ico">💞</span>
        <span className="ss-promo-txt"><b>진짜 만남은 썸류센터에서</b><small>강남 퇴근 후 로테이션 소개팅 · 1:1 매칭 · 성향 테스트</small></span>
        <span className="ss-promo-go">신청하기 →</span>
      </a>
      {solo && <div className="ss-solo"><div className="ss-solo-tag">⭐ 오늘의 솔로 · 요미 픽</div><Card p={solo} head={<Name r={rankFor(solo.user, leaders)} dept={solo.user.dept} nickname={solo.user.nickname} username={solo.user.username} />} foot={<>{solo.comment && <span className="muted">요미: “{solo.comment}”</span>}{solo.user_id !== s.id && <LikeButton kind="profile" target={solo.user_id} liked={liked("profile", solo.user_id)} />}</>} /></div>}
      <div className="cats" style={{ paddingBottom: 0 }}>{TABS.map(([k, n]) => <Link key={k} href={`/ssum?tab=${k}`} aria-current={tab === k ? "true" : undefined}>{n}</Link>)}</div>
      {body}
    </div>
  );
}
