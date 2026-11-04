import Link from "next/link";
import { db } from "@/lib/supabase";
import { GUIDES } from "@/lib/deptGuides";
import { TERM_CATS } from "@/lib/terms";
import { ago } from "@/lib/format";
export const dynamic = "force-dynamic";
/** 📚 공부방·자료실 — 자료실·자료 요청·약어 사전·면접 질문·직종별 실무 가이드 */
export default async function Study() {
  const d = db();
  const [{ data: ps }, { count: ivN }] = await Promise.all([
    d.from("posts").select("id,title,topic,created_at,dept").in("topic", ["data", "req", "study"]).eq("hidden", false).neq("category", "익명").neq("category", "썸").order("created_at", { ascending: false }).limit(30),
    d.from("game_state").select("user_id", { count: "exact", head: true }).like("game", "hintv:%")]);
  const of = (t: string) => (ps ?? []).filter(p => p.topic === t).slice(0, 4), termN = TERM_CATS.reduce((a, c) => a + c.items.length, 0);
  const Box = ({ t, icon, name, hint }: { t: string; icon: string; name: string; hint: string }) => <section className="ho-card"><h3>{icon} {name}<Link href={`/board?topic=${t}`} className="st-more">더보기 ›</Link></h3>
    {of(t).length ? <div className="st-list">{of(t).map(p => <Link key={p.id} href={`/board/${p.id}`}><span>{p.title}</span><small>{ago(p.created_at)}</small></Link>)}</div> : <p className="muted" style={{ margin: 0, fontSize: 13 }}>{hint}</p>}
    <Link href={`/board/new?topic=${t}`} className="hn-add">＋ 글쓰기</Link></section>;
  return <div className="ho">
    <div className="ho-hero"><h2>📚 공부방·자료실</h2><p>서식·양식 나누고, 필요한 자료 부탁하고, 면접·국시·실무 공부까지.</p></div>
    <div className="st-tiles"><Link href="/study/terms"><span>📖</span><b>의료 약어 사전</b><small>{termN}개 · NPO, PRN, I/O…</small></Link><Link href="/study/interview"><span>🎤</span><b>면접 질문 모음</b><small>{ivN ? `면접 후기 ${ivN}개` : "병원별 받은 질문"}</small></Link><Link href="/handover#cal"><span>🗓️</span><b>근무표 도우미</b><small>2027 공휴일</small></Link></div>
    <Box t="data" icon="🗂️" name="자료실" hint="인계장 양식, 투약 계산 정리, 이력서·자소서 양식처럼 직접 만든 자료를 나눠주세요. 교재 스캔이나 유료 자료는 안 돼요." />
    <Box t="req" icon="🙋" name="자료 요청" hint="구하는 자료나 양식이 있으면 부탁해보세요." />
    <Box t="study" icon="✏️" name="공부·시험" hint="국시·자격시험·실무 공부 이야기를 나눠요." />
    <section className="ho-card"><h3>🩺 직종별 실무 가이드</h3><div className="st-list">{GUIDES.map(g => <Link key={g.slug} href={`/guide/${g.slug}`}><span>{g.icon} {g.title}</span><small>{g.depts.join("·")}</small></Link>)}<Link href="/guide/xray"><span>📖 일반촬영 포지셔닝 가이드</span><small>방사선</small></Link></div></section>
  </div>;
}
