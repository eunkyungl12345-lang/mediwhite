import { voiceLabel } from "@/lib/jobVoice";
import AdminHVerify from "@/components/AdminHVerify";
import { XrayPhotoAdmin } from "@/components/XrayGallery";
import { pendingXrayPhotos } from "@/lib/xrayPhotoDb";
import AdminFocus from "@/components/AdminGrowth";
import AdminLock from "@/components/AdminLock";
import AdminTen from "@/components/AdminTen";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import AdminPromo from "@/components/AdminPromo";
import { lockMode } from "@/lib/hospFactsDb";
import { getFocus } from "@/lib/focus";
import { MIN_N } from "@/lib/hospFacts";
import { hverifyPending } from "@/lib/hverify.actions";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { RANKS } from "@/lib/ranks";
import { deptLeaders, rankFor } from "@/lib/ranksvc";
import { adminToggleStealth, adminDeleteUser, adminLoginAs, adminDemote, resolveReport, adminSetChatRooms } from "@/lib/actions";
import AdminForms from "@/components/AdminForms";
import AdminSupport from "@/components/AdminSupport";
import AdminResetPw from "@/components/AdminResetPw";
import { bankInfo, deptPools, contactEmail } from "@/lib/support";
import AdminContact from "@/components/AdminContact";
import AdminBroadcast from "@/components/AdminBroadcast";
import AdminBadges from "@/components/AdminBadges";
import AdminProofs from "@/components/AdminProofs";
import Stats from "@/components/Stats";
import { setInquiryStatus } from "@/lib/actions";
import { confirmContribution } from "@/lib/actions";
import { fmt } from "@/lib/format";
import Link from "next/link";
import { REPORT_REASONS } from "@/lib/safety";
import Name from "@/components/Name";
export const metadata = { title: "관리자" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const s = (await getSession())!;
  if (s.role !== "admin") redirect("/board");
  const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
  const [{ data: vis }, { data: signups0 }, { count: msg24 }, { count: postsAll }, { count: scores24 }] = await Promise.all([
    db().from("visits").select("day,user_id,hits").gte("day", since),
    db().from("users").select("id,created_at,role,username").eq("stealth", false),
    db().from("messages").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    db().from("posts").select("id", { count: "exact", head: true }),
    db().from("scores").select("user_id", { count: "exact", head: true }).gte("updated_at", new Date(Date.now() - 86400000).toISOString()),
  ]);
  const kst = (d: string | Date) => new Date(new Date(d).getTime() + 9 * 3600000).toISOString().slice(0, 10);
  const days: string[] = Array.from({ length: 14 }, (_, i) => kst(new Date(Date.now() - (13 - i) * 86400000)));
  const visByDay: Record<string, Set<string>> = Object.fromEntries(days.map(d => [d, new Set<string>()])); const realU = (signups0 ?? []).filter(u => u.role !== "admin" && !String(u.username).startsWith("zz_")), realIds = new Set(realU.map(u => u.id)), signups = realU; // 지표는 진짜 회원만 (관리자·테스트 계정 제외)
  for (const v of vis ?? []) if (realIds.has(v.user_id)) visByDay[v.day]?.add(v.user_id);
  const signByDay: Record<string, number> = Object.fromEntries(days.map(d => [d, 0])); for (const u of signups ?? []) { const k = kst(u.created_at); if (k in signByDay) signByDay[k]++; }
  const series = days.map(d => ({ day: d.slice(5), visitors: visByDay[d].size, signups: signByDay[d] }));
  const [{ data: inq }, email] = await Promise.all([db().from("inquiries").select("*").order("created_at", { ascending: false }).limit(50), contactEmail()]);
  const KIND: Record<string, string> = { ad: "광고", partner: "협업", bug: "오류", other: "기타" };
  const [{ data: dps }, { data: its }, { count: dmCount }, { count: cfAcc }] = await Promise.all([db().from("dating_profiles").select("gender,visible"), db().from("intros").select("gender"), db().from("dms").select("id", { count: "exact", head: true }), db().from("confessions").select("id", { count: "exact", head: true }).eq("status", "accepted")]);
  const gcount = (rows: any[] | null, g: string) => (rows ?? []).filter(r => r.gender === g).length;
  const [{ data: peaks }, { data: roomsSet }] = await Promise.all([db().from("online_peaks").select("day,peak,at").order("day", { ascending: false }).limit(30), db().from("settings").select("value").eq("key", "chat_rooms").maybeSingle()]);
  const todayPeak = peaks?.[0]?.peak ?? 0, maxPeak = Math.max(0, ...(peaks ?? []).map(p => p.peak)), roomsOn = roomsSet?.value === "on";
  const { data: reports } = await db().from("reports").select("id,kind,target_id,reason,detail,status,created_at,reporter:users!reports_reporter_id_fkey(nickname,dept)").order("created_at", { ascending: false }).limit(50);
  const openR = (reports ?? []).filter(r => r.status === "open");
  const rPosts = openR.filter(r => r.kind === "post").map(r => r.target_id), rComs = openR.filter(r => r.kind === "comment").map(r => Number(r.target_id));
  const [{ data: rp }, { data: rc }] = await Promise.all([rPosts.length ? db().from("posts").select("id,title,body").in("id", rPosts) : Promise.resolve({ data: [] as any[] }), rComs.length ? db().from("comments").select("id,text").in("id", rComs) : Promise.resolve({ data: [] as any[] })]);
  const rJobs = openR.filter(r => r.kind === "job").map(r => Number(r.target_id)), rRevs = openR.filter(r => r.kind === "review").map(r => Number(r.target_id));
  const [{ data: rj }, { data: rr }] = await Promise.all([rJobs.length ? db().from("jobs").select("id,hospital,body").in("id", rJobs) : Promise.resolve({ data: [] as any[] }), rRevs.length ? db().from("hospital_reviews").select("id,pros,cons,hospital:hospitals(name)").in("id", rRevs) : Promise.resolve({ data: [] as any[] })]);
  const preview = (r: any) => r.kind === "post" ? (rp ?? []).find((p: any) => p.id === r.target_id) : r.kind === "job" ? (() => { const j = (rj ?? []).find((x: any) => String(x.id) === r.target_id); return j ? { title: `[채용] ${j.hospital}`, body: j.body } : null; })() : r.kind === "review" ? (() => { const v: any = (rr ?? []).find((x: any) => String(x.id) === r.target_id); return v ? { title: `[리뷰] ${v.hospital?.name ?? ""}`, body: `장점: ${v.pros}\n단점: ${v.cons}` } : null; })() : (rc ?? []).find((c: any) => String(c.id) === r.target_id);
  const KINDL: Record<string, string> = { post: "글", comment: "댓글", job: "채용공고", review: "병원 리뷰" };
  const [{ data: users }, leaders, bank, { rows: pools }, { data: pending }] = await Promise.all([
    db().from("users").select("id,username,nickname,dept,xp,role,stealth,seq,join_order,created_at").order("seq"), deptLeaders(), bankInfo(), deptPools(),
    db().from("contributions").select("id,dept,amount,points,depositor,created_at,users(nickname)").eq("status", "pending").order("created_at"),
  ]);
  const { data: proofReqs } = await db().from("review_proofs").select("id,path,created_at,user:users(nickname,dept,username),hospital:hospitals(name,region),review:hospital_reviews(dept,status,pros)").eq("status", "pending").order("created_at");
  const { data: badgeReqs } = await db().from("badge_requests").select("id,user_id,id_path,lic_path,note,created_at,user:users(nickname,dept,username)").eq("status", "pending").order("created_at");
  const hvReqs = await hverifyPending();
  const ago7 = new Date(Date.now() - 7 * 86400000).toISOString(), day7 = new Date(Date.now() + 9 * 3600000 - 7 * 86400000).toISOString().slice(0, 10);
  const [focus, { data: hf }, { data: wv }, { count: sign7 }, { data: hvAll }, { count: out7 }, { data: tds }, { data: hvU }, { data: gold }] = await Promise.all([getFocus(), db().from("game_state").select("game,updated_at").like("game", "hfact:%").limit(10000), db().from("visits").select("user_id").gte("day", day7).limit(20000), db().from("users").select("id", { count: "exact", head: true }).gte("created_at", ago7), db().from("game_state").select("state").like("game", "hverify:%").limit(10000), db().from("events").select("id", { count: "exact", head: true }).eq("kind", "jobout").gte("created_at", ago7), db().from("events").select("id,text,created_at").eq("kind", "takedown").order("created_at", { ascending: false }).limit(20), db().from("game_state").select("user_id,state").like("game", "hverify:%").limit(10000), db().from("users").select("id").eq("blue_badge", true)]);
  const perH: Record<string, number> = {}; for (const r of hf ?? []) perH[r.game] = (perH[r.game] ?? 0) + 1;
  const kpi = { wau: new Set((wv ?? []).map(v => v.user_id)).size, sign7: sign7 ?? 0, checks: (hf ?? []).length, checks7: (hf ?? []).filter(r => r.updated_at >= ago7).length, openH: Object.values(perH).filter(n => n >= MIN_N).length, anyH: Object.keys(perH).length, vOk: (hvAll ?? []).filter(v => (v.state as any)?.status === "approved").length, vAll: (hvAll ?? []).length, out7: out7 ?? 0, verifiedPeople: new Set([...(hvU ?? []).filter(v => (v.state as any)?.status === "approved").map(v => v.user_id), ...(gold ?? []).map(g => g.id)]).size };
  const wk = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ data: jv }, { data: jo }, { data: jvo }] = await Promise.all([db().from("events").select("text").eq("kind", "jobview").gte("created_at", wk).limit(5000), db().from("events").select("text").eq("kind", "jobout").gte("created_at", wk).limit(5000), db().from("events").select("text,created_at").eq("kind", "jobvoice").order("created_at", { ascending: false }).limit(1000)]);
  const tally = (rows: any[] | null, i: number) => { const m: Record<string, number> = {}; for (const r of rows ?? []) { const k = String(r.text).split("|")[i] || "?"; m[k] = (m[k] ?? 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const vc: Record<string, number> = {}; for (const r of jvo ?? []) for (const id of String(r.text).split("|")[0].split(",").filter(Boolean)) vc[id] = (vc[id] ?? 0) + 1;
  const vFree = (jvo ?? []).map(r => { const [, f, dp] = String(r.text).split("|"); return f ? `[${dp}] ${f}` : ""; }).filter(Boolean).slice(0, 12);
  const SRC: Record<string, string> = { pub: "🏛️ 공공", own: "🏥 병원 구인", share: "🤫 히든 공고", member: "👤 회원" };
  return (
    <div className="games">
      <nav className="adm-nav" aria-label="관리자 바로가기">{[["ten", "🎯 10명"], ["hv", "✅ 재직인증"], ["proof", "✅ 리뷰인증"], ["xr", "🩻 촬영법"], ["td", "🏥 반론"], ["rep", "🚩 신고"], ["inq", "✉️ 문의"], ["ssum", "💘 썸"], ["jobs", "📊 채용"], ["users", "👥 회원"]].map(([k, n]) => <a key={k} href={`#a-${k}`}>{n}</a>)}</nav>
      <Stats series={series} totals={{ users: (signups ?? []).length, today: series[series.length - 1]?.visitors ?? 0, msg24h: msg24 ?? 0, posts: postsAll ?? 0, games24h: scores24 ?? 0 }} />
      <div className="card" id="kpi">
        <h3 id="a-ten">🎯 진짜 유저 10명 (11/17 목표)</h3><AdminTen />
        <h3 style={{ marginTop: 12 }}>📈 핵심 지표 (최근 7일)</h3>
        <div className="kpi">
          <div><b>{kpi.verifiedPeople}</b><span>인증된 의료인<br /><small>재직·퇴사 인증 + 골드뱃지</small></span></div>
          <div><b>{kpi.openH}</b><span>정보 공개된 병원<br /><small>체크 {MIN_N}명↑ · 체크 있는 병원 {kpi.anyH}</small></span></div>
          <div><b>{kpi.checks7}</b><span>새 실체 체크<br /><small>누적 {kpi.checks}</small></span></div>
          <div><b>{kpi.wau}</b><span>주간 방문자<br /><small>신규 가입 {kpi.sign7}</small></span></div>
          <div><b>{kpi.vAll ? Math.round(kpi.vOk / kpi.vAll * 100) : 0}%</b><span>인증 승인<br /><small>{kpi.vOk}/{kpi.vAll}건</small></span></div>
          <div><b>{kpi.out7}</b><span>공고 원문 지원 클릭</span></div>
        </div>
        <h3 style={{ marginTop: 12 }}>🔐 리뷰 열람 잠금</h3><AdminLock cur={await lockMode()} />
        <h3 style={{ marginTop: 12 }}>🏅 창립 멤버 모집 마감일 <small className="muted">(이 날까지 제보한 선착순 30명 = 평생 열람)</small></h3><AdminPromo cur={(await db().from("settings").select("value").eq("key", "open_promo").maybeSingle()).data?.value ?? ""} />
        <h3 style={{ marginTop: 12 }}>📍 집중 지역</h3><AdminFocus cur={focus} />
      </div>
      <div className="card" id="takedown">
        <h3 id="a-td">🏥 병원 반론·게시중단 요청 {tds?.length ? <span className="mt-wait">{tds.length}</span> : null}</h3>
        {(tds ?? []).length === 0 ? <div className="muted">들어온 요청이 없어요.</div> : (tds ?? []).map(t => { let x: any = {}; try { x = JSON.parse(t.text); } catch {} return <div key={t.id} className="card" style={{ padding: 10, display: "grid", gap: 4, fontSize: 13 }}>
          <b><a className="link" href={`/hospitals/${x.hid}`}>{x.hospital}</a> · {x.what}</b><span>{x.who} · 연락처 {x.contact}</span><span style={{ whiteSpace: "pre-wrap" }}>{x.detail}</span><small className="muted">{new Date(t.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · 해당 리뷰는 병원 페이지에서 신고(권리침해)로 바로 임시 블라인드할 수 있어요</small></div>; })}
      </div>
      <div className="card" id="hverify">
        <h3 id="a-hv">✅ 병원 재직·퇴사 인증 {hvReqs.length ? <span className="mt-wait">{hvReqs.length}</span> : null}</h3>
        <AdminHVerify reqs={hvReqs as any} />
        <h3 id="a-xr" style={{ marginTop: 12 }}>🩻 촬영법 사진 심사</h3><XrayPhotoAdmin rows={(await pendingXrayPhotos()).map(p => ({ uid: p.uid, game: p.game, url: p.url, kind: p.kind, note: p.note, status: p.status, slug: p.slug }))} />
      </div>
      <div className="card" id="jobstats">
        <h3 id="a-jobs">📊 채용 반응 (최근 7일)</h3>
        <div className="muted" style={{ fontSize: 12 }}>공고 열람 {(jv ?? []).length}회 · 원문 지원 클릭 {(jo ?? []).length}회 — 어디서 반응이 오는지 보고 그쪽을 더 뾰족하게</div>
        <div className="ad-js">
          <div><b>파트별 열람</b>{tally(jv, 0).slice(0, 8).map(([k, n]) => <span key={k}>{k} <em>{n}</em></span>)}</div>
          <div><b>지역별 열람</b>{tally(jv, 1).slice(0, 8).map(([k, n]) => <span key={k}>{k} <em>{n}</em></span>)}</div>
          <div><b>출처별 열람</b>{tally(jv, 2).map(([k, n]) => <span key={k}>{SRC[k] ?? k} <em>{n}</em></span>)}</div>
          <div><b>원문 지원 클릭</b>{tally(jo, 0).slice(0, 8).map(([k, n]) => <span key={k}>{k} <em>{n}</em></span>)}</div>
        </div>
        <h3 style={{ marginTop: 12 }}>🗣️ 메디잡·사람인 불편 설문 — {(jvo ?? []).length}명</h3>
        <div className="ad-js"><div>{Object.entries(vc).sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k}>{voiceLabel(k)} <em>{n}</em></span>)}</div>{vFree.length > 0 && <div><b>직접 적은 말</b>{vFree.map((f, i) => <span key={i}>{f}</span>)}</div>}</div>
      </div>
      <div className="card" id="badges">
        <h3 id="a-gold">🥇 골드뱃지 심사 {badgeReqs?.length ? <span className="mt-wait">{badgeReqs.length}</span> : null}</h3>
        <div className="muted">운전면허증 + 의료 면허·자격증 이름이 같은지 확인. 승인/거절하면 사진은 즉시 삭제돼요.</div>
        <AdminBadges reqs={(badgeReqs ?? []) as any} />
      </div>
      <div className="card" id="proofs">
        <h3 id="a-proof">✅ 병원 리뷰 재직 인증 {proofReqs?.length ? <span className="mt-wait">{proofReqs.length}</span> : null}</h3>
        <div className="muted">서류의 병원명이 리뷰 병원과 같은지, 이름이 가입자와 맞는지 확인. 처리하면 서류는 즉시 삭제.</div>
        <AdminProofs items={(proofReqs ?? []) as any} />
      </div>
      <div className="card">
        <h3>전체 폰 알림 보내기</h3>
        <div className="muted">알림을 켠 회원 모두에게 푸시. 이벤트·공지용 (하루 1~2번만 — 많으면 다 꺼버려요).</div>
        <AdminBroadcast />
      </div>
      <div className="card">
        <h3>📡 동시 접속 · 채팅방</h3>
        <div className="h-stats">
          <div className="h-stat"><b>{todayPeak}</b><span>오늘 최고</span></div>
          <div className="h-stat"><b>{maxPeak}</b><span>30일 최고</span></div>
          <div className="h-stat"><b>200</b><span>무료 한도</span></div>
          <div className="h-stat"><b>{Math.round(maxPeak / 2)}%</b><span>한도 사용</span></div>
        </div>
        <div className="muted">동시 접속 <b>150명</b> 근처가 되면 Supabase Pro(월 $25, 동시 500명)로 올리면 돼요. 코드는 그대로예요.</div>
        <div className="row" style={{ alignItems: "center" }}><span>키워드 채팅방 (전체·우리 직종·야간근무·이직·썸·게임): <b>{roomsOn ? "켜짐" : "꺼짐"}</b></span><form action={adminSetChatRooms.bind(null, !roomsOn)}><button className={"btn" + (roomsOn ? " ghost" : "")} style={{ padding: "6px 12px" }}>{roomsOn ? "끄기" : "켜기"}</button></form></div>
        <div className="muted" style={{ fontSize: 12 }}>동시 접속 30~50명쯤부터 켜는 걸 추천해요. 사람이 적을 때 방을 나누면 방마다 썰렁해져요.</div>
      </div>
      <div className="card">
        <h3 id="a-ssum">💘 썸 현황</h3>
        <div className="h-stats">
          <div className="h-stat"><b>{gcount(dps, "여")}</b><span>🙋‍♀️ 여 카드</span></div>
          <div className="h-stat"><b>{gcount(dps, "남")}</b><span>🙋‍♂️ 남 카드</span></div>
          <div className="h-stat"><b>{gcount(its, "여")}/{gcount(its, "남")}</b><span>지인 소개 여/남</span></div>
          <div className="h-stat"><b>{cfAcc ?? 0}</b><span>성사된 고백</span></div>
        </div>
        <div className="muted">공개 카드 {(dps ?? []).filter(r => r.visible).length}장 · 1:1 대화 메시지 {dmCount ?? 0}개 · 유료 전환 신호: 공개 카드 50장 이상 + 남녀 비율 균형</div>
      </div>
      <div className="card">
        <h3 id="a-rep">🚩 신고함 — 처리 대기 {openR.length}건</h3>
        <div className="muted">신고 즉시 블라인드돼요. 복구하면 다시 보이고, 삭제하면 영구 삭제. 30일 지나면 자동 복구.</div>
        {!openR.length && <div className="muted">대기 중인 신고가 없어요.</div>}
        <div className="quests">{openR.map((r: any) => { const t = preview(r); return <div key={r.id} className="quest" style={{ display: "grid", gap: 6 }}>
          <div className="meta"><span className="tag">{KINDL[r.kind] ?? r.kind}</span><b>{REPORT_REASONS.find(x => x[0] === r.reason)?.[1] ?? r.reason}</b><span>신고자 {r.reporter ? `[${r.reporter.dept}]${r.reporter.nickname}` : "-"}</span><span className="time">{fmt(r.created_at)}</span></div>
          {r.detail && <div className="muted">사유: {r.detail}</div>}
          <div style={{ whiteSpace: "pre-wrap", background: "var(--bg)", borderRadius: 8, padding: 8, fontSize: 13 }}>{t ? (r.kind !== "comment" ? <><b>{t.title}</b><br />{String(t.body).slice(0, 300)}</> : t.text) : "(이미 삭제됨)"}{r.kind === "post" && t && <> · <Link href={`/board/${r.target_id}`}>열기</Link></>}</div>
          <div className="row"><form action={resolveReport.bind(null, r.id, "restore")}><button className="btn ghost" style={{ padding: "6px 12px" }}>문제없음 · 복구</button></form><form action={resolveReport.bind(null, r.id, "delete")}><button className="btn" style={{ padding: "6px 12px", background: "#E2574C" }}>삭제 확정</button></form></div>
        </div>; })}</div>
      </div>
      <div className="card">
        <h3 id="a-inq">문의함 — 새 문의 {(inq ?? []).filter(i => i.status === "new").length}건</h3>
        <AdminContact email={email} />
        {!inq?.length && <div className="muted">아직 문의가 없어요. 문의 페이지: /contact</div>}
        <div className="quests">{inq?.map(i => <div key={i.id} className={"quest" + (i.status === "done" ? " done" : "")} style={{ display: "grid", gap: 4 }}>
          <div className="meta"><span className="tag">{KIND[i.kind] ?? i.kind}</span><b>{i.name}</b><span>{i.contact}</span><span className="time">{fmt(i.created_at)}</span>
            <form action={setInquiryStatus.bind(null, i.id, i.status === "done" ? "new" : "done")}><button className="link">{i.status === "done" ? "다시 열기" : "처리 완료"}</button></form></div>
          <div style={{ whiteSpace: "pre-wrap" }}>{i.body}</div>
        </div>)}</div>
      </div>
      <div className="card">
        <h3>파트 응원전 — 입금 확인 대기 {pending?.length ?? 0}건</h3>
        {!pending?.length && <div className="muted">대기 중인 신청이 없어요.</div>}
        <div className="quests">{pending?.map((c: any) => <div key={c.id} className="quest" style={{ alignItems: "center" }}>
          <span>[{c.dept}] {c.amount.toLocaleString()}원 → +{c.points} XP <span className="muted">· 입금자 <b>{c.depositor}</b> · {c.users?.nickname ?? "탈퇴"} · {fmt(c.created_at)}</span></span>
          <span className="row"><form action={confirmContribution.bind(null, c.id, true)}><button className="btn" style={{ padding: "6px 10px" }}>입금 확인</button></form><form action={confirmContribution.bind(null, c.id, false)}><button className="link">취소</button></form></span>
        </div>)}</div>
        <AdminSupport bank={bank} pools={pools} />
      </div>
      <div className="card">
        <h3>분신 계정 만들기</h3>
        <div className="muted">원하는 계급으로 바로 생성돼요. "숨김"을 켜면 계급표·파트 리더·접속자 수에 안 잡혀요 (일반 회원 눈에는 평범한 회원으로 보여요). 만든 뒤 아래 목록에서 "이 계정으로 전환"으로 들어가서 활동하면 돼요.</div>
        <AdminForms />
      </div>
      <div className="card">
        <h3 id="a-users">회원 {users?.length ?? 0}명</h3>
        <div className="admin-list">
          {users?.map(u => { const r = rankFor(u, leaders); return (
            <div key={u.id} className="admin-row">
              <div className="admin-main"><Name r={r} dept={u.dept} nickname={u.nickname} username={u.username} /><span className="muted">@{u.username} · {u.xp.toLocaleString()} XP · {u.join_order ?? "-"}번째{u.role === "admin" ? " · 관리자" : ""}{u.stealth ? " · 숨김" : ""}</span></div>
              <div className="admin-actions">
                <AdminForms userId={u.id} currentRank={r.index} compact />
                <AdminResetPw userId={u.id} />
                {r.index > 0 && <form action={adminDemote.bind(null, u.id, "19금 발언·욕설")}><ConfirmSubmit msg={`[${u.dept}]${u.nickname} 님을 훈련병으로 강등할까요? 경험치가 0이 돼요.`} style={{ color: "var(--signal)" }}>훈련병 강등</ConfirmSubmit></form>}
                <form action={adminToggleStealth.bind(null, u.id, !u.stealth)}><button className="link">{u.stealth ? "숨김 해제" : "숨김"}</button></form>
                <form action={adminLoginAs.bind(null, u.id)}><button className="link">이 계정으로 전환</button></form>
                {u.id !== s.id && <form action={adminDeleteUser.bind(null, u.id)}><ConfirmSubmit msg={`[${u.dept}]${u.nickname} (@${u.username}) 계정을 삭제할까요? 되돌릴 수 없어요.`} style={{ color: "var(--signal)" }}>삭제</ConfirmSubmit></form>}
              </div>
            </div>); })}
        </div>
      </div>
      <div className="card"><h3>경험치표</h3><div className="ladder">{RANKS.map(([n, x]) => <span key={n}>{n} {x.toLocaleString()}</span>)}</div></div>
    </div>
  );
}