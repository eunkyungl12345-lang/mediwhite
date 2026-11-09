import Link from "next/link";
import { db } from "@/lib/supabase";
import { GUIDES } from "@/lib/deptGuides";
import { TERM_CATS } from "@/lib/terms";
import { ago } from "@/lib/format";
import { getSession } from "@/lib/auth";
export const metadata = { title: "스터디" };
export const dynamic = "force-dynamic";
/** 📚 공부방·자료실 — 자료실·자료 요청·약어 사전·면접 질문·직종별 실무 가이드 */
const GROUPS: [string, string[]][] = [["간호", ["간호사", "간호조무사"]], ["방사선", ["방사선"]], ["물리·작업치료", ["물리치료", "작업치료사"]], ["임상병리", ["임상병리"]], ["원무·총괄", ["원무", "총괄", "의무기록사", "병원컨설팅"]], ["의사·한의사", ["의사", "한의사"]], ["약사", ["약사"]], ["치과", ["치과위생사", "치과기공사"]], ["그 밖의 직종", ["응급구조", "영양사", "임상심리사"]]];
export default async function Study({ searchParams }: { searchParams: { g?: string } }) {
  const d = db(), me = (await getSession())!, myG = GROUPS.find(g => g[1].includes(me.dept))?.[0];
  const g = GROUPS.find(x => x[0] === searchParams.g), gd = g?.[1] ?? null, has = (ds: string[] | "all") => !gd || ds === "all" || ds.some(x => gd.includes(x));
  let pq = d.from("posts").select("id,title,topic,created_at,dept").in("topic", ["data", "req", "study"]).eq("hidden", false).neq("category", "익명").neq("category", "썸").order("created_at", { ascending: false }).limit(30);
  if (gd) pq = pq.in("dept", gd);
  const [{ data: ps }, { count: ivN }] = await Promise.all([pq, d.from("game_state").select("user_id", { count: "exact", head: true }).like("game", "hintv:%")]);
  const termN = TERM_CATS.reduce((a, c) => a + c.items.length, 0), dl = (x: string) => ({ 방사선: "방사선사", 물리치료: "물리치료사", 임상병리: "임상병리사", 응급구조: "응급구조사", 원무: "원무과", 총괄: "병원총괄" } as Record<string, string>)[x] ?? x;
  /** 우리가 정리한 자료 — 직종 태그로 거르기 */
  const RES: { href: string; icon: string; name: string; sub: string; ds: string[] | "all" }[] = [
    ...GUIDES.map(x => ({ href: `/guide/${x.slug}`, icon: x.icon, name: x.title, sub: x.blurb, ds: x.depts })),
    { href: "/study/xray", icon: "🩻", name: "방사선 촬영법 폼", sub: "37개 검사 · 97개 뷰 · 포지셔닝·평가·팁", ds: ["방사선"] },
    { href: "/study/terms", icon: "📖", name: "의료 약어 사전", sub: `${termN}개 · NPO, PRN, I/O…`, ds: "all" },
    { href: gd ? `/study/interview?dept=${encodeURIComponent(gd[0])}` : "/study/interview", icon: "🎤", name: "면접 질문 모음", sub: ivN ? `면접 후기 ${ivN}개` : "병원별 받은 질문", ds: "all" },
    { href: "/handover#cal", icon: "🗓️", name: "근무표 도우미", sub: "2027 공휴일·대체공휴일", ds: "all" },
  ];
  const res = RES.filter(r => has(r.ds)), mine = res.filter(r => r.ds !== "all"), common = res.filter(r => r.ds === "all");
  const of = (t: string) => (ps ?? []).filter(p => p.topic === t).slice(0, 4);
  const Box = ({ t, icon, name, hint }: { t: string; icon: string; name: string; hint: string }) => <section className="ho-card"><h3>{icon} {name}{g && <small>{g[0]}</small>}<Link href={`/board?topic=${t}`} className="st-more">더보기 ›</Link></h3>
    {of(t).length ? <div className="st-list">{of(t).map(p => <Link key={p.id} href={`/board/${p.id}`}><span>{p.title}</span><small>{p.dept ? dl(p.dept) + " · " : ""}{ago(p.created_at)}</small></Link>)}</div> : <p className="muted" style={{ margin: 0, fontSize: 13 }}>{g ? `아직 ${g[0]} 직종이 올린 글이 없어요. 첫 글을 남겨주세요.` : hint}</p>}
    <Link href={`/board/new?topic=${t}`} className="hn-add">＋ 글쓰기</Link></section>;
  const chip = (k: string, n: string) => <Link key={k} href={k ? `/study?g=${encodeURIComponent(k)}` : "/study"} className={(g?.[0] ?? "") === k ? "on" : ""} scroll={false}>{n}</Link>;
  return <div className="ho">
    <div className="ho-hero"><h2>📚 공부방·자료실</h2><p>서식·양식 나누고, 필요한 자료 부탁하고, 면접·국시·실무 공부까지.</p></div>
    <div className="rf-kw st-chips">{chip("", "전체")}{myG && chip(myG, `⭐ 내 직종 (${myG})`)}{GROUPS.filter(x => x[0] !== myG).map(x => chip(x[0], x[0]))}</div>
    <section className="ho-card"><h3>📦 정리해 둔 자료{g && <small>{g[0]}</small>}</h3>
      {mine.length > 0 && <div className="st-res">{mine.map(r => <Link key={r.href} href={r.href}><span>{r.icon}</span><div><b>{r.name}</b><small>{r.sub}</small></div><em>{r.ds === "all" ? "공통" : (r.ds as string[]).map(dl).join("·")}</em></Link>)}</div>}
      {g && !mine.length && <p className="muted" style={{ margin: 0, fontSize: 13 }}>{g[0]} 전용 자료는 아직 준비 중이에요. 필요한 자료를 ‘자료 요청’에 남겨주세요.</p>}
      <div className="st-tiles">{common.map(r => <Link key={r.href} href={r.href}><span>{r.icon}</span><b>{r.name}</b><small>{r.sub}</small></Link>)}</div></section>
    <Box t="data" icon="🗂️" name="자료실" hint="인계장 양식, 투약 계산 정리, 이력서·자소서 양식처럼 직접 만든 자료를 나눠주세요. 교재 스캔이나 유료 자료는 안 돼요." />
    <Box t="req" icon="🙋" name="자료 요청" hint="구하는 자료나 양식이 있으면 부탁해보세요." />
    <Box t="study" icon="✏️" name="공부·시험" hint="국시·자격시험·실무 공부 이야기를 나눠요." />
  </div>;
}
