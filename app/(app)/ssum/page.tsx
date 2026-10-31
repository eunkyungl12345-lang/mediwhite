import Link from "next/link";
import { MeetForm, JoinButton } from "@/components/ssum/Meet";
import { kindOf, whenLabel, MEET_AREAS } from "@/lib/meetup";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { SSUM_TOPICS, topicOf, display } from "@/lib/depts";
import { answerConfession, deleteIntro, dmQuota } from "@/lib/ssumActions";
import { fmt } from "@/lib/format";
import Name from "@/components/Name";
import { ConfessForm, ProfileForm, IntroForm, LikeButton, PickSolo, DmRequestButton, DmRequestAnswer } from "@/components/ssum/Forms";
export const dynamic = "force-dynamic";

type Tab = "lounge" | "me" | "meet" | "box";
const TABS: [Tab, string][] = [["lounge", "💘 라운지"], ["me", "🙋 셀소"], ["meet", "⚡ 번개"], ["box", "💬 매칭·채팅"]];

function Card({ p, head, foot, see }: { p: any; head: React.ReactNode; foot?: React.ReactNode; see?: boolean }) {
  const chips: { icon?: string; label: string; text: string }[] = [];
  if (p.age) chips.push({ label: "나이", text: `${p.age}세` });
  if (p.gender) chips.push({ label: "성별", text: p.gender === "남" ? "🙋‍♂️ 남" : "🙋‍♀️ 여" });
  if (p.region) chips.push({ icon: "📍", label: "지역", text: p.region });
  if (p.height) chips.push({ label: "키", text: `${p.height}cm` });
  if (p.personality) chips.push({ icon: "✨", label: "성격", text: p.personality });
  if (p.hobby) chips.push({ icon: "🎯", label: "취미", text: p.hobby });
  if (p.style) chips.push({ icon: "💕", label: "스타일", text: p.style });
  if (p.want) chips.push({ icon: "🔍", label: "이상형", text: p.want });

  return (
    <div className="ss-card">
      {p.photo && (
        <div className="ss-pic">
          {see || p.photo_public ? (
            <img src={p.photo} alt="" loading="lazy" />
          ) : (
            <>
              <img src={p.photo_blur ?? ""} alt="" className="blur" />
              <span>💗 서로 관심이면 선명하게 보여요</span>
            </>
          )}
        </div>
      )}
      <div className="ss-card-head">{head}</div>
      {chips.length > 0 && (
        <div className="ss-chips">
          {chips.map((c, i) => (
            <span key={i} className="ss-chip">
              {c.icon && <span className="ss-chip-ico">{c.icon}</span>}
              <b className="ss-chip-lbl">{c.label}</b>
              <span className="ss-chip-val">{c.text}</span>
            </span>
          ))}
        </div>
      )}
      {p.intro && <p className="ss-intro">“{p.intro}”</p>}
      {foot && <div className="ss-card-foot">{foot}</div>}
    </div>
  );
}

export default async function SsumPage({ searchParams }: { searchParams: { tab?: string; g?: string; sub?: string; area?: string } }) {
  const s = (await getSession())!; const d = db();
  const tab = (TABS.some(t => t[0] === searchParams.tab) ? searchParams.tab : (searchParams.tab === "intro" ? "me" : "lounge")) as Tab;
  const admin = s.role === "admin";
  const gf = searchParams.g === "남" || searchParams.g === "여" ? searchParams.g : "";
  const GFilter = ({ t }: { t: string }) => <div className="sorts">{[["", "전체"], ["여", "🙋‍♀️ 여성"], ["남", "🙋‍♂️ 남성"]].map(([k, n]) => <Link key={k} href={`/ssum?tab=${t}${k ? `&g=${encodeURIComponent(k)}` : ""}`} aria-current={gf === k ? "true" : undefined}>{n}</Link>)}</div>;
  const [leaders, { data: myLikes }, { data: soloRow }] = await Promise.all([deptLeaders(), d.from("likes").select("kind,target").eq("from_id", s.id), d.from("settings").select("value").eq("key", "solo_pick").maybeSingle()]);
  const liked = (kind: string, t: string) => (myLikes ?? []).some(l => l.kind === kind && l.target === t);
  const { data: likedMe } = await d.from("likes").select("from_id").eq("kind", "profile").eq("target", s.id);
  const mutualWith = (uid: string) => liked("profile", uid) && (likedMe ?? []).some(l => l.from_id === uid);
  let solo: any = null;
  try { const v = soloRow?.value ? JSON.parse(soloRow.value) : null; if (v?.userId) { const [{ data: sp }, { data: su }] = await Promise.all([d.from("dating_profiles").select("*").eq("user_id", v.userId).eq("visible", true).maybeSingle(), d.from("users").select("id,username,nickname,dept,xp").eq("id", v.userId).maybeSingle()]); if (sp && su) solo = { ...sp, user: su, comment: v.comment, day: v.day }; } } catch {}

  let body: React.ReactNode = null;
  if (tab === "lounge") {
    const sub = searchParams.sub || "all";
    const [{ data: posts }] = await Promise.all([
      d.from("posts").select("id,title,body,topic,created_at,hidden,author:users(id,username,nickname,dept,xp)").eq("category", "썸").eq("hidden", false).order("created_at", { ascending: false }).limit(60),
    ]);
    const pids = (posts ?? []).map((p: any) => p.id);
    const [{ data: cc }, { data: rc }] = pids.length ? await Promise.all([d.from("comments").select("post_id").in("post_id", pids), d.from("reactions").select("target_id").eq("kind", "post").in("target_id", pids)]) : [{ data: [] as any[] }, { data: [] as any[] }];
    const nC: Record<string, number> = {}, nR: Record<string, number> = {};
    for (const c of cc ?? []) nC[c.post_id] = (nC[c.post_id] ?? 0) + 1;
    for (const r of rc ?? []) nR[r.target_id] = (nR[r.target_id] ?? 0) + 1;

    const filtered = sub === "all" ? (posts ?? []) : (posts ?? []).filter((p: any) => p.topic === sub);
    const currentTopicObj = SSUM_TOPICS.find(t => t.key === sub);

    body = <>
      <div className="sorts" style={{ margin: "2px 0 4px" }}>
        {[["all", "전체 보기"], ...SSUM_TOPICS.map(t => [t.key, `${t.icon} ${t.name}`])].map(([k, n]) => (
          <Link key={k} href={`/ssum?tab=lounge${k !== "all" ? `&sub=${k}` : ""}`} aria-current={sub === k ? "true" : undefined}>{n}</Link>
        ))}
      </div>

      <div className="muted" style={{ fontSize: 11, padding: "0 2px" }}>
        {currentTopicObj ? currentTopicObj.hint : "🕶️ 라운지 글·댓글은 닉네임·직종 없이 익명으로 보여요. 병원명(초성 포함)·실명은 쓸 수 없고, 신고 글은 즉시 가려져요."}
      </div>

      {filtered.length ? (
        <div className="ss-feed-list">
          {filtered.map((p: any) => (
            <Link key={p.id} href={`/anon/${p.id}`} className="ss-feed-card">
              <div className="ss-feed-top">
                <span className={`ss-topic-chip ${p.topic}`}>
                  {topicOf(p.topic).icon} {topicOf(p.topic).name}
                </span>
                <span className="ss-feed-time">{fmt(p.created_at)}</span>
              </div>
              <h4 className="ss-feed-title">{p.title}</h4>
              {p.body && <p className="ss-feed-body">{p.body}</p>}
              <div className="ss-feed-foot">
                <span className="ss-feed-author">🕶️ 익명{p.author?.id === s.id ? " (나)" : ""}</span>
                <div className="ss-feed-stats">
                  <span>💬 {nC[p.id] ?? 0}</span>
                  <span>👍 {nR[p.id] ?? 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="ss-empty-box">
          <span style={{ fontSize: 32 }}>💌</span>
          <b>아직 등록된 글이 없어요</b>
          <span className="muted" style={{ fontSize: 12 }}>가장 먼저 조심스럽게 설렘을 털어놓아 보세요!</span>
          <Link href={`/board/new?cat=${encodeURIComponent("썸")}${currentTopicObj ? `&topic=${currentTopicObj.key}` : ""}`} className="btn" style={{ marginTop: 6, padding: "6px 14px", fontSize: 13 }}>첫 글 쓰기</Link>
        </div>
      )}

      <Link href={`/board/new?cat=${encodeURIComponent("썸")}${currentTopicObj ? `&topic=${currentTopicObj.key}` : ""}`} className="ss-fab" aria-label="글쓰기">
        ✏️ 썸 글쓰기
      </Link>
    </>;
  }
  if (tab === "me") {
    const [{ data: reqs }, quota] = await Promise.all([d.from("dm_requests").select("id,from_id,to_id,status").or(`from_id.eq.${s.id},to_id.eq.${s.id}`), dmQuota()]);
    const reqState = (other: string): "none" | "pending" | "open" | "declined" | "incoming" => { if (mutualWith(other)) return "open"; const r = (reqs ?? []).find((x: any) => (x.from_id === s.id && x.to_id === other) || (x.from_id === other && x.to_id === s.id)); if (!r) return "none"; if (r.status === "accepted") return "open"; if (r.status === "declined") return r.from_id === s.id ? "declined" : "none"; return r.from_id === s.id ? "pending" : "incoming"; };
    const [{ data: mine }, { data: profs }, { data: intros }] = await Promise.all([
      d.from("dating_profiles").select("*").eq("user_id", s.id).maybeSingle(),
      (gf ? d.from("dating_profiles").select("*,user:users!inner(id,username,nickname,dept,xp,stealth)").eq("gender", gf) : d.from("dating_profiles").select("*,user:users!inner(id,username,nickname,dept,xp,stealth)")).eq("visible", true).neq("user_id", s.id).order("updated_at", { ascending: false }).limit(60),
      (gf ? d.from("intros").select("*,author:users(id,username,nickname,dept,xp)").eq("gender", gf) : d.from("intros").select("*,author:users(id,username,nickname,dept,xp)")).order("created_at", { ascending: false }).limit(30),
    ]);
    body = <>
      <div className="ss-photo-guide" style={{ background: "rgba(244, 143, 177, 0.08)", border: "1px dashed rgba(244, 143, 177, 0.35)", borderRadius: 12, padding: "10px 14px", fontSize: 12, lineHeight: 1.5, color: "var(--ink)", margin: "4px 0" }}>
        📸 <b>사진 올리기 꿀팁</b>: 얼굴 노출이 부담스럽다면 <b>가운 착샷, 사원증(이름 가림), 뒷모습, 취미·반려동물 사진</b>도 인기 만점이에요! 서로 호감이 맺어지기 전까진 흐리게(블러) 안전하게 보호돼요.
      </div>
      <details className="card ss-details" open={false}>
        <summary>
          <b>{mine ? "✏️ 내 셀소 카드 수정하기" : "✨ 1분 만에 내 셀소 카드 만들기 ➕"}</b>
        </summary>
        <ProfileForm p={mine} />
      </details>
      <details className="card ss-details" open={false}>
        <summary>
          <b>🤝 지인(친구·동료) 대신 소개하기</b> <span className="muted">— 동의 필수</span>
        </summary>
        <IntroForm />
      </details>
      {mine && <Card p={mine} see head={<><b>{display(s.dept, s.nickname)}</b><span className="muted" style={{ fontSize: 12 }}>내 카드</span><span className="tag">{mine.visible ? "공개 중" : "비공개"}</span></>} />}
      <GFilter t="me" />
      <div className="ss-cards">
        {(profs ?? []).filter((p: any) => !p.user.stealth).map((p: any) => (
          <Card key={p.user_id} p={p} see={admin || mutualWith(p.user_id)}
            head={<Name r={rankFor(p.user, leaders)} dept={p.user.dept} nickname={p.user.nickname} username={p.user.username} />}
            foot={<><LikeButton kind="profile" target={p.user_id} liked={liked("profile", p.user_id)} /><DmRequestButton to={p.user_id} left={quota.left} total={quota.total} state={reqState(p.user_id)} />{admin && <PickSolo userId={p.user_id} />}</>} />
        ))}
        {(intros ?? []).map((p: any) => (
          <Card key={"intro-" + p.id} p={p} see={admin || p.author_id === s.id}
            head={<><span className="tag" style={{ background: "rgba(244, 143, 177, 0.2)", color: "#D81B60", fontWeight: 700 }}>🤝 동료 추천</span><span className="tag">{p.dept || "지인"}</span><span className="muted" style={{ fontSize: 12 }}>{p.author ? `${display(p.author.dept, p.author.nickname)}님의 지인` : ""}</span></>}
            foot={<>{p.author_id !== s.id && <LikeButton kind="intro" target={String(p.id)} liked={liked("intro", String(p.id))} label="소개받고 싶어요" dm={p.author_id} />}{(admin || p.author_id === s.id) && <form action={deleteIntro.bind(null, p.id)}><button className="link">삭제</button></form>}</>} />
        ))}
        {!profs?.length && !intros?.length && <div className="muted" style={{ gridColumn: "1/-1", textAlign: "center", padding: "30px 0" }}>아직 공개된 카드가 없어요. 첫 카드를 올려보세요!</div>}
      </div>
    </>;
  }
  if (tab === "meet") {
    const area = searchParams.area && (MEET_AREAS as readonly string[]).includes(searchParams.area) ? searchParams.area : "";
    const since = new Date(Date.now() - 3 * 3600000).toISOString();
    let q = d.from("meetups").select("*,host:users!meetups_host_id_fkey(id,username,nickname,dept,xp)").neq("status", "canceled").gte("when_at", since).order("when_at").limit(60);
    if (area) q = q.eq("area", area);
    const [{ data: ms }, { data: myMem }, { data: myProf }] = await Promise.all([q, d.from("meetup_members").select("meetup_id").eq("user_id", s.id).eq("status", "joined"), d.from("dating_profiles").select("region").eq("user_id", s.id).maybeSingle()]);
    const ids = (ms ?? []).map(m => m.id);
    const { data: cnt } = ids.length ? await d.from("meetup_members").select("meetup_id").in("meetup_id", ids).eq("status", "joined") : { data: [] as any[] };
    const n = (id: number) => (cnt ?? []).filter((c: any) => c.meetup_id === id).length;
    const mine = new Set((myMem ?? []).map(x => x.meetup_id));
    const today = (ms ?? []).filter(m => whenLabel(m.when_at).startsWith("오늘")), later = (ms ?? []).filter(m => !whenLabel(m.when_at).startsWith("오늘"));
    const Row = ({ m }: { m: any }) => { const k = kindOf(m.kind), c = n(m.id), closed = Date.parse(m.when_at) < Date.now() - 3 * 3600000; return (
      <div className={"mt-row" + (mine.has(m.id) ? " mine" : "")}>
        <span className="mt-ico">{k.icon}</span>
        <div className="mt-body"><Link href={`/ssum/meet/${m.id}`} className="mt-title">{m.title}</Link>
          <div className="mt-meta"><b>{whenLabel(m.when_at)}</b> · {m.area}{m.place ? ` · ${m.place}` : ""}{m.gender ? ` · ${m.gender}성만` : ""}</div>
          <div className="mt-meta muted">{m.host ? display(m.host.dept, m.host.nickname) : "회원"} 주최 · <span className={c >= m.cap ? "" : "mt-open"}>{c}/{m.cap}명{c < m.cap ? ` · ${m.cap - c}자리 남음` : ""}</span></div></div>
        <JoinButton id={m.id} joined={mine.has(m.id)} host={m.host_id === s.id} full={c >= m.cap} closed={closed} />
      </div>); };
    body = <>
      <div className="mt-intro"><b>⚡ 번개</b> — 오늘 오프인데 심심할 때, 교대 끝나고 한잔할 때. 지역·시간만 정하고 가볍게 모여요. <span className="muted">참여자끼리 모임 채팅방이 열려요.</span></div>
      <details className="card ss-details"><summary><b>⚡ 번개 열기</b> <span className="muted">— 2주 안, 2~10명, 동시에 3개까지</span></summary><MeetForm defaultArea={myProf?.region?.includes("서울") ? "서울" : undefined} /></details>
      <div className="topics scroll">{["", ...MEET_AREAS].map(a => <Link key={a} href={`/ssum?tab=meet${a ? `&area=${encodeURIComponent(a)}` : ""}`} className={"topic" + (area === a ? " on" : "")}>{a || "전체"}</Link>)}</div>
      {today.length > 0 && <><div className="mt-sec">🔥 오늘</div>{today.map(m => <Row key={m.id} m={m} />)}</>}
      {later.length > 0 && <><div className="mt-sec">📅 다가오는 번개</div>{later.map(m => <Row key={m.id} m={m} />)}</>}
      {!ms?.length && <div className="ss-empty-box" style={{ padding: "30px 20px" }}><span style={{ fontSize: 36 }}>⚡</span><b>아직 열린 번개가 없어요</b><p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>첫 번개를 열면 +30 XP! "오늘 오프 커피" 한 줄이면 충분해요.</p></div>}
      <div className="muted" style={{ fontSize: 12 }}>⚠️ 처음 만나는 자리는 카페·식당 같은 공개 장소에서, 연락처는 충분히 대화한 뒤에. 불쾌한 일은 문의하기로 알려주세요.</div>
    </>;
  }
  if (tab === "box") {
    const [{ data: inReq }, { data: outReq }] = await Promise.all([
      d.from("dm_requests").select("id,from_id,msg,hide_dept,status,created_at,user:users!dm_requests_from_id_fkey(id,nickname,dept)").eq("to_id", s.id).order("created_at", { ascending: false }).limit(30),
      d.from("dm_requests").select("id,to_id,status,created_at,user:users!dm_requests_to_id_fkey(id,nickname,dept)").eq("from_id", s.id).order("created_at", { ascending: false }).limit(30),
    ]);
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
    const acceptedIds = [...(got ?? []).filter(c => c.status === "accepted").map(c => c.from_id), ...(inReq ?? []).filter((r: any) => r.status === "accepted").map((r: any) => r.from_id), ...(outReq ?? []).filter((r: any) => r.status === "accepted").map((r: any) => r.to_id)];
    const seen = new Set<string>(); const lastBy: any[] = [];
    for (const m of threads ?? []) { const other = m.a === s.id ? m.b : m.a; if (!seen.has(other)) { seen.add(other); lastBy.push({ other, ...m }); } }
    const otherIds = Array.from(new Set([...lastBy.map(t => t.other), ...acceptedIds]));
    const { data: others } = otherIds.length ? await d.from("users").select("id,nickname,dept").in("id", otherIds) : { data: [] as any[] };
    const nameOf = (id: string) => { const u = (others ?? []).find((x: any) => x.id === id); return u ? display(u.dept, u.nickname) : "회원"; };

    const newConnections = [...mutual.map((l: any) => l.from_id), ...acceptedIds, ...(introLikers ?? []).map((l: any) => l.from_id)].filter(id => !seen.has(id)).filter((v, i, a) => a.indexOf(v) === i);
    const hasAnyActivity = lastBy.length > 0 || newConnections.length > 0 || (got?.length ?? 0) > 0 || (likers?.length ?? 0) > 0 || (sent?.length ?? 0) > 0 || (inReq?.length ?? 0) > 0 || (outReq?.length ?? 0) > 0;
    const pendingIn = (inReq ?? []).filter((r: any) => r.status === "pending");

    body = <>
      {!hasAnyActivity && (
        <div className="ss-empty-box" style={{ padding: "30px 20px", background: "linear-gradient(135deg, rgba(255, 240, 245, 0.7), rgba(255, 245, 248, 0.5))" }}>
          <span style={{ fontSize: 36 }}>💌</span>
          <b style={{ fontSize: 16 }}>아직 도착한 관심이나 대화가 없어요</b>
          <p className="muted" style={{ fontSize: 13, margin: "6px 0 14px", lineHeight: 1.5, maxWidth: 360 }}>
            <b>셀소(셀프소개팅)</b>에 카드를 올려두면 나에게 관심(💗)을 보낸 사람들을 여기서 바로 확인할 수 있어요! 서로 하트를 누르면 1:1 대화방이 열려요.
          </p>
          <Link href="/ssum?tab=me" className="btn" style={{ padding: "8px 18px", fontSize: 13 }}>🙋 내 셀소 카드 만들러 가기 →</Link>
        </div>
      )}

      {pendingIn.length > 0 && (
        <section className="card ss-reqbox">
          <h3>💌 1:1 대화 신청 {pendingIn.length}건</h3>
          {pendingIn.map((r: any) => <div key={r.id} className="ss-req"><div><b>{r.hide_dept ? `[비공개]${r.user?.nickname ?? "회원"}` : r.user ? display(r.user.dept, r.user.nickname) : "회원"}</b><span className="time" style={{ marginLeft: 6 }}>{fmt(r.created_at)}</span>{r.msg && <div className="ss-req-msg">“{r.msg}”</div>}</div><DmRequestAnswer id={r.id} /></div>)}
          <div className="muted" style={{ fontSize: 12 }}>수락하면 1:1 대화방이 열려요. 거절해도 상대에게 이유는 보이지 않아요.</div>
        </section>
      )}
      {(lastBy.length > 0 || newConnections.length > 0) && (
        <section className="card">
          <h3>💬 1:1 대화방</h3>
          {lastBy.map(t => <Link key={t.other} href={`/ssum/dm/${t.other}`} className="h-row"><span className="h-topic">💬</span><span className="h-title">{nameOf(t.other)}</span><span className="h-meta">{t.sender === s.id ? "나: " : ""}{t.text.slice(0, 40)} · {fmt(t.created_at)}</span></Link>)}
          {newConnections.map(id => <Link key={id} href={`/ssum/dm/${id}`} className="ss-newdm">💘 {(likers ?? []).find((l: any) => l.from_id === id)?.user ? display((likers as any).find((l: any) => l.from_id === id).user.dept, (likers as any).find((l: any) => l.from_id === id).user.nickname) : (introLikers ?? []).find((l: any) => l.from_id === id)?.user ? display((introLikers as any).find((l: any) => l.from_id === id).user.dept, (introLikers as any).find((l: any) => l.from_id === id).user.nickname) : nameOf(id)} 님과 대화 시작하기 →</Link>)}
        </section>
      )}

      {((likers?.length ?? 0) > 0 || (got?.length ?? 0) > 0) && (
        <section className="card">
          <h3>💗 나에게 도착한 관심 & 고백</h3>
          {likers?.length ? likers.map((l: any) => <div key={l.from_id} className="meta" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}><b>{l.user ? display(l.user.dept, l.user.nickname) : "회원"}</b><span className="time">{fmt(l.created_at)}</span>{liked("profile", l.from_id) ? <span className="tag">💘 서로 관심 (대화 가능)</span> : <span className="muted" style={{ fontSize: 12 }}>나도 맞하트를 누르면 1:1 대화방 오픈!</span>}</div>) : null}
          {got?.length ? got.map(c => <div key={c.id} className="ss-conf"><div className="ss-conf-text">익명 고백: “{c.text}”</div><div className="meta"><span className="time">{fmt(c.created_at)}</span>
            {c.status === "pending" ? <><form action={answerConfession.bind(null, c.id, true)}><button className="btn" style={{ padding: "4px 12px" }}>💘 수락 (대화하기)</button></form><form action={answerConfession.bind(null, c.id, false)}><button className="link">정중히 거절</button></form></> : <span className="tag">{c.status === "accepted" ? `수락함 · ${nameOf(c.from_id)}` : "거절함"}</span>}</div></div>) : null}
        </section>
      )}

      <details className="card ss-details"><summary><b>🤫 회원에게 몰래 고백 보내기</b> <span className="muted">— 닉네임으로 익명 전달, 상대가 수락하면 1:1 대화가 열려요</span></summary><ConfessForm /></details>

      {outReq?.length ? (
        <section className="card">
          <h3>📨 내가 보낸 대화 신청</h3>
          {outReq.map((r: any) => <div key={r.id} className="meta"><b>{r.user ? display(r.user.dept, r.user.nickname) : "?"}</b><span className="time">{fmt(r.created_at)}</span>{r.status === "pending" ? <span className="tag">수락 대기</span> : r.status === "accepted" ? <Link className="btn" style={{ padding: "4px 12px" }} href={`/ssum/dm/${r.to_id}`}>💬 대화방</Link> : <span className="tag">다음 기회에</span>}</div>)}
        </section>
      ) : null}
      {sent?.length ? (
        <section className="card">
          <h3>📤 내가 보낸 고백</h3>
          {sent.map((c: any) => <div key={c.id} className="meta"><b>{c.to ? display(c.to.dept, c.to.nickname) : "?"}</b><span>“{c.text.slice(0, 30)}”</span><span className="tag">{c.status === "pending" ? "대기 중" : c.status === "accepted" ? "💘 수락됨" : "다음 기회에"}</span></div>)}
        </section>
      ) : null}
    </>;
  }

  return (
    <div className="games ss-page">
      <style>{`.tb { display: none !important; }`}</style>
      <div className="ss-hero-compact">
        <div className="ss-hero-main">
          <div className="ss-hero-title">
            <b>💘 썸</b>
            <span className="ss-hero-badge">만 19세 이상 익명</span>
          </div>
          <p className="ss-hero-desc">라운지는 완전 익명 ∙ 셀소 하트(💗)·대화 신청으로 1:1 연결</p>
        </div>
      </div>
      {solo && <div className="ss-solo"><div className="ss-solo-tag">⭐ 오늘의 솔로 · 요미 픽</div><Card p={solo} see={admin || solo.user_id === s.id || mutualWith(solo.user_id)} head={<Name r={rankFor(solo.user, leaders)} dept={solo.user.dept} nickname={solo.user.nickname} username={solo.user.username} />} foot={<>{solo.comment && <span className="muted">요미: “{solo.comment}”</span>}{solo.user_id !== s.id && <LikeButton kind="profile" target={solo.user_id} liked={liked("profile", solo.user_id)} />}</>} /></div>}
      <div className="cats" style={{ paddingBottom: 0 }}>{TABS.map(([k, n]) => <Link key={k} href={`/ssum?tab=${k}`} aria-current={tab === k ? "true" : undefined}>{n}</Link>)}</div>
      {body}
    </div>
  );
}
