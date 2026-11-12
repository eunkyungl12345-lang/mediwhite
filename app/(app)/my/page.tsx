import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { rankFor, deptLeaders } from "@/lib/ranksvc";
import Avatar from "@/components/Avatar";
import { lockMode, freeLeft } from "@/lib/hospFactsDb";
export const metadata = { title: "MY" };
export const dynamic = "force-dynamic";
/** 👤 MY — 내 프로필 · 열람권 · 인증 · 내 활동(체크·리뷰·면접·공고) · 설정 */
export default async function MyPage() {
  const s = (await getSession())!; const d = db(); const half = 183 * 86400000;
  const [{ data: me }, leaders, { data: gs }, { data: revs }, { data: jobs }, { count: unread }] = await Promise.all([
    d.from("users").select("id,nickname,dept,xp,blue_badge,created_at").eq("id", s.id).maybeSingle(), deptLeaders(),
    d.from("game_state").select("game,state,updated_at").eq("user_id", s.id).or("game.like.hfact:%,game.like.hintv:%,game.like.hverify:%"),
    d.from("hospital_reviews").select("id,hospital_id,created_at,hidden").eq("user_id", s.id),
    d.from("jobs").select("id,hospital,dept,closed,created_at").eq("author_id", s.id).order("created_at", { ascending: false }).limit(20),
    d.from("notis").select("id", { count: "exact", head: true }).eq("user_id", s.id).eq("read", false).then(r => r, () => ({ count: 0 } as any)),
  ]);
  const rows = gs ?? [], of = (p: string) => rows.filter(r => String(r.game).startsWith(p));
  const checks = of("hfact:"), ivs = of("hintv:"), vers = of("hverify:");
  const hids = Array.from(new Set([...rows.map(r => Number(String(r.game).split(":")[1])), ...(revs ?? []).map(r => r.hospital_id)])).filter(Boolean);
  const { data: hs } = hids.length ? await d.from("hospitals").select("id,name").in("id", hids) : { data: [] as any[] }; const hn = (id: number) => (hs ?? []).find(h => h.id === id)?.name ?? "병원";
  const lastC = Math.max(0, ...checks.map(r => Date.parse(r.updated_at)), ...(revs ?? []).map(r => Date.parse(r.created_at)));
  const [mode, free] = await Promise.all([lockMode(), freeLeft(s.id)]);
  const left = lastC ? Math.ceil((lastC + half - Date.now()) / 86400000) : 0, unlocked = s.role === "admin" || left > 0 || mode === "off";
  const r = rankFor(me as any, leaders); const vOk = vers.filter(v => (v.state as any)?.status === "approved").length;
  const Row = ({ href, icon, t, sub }: { href: string; icon: string; t: string; sub?: string }) => <Link href={href} className="my-row"><span>{icon}</span><b>{t}</b>{sub && <small>{sub}</small>}<em>›</em></Link>;
  return <div className="my">
    <div className="my-prof"><Avatar name={me?.nickname ?? s.nickname} size={56} /><div><b>{me?.nickname ?? s.nickname}</b><small>{s.dept}{me?.blue_badge ? " · 🥇 골드뱃지" : ""}{vOk ? ` · ✅ 병원 인증 ${vOk}` : ""}</small><Link href="/rank" className="my-rank">{r.name} · {(me?.xp ?? 0).toLocaleString()} XP ›</Link></div></div>
    <div className={"my-pass" + (unlocked ? " on" : "")}>{unlocked ? <><b>🎫 열람권 사용 중</b><span>{s.role === "admin" ? "관리자" : mode === "off" && left <= 0 ? "지금은 모든 병원 정보가 열려 있어요" : `${left}일 남았어요 · 모든 병원 리뷰·급여·면접 열람`}</span></> : <><b>🔒 열람권이 없어요</b><span>{mode === "free3" ? `무료로 볼 수 있는 병원 ${free}곳 남았어요. ` : ""}다니는(다녔던) 병원 하나 제보하면 6개월간 모든 병원 정보가 열려요</span><Link href="/hospitals/check" className="btn">🔎 체크하고 열기</Link></>}</div>
    <div className="my-stats">{[["⭐", "병원 리뷰", checks.length + (revs ?? []).length], ["🎤", "면접 후기", ivs.length], ["💼", "올린 공고", (jobs ?? []).length]].map(([i, t, n]) => <div key={t as string}><b>{n as number}</b><span>{i} {t}</span></div>)}</div>
    <section className="my-sec"><h3>내 활동</h3>
      {checks.map(c => { const id = Number(String(c.game).slice(6)); return <Row key={c.game} href={`/hospitals/check?id=${id}`} icon="🔎" t={hn(id)} sub={`병원 리뷰 · ${c.updated_at.slice(0, 10)}`} />; })}
      {(revs ?? []).map(x => <Row key={x.id} href={`/hospitals/${x.hospital_id}`} icon="⭐" t={hn(x.hospital_id)} sub={`리뷰${x.hidden ? " · 🔒 검토 중" : ""}`} />)}
      {ivs.map(c => { const id = Number(String(c.game).slice(6)); return <Row key={c.game} href={`/hospitals/interview?id=${id}`} icon="🎤" t={hn(id)} sub="면접 후기" />; })}
      {(jobs ?? []).map(j => <Row key={j.id} href={`/jobs/${j.id}`} icon="💼" t={`${j.hospital} · ${j.dept}`} sub={j.closed ? "마감" : "모집 중"} />)}
      {!rows.length && !(revs ?? []).length && !(jobs ?? []).length && <div className="emp"><p>아직 활동이 없어요. 다녔던 병원부터 제보해보세요.</p><Link href="/hospitals/check" className="btn sm">🔎 다녔던 병원 제보하기 <small>+50 XP</small></Link></div>}
    </section>
    <section className="my-sec"><h3>인증</h3>
      <Row href="/badge" icon="🥇" t="면허 인증 (골드뱃지)" sub={me?.blue_badge ? "완료" : "의료인 면허로 인증"} />
      <Row href={checks[0] ? `/hospitals/verify?id=${String(checks[0].game).slice(6)}` : "/hospitals/check"} icon="✅" t="병원 재직·퇴사 인증" sub={vOk ? `${vOk}곳 완료` : "명찰·자격득실확인서"} />
    </section>
    <section className="my-sec"><h3>설정·기타</h3>
      <Row href="/noti" icon="🔔" t="알림" sub={unread ? `새 알림 ${unread}` : undefined} />
      <Row href="/fortune" icon="🔮" t="오늘의 운세" />
      <Row href="/rest" icon="🛋️" t="당직실" />
      <Row href="/support" icon="💬" t="문의·파트 응원전" />
      <Row href="/about" icon="ℹ️" t="메디화이트 소개" />
      <Row href="/terms" icon="📄" t="이용약관" />
      <Row href="/privacy" icon="🔐" t="개인정보처리방침" />
      {s.role === "admin" && <Row href="/admin" icon="🛠️" t="관리자" />}
      <form action={logout}><button className="my-out">로그아웃</button></form>
    </section>
  </div>;
}
