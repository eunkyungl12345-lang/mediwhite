import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { hasContributed } from "@/lib/hospFactsDb";
import { JOB_DEPTS } from "@/lib/jobs";
import type { Interview } from "@/lib/interview";
export const dynamic = "force-dynamic";
/** 🎤 면접 질문 모음 — 모든 병원 면접 후기의 '받은 질문'만 모아서 */
export default async function IvAll({ searchParams }: { searchParams: { dept?: string } }) {
  const s = (await getSession())!; const d = db(); const dept = (JOB_DEPTS as readonly string[]).includes(searchParams.dept ?? "") ? searchParams.dept! : "";
  const [{ data }, open] = await Promise.all([d.from("game_state").select("user_id,game,state").like("game", "hintv:%").order("updated_at", { ascending: false }).limit(1000), hasContributed(s.id, s.role)]);
  const rows = (data ?? []).map(r => ({ uid: r.user_id, hid: Number(String(r.game).slice(6)), ...(r.state as Interview) })).filter(x => !dept || x.dept === dept);
  const ids = Array.from(new Set(rows.map(r => r.hid))); const { data: hs } = ids.length ? await d.from("hospitals").select("id,name,kind").in("id", ids) : { data: [] as any[] };
  const H = new Map((hs ?? []).map(h => [h.id, h])); const depts = Array.from(new Set((data ?? []).map(r => (r.state as any)?.dept).filter(Boolean)));
  return <div className="detail"><Link className="link" href="/study">← 공부방·자료실</Link><h2 style={{ margin: "8px 0 2px" }}>🎤 면접 질문 모음</h2>
    <p className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>병원 면접 후기에 올라온 ‘받은 질문’만 모았어요. 면접 본 적 있다면 병원 화면의 <b>면접</b> 탭에서 남겨주세요.</p>
    {depts.length > 1 && <div className="rf-kw" style={{ marginBottom: 8 }}><Link href="/study/interview" className={!dept ? "on" : ""}>전체</Link>{depts.map(x => <Link key={x} href={`/study/interview?dept=${encodeURIComponent(x)}`} className={dept === x ? "on" : ""}>{x}</Link>)}</div>}
    {!rows.length ? <div className="fb fb-wait"><b>아직 모인 질문이 없어요</b><p>첫 면접 후기를 남겨주면 다음 지원자에게 제일 큰 도움이 돼요.</p><Link href="/hospitals" className="btn">병원 찾아서 면접 후기 남기기</Link></div>
      : <div className="rf-list">{rows.filter(r => H.has(r.hid)).map((x, i) => <article key={i} className="rf-item"><Link href={`/hospitals/${x.hid}?t=intv`} className="rf-meta" style={{ textDecoration: "none" }}><b style={{ color: "var(--ink)" }}>{H.get(x.hid)!.name}</b>  |  {x.dept}  |  {x.year}년  |  {x.result}</Link>
        {open || x.uid === s.id ? <p className="rf-pc"><em className="g">질문</em><span style={{ whiteSpace: "pre-wrap" }}>{x.q}</span></p>
          : <div className="rf-lock"><p className="rf-pc fb-blur"><em className="g">질문</em>1분 자기소개와 지원 동기, 그리고 이 병원만의 단골 질문</p><Link href="/hospitals/check" className="btn">체크 하나 남기고 면접 질문 보기</Link></div>}</article>)}</div>}
  </div>;
}
