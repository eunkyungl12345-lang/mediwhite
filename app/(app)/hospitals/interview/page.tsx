import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import InterviewForm from "@/components/jobs/InterviewForm";
import { ivKey, guessRegion } from "@/lib/interview";
import { EXT_JOBS } from "@/lib/extJobs";
import { JOB_REGIONS } from "@/lib/jobs";
export const dynamic = "force-dynamic";
export const metadata = { title: "🎤 면접 후기 쓰기 — 면접 질문·난이도·결과" };

/** 🏥 병원을 아직 고르지 않았을 때의 선택 화면 — 검색 + 최근 본 병원 + 후기가 많은 병원 */
type Row = { id: number; name: string; region: string; kind: string; iv?: number };
async function Picker({ q, note }: { q: string; note?: string }) {
  const s = (await getSession())!; const d = db();
  const qn = q.replace(/\s/g, "");
  // 검색 결과 — 이름 부분일치
  const { data: found } = q ? await d.from("hospitals").select("id,name,region,kind").ilike("name", `%${q.replace(/[%_]/g, "")}%`).order("name").limit(20) : { data: [] as any[] };
  // 최근 본 병원 — 병원 상세를 열 때 남기는 hview 이벤트
  const { data: views } = q ? { data: [] as any[] } : await d.from("events").select("text").eq("kind", "hview").eq("user_id", s.id).order("created_at", { ascending: false }).limit(40);
  const recentIds: number[] = []; if (!q) for (const v of views ?? []) { const id = Number(v.text); if (id > 0 && !recentIds.includes(id)) recentIds.push(id); if (recentIds.length >= 6) break; }
  // 면접 후기가 있는 병원 — 후기 수 많은 순
  const { data: ivs } = q ? { data: [] as any[] } : await d.from("game_state").select("game").like("game", "hintv:%").limit(3000);
  const cnt = new Map<number, number>(); for (const r of ivs ?? []) { const id = Number(String(r.game).slice(6)); if (id > 0) cnt.set(id, (cnt.get(id) ?? 0) + 1); }
  const [{ data: recentH }, { data: popH }] = await Promise.all([
    recentIds.length ? d.from("hospitals").select("id,name,region,kind").in("id", recentIds) : Promise.resolve({ data: [] as any[] }),
    cnt.size ? d.from("hospitals").select("id,name,region,kind").in("id", Array.from(cnt.keys())).limit(200) : Promise.resolve({ data: [] as any[] }),
  ]);
  const byId = new Map<number, Row>((recentH ?? []).map((h: any) => [h.id, h]));
  const recent: Row[] = recentIds.map(id => byId.get(id)).filter((h): h is Row => !!h).map(h => ({ ...h, iv: cnt.get(h.id) ?? 0 }));
  const popular: Row[] = (popH ?? []).map((h: any) => ({ ...h, iv: cnt.get(h.id) ?? 0 })).sort((a: Row, b: Row) => (b.iv ?? 0) - (a.iv ?? 0) || a.name.localeCompare(b.name)).slice(0, 8);
  const hits: Row[] = (found ?? []) as Row[];
  const list = (rs: Row[]) => <div className="sal-list">{rs.map(h => <Link key={h.id} href={`/hospitals/interview?id=${h.id}`} className="sal-row">
    <b>🏥</b><div><strong>{h.name}</strong><small>{h.region} · {h.kind}{h.iv ? ` · 🎤 면접 후기 ${h.iv}건` : ""}</small></div><em>›</em>
  </Link>)}</div>;
  return <div className="detail hc-page">
    <Link className="link" href="/hospitals">← 병원</Link>
    <h2 style={{ margin: "8px 0 4px" }}>🎤 어떤 병원 면접을 보셨어요?</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>병원을 고르면 바로 면접 후기 작성으로 이어져요. 어떤 질문을 받았는지, 결과는 어땠는지 — 다음 지원자에게 제일 큰 도움이 돼요.</p>
    {note && <div className="wz-safe" style={{ marginBottom: 10 }}>{note}</div>}
    {/* 병원 검색 — 고르면 바로 /hospitals/interview?id=로 */}
    <form action="/hospitals/interview" className="rf-search" role="search">
      <input name="q" defaultValue={q} placeholder="면접 본 병원 이름을 검색해 보세요" aria-label="병원 이름 검색" autoComplete="off" /><button className="btn">검색</button></form>
    {q ? <>
      <div className="rf-found-h" style={{ margin: "10px 0 8px" }}><b>‘{q}’ 병원 {hits.length}곳</b><Link href="/hospitals/interview">✕ 검색 해제</Link></div>
      {hits.length ? list(hits)
        : <div className="fb fb-wait"><b>등록된 병원에서 찾지 못했어요</b><p>이름이 조금 달라도 괜찮아요 — 새 병원으로 등록하고 면접 후기를 남기면 그 병원 페이지가 생겨요.</p>
          <div className="row" style={{ justifyContent: "center" }}><Link href="/hospitals/check" className="btn">🏥 새 병원 등록하고 쓰기</Link><Link href="/hospitals/interview" className="btn ghost">전체 병원에서 고르기</Link></div></div>}
    </> : <>
      {recent.length > 0 && <><div className="rv2-head"><b>🕘 최근 본 병원</b></div>{list(recent)}</>}
      {popular.length > 0 && <><div className="rv2-head" style={{ marginTop: 14 }}><b>🎤 면접 후기가 많은 병원</b></div>{list(popular)}</>}
      {!recent.length && !popular.length && <div className="fb fb-wait"><b>아직 면접 후기가 없어요</b><p>병원 이름을 검색해서 첫 후기를 남겨주세요.</p><Link href="/hospitals/check" className="btn">🏥 새 병원 등록하고 쓰기</Link></div>}
      {qn === "" && <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 12 }}>찾는 병원이 목록에 없으면 위 검색창에 이름을 쳐보세요. 메디화이트에 아직 없는 병원이면 <Link href="/hospitals/check" className="link">새 병원으로 등록</Link>하면서 후기를 남길 수 있어요.</p>}
    </>}
  </div>;
}

export default async function IvPage({ searchParams }: { searchParams: { id?: string; ext?: string; q?: string } }) {
  const s = (await getSession())!; let id = Number(searchParams.id) || 0; const d = db();
  const q = (searchParams.q ?? "").trim().slice(0, 30);
  // 🔗 외부(메디잡) 공고에서 바로 면접 후기 쓰기 — 등록된 병원이면 그 병원으로, 없으면 후기와 함께 새로 등록
  const e = searchParams.ext ? EXT_JOBS.find(x => x.id === Number(searchParams.ext)) : undefined;
  if (e && !id) { const { data: eh } = await d.from("hospitals").select("id").eq("name", e.h).limit(1).maybeSingle(); if (eh) id = eh.id;
    else return <div className="detail hc-page"><Link className="link" href={`/jobs/ext/${e.id}`}>← 공고로</Link><h2 style={{ margin: "8px 0 4px" }}>🎤 {e.h} 면접 후기</h2>
      <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>어떤 질문을 받았는지, 결과는 어땠는지 — 다음 지원자에게 제일 큰 도움이 돼요.</p>
      <div className="card"><InterviewForm hid={0} dept={s.dept} mine={null} ext={{ id: e.id, name: e.h, region: guessRegion(e.area, JOB_REGIONS), regions: JOB_REGIONS }} /></div></div>; }
  // 🏥 병원을 안 고르고 들어온 경우(검색 결과에서 바로 온 /hospitals/interview?q= 포함) — 막다른 에러 대신 병원 선택 화면
  if (!id) return <Picker q={q} />;
  const { data: h } = await d.from("hospitals").select("id,name").eq("id", id).maybeSingle();
  if (!h) return <Picker q={q} note={`병원 #${id}을(를) 찾지 못했어요. 아래에서 다시 골라주세요.`} />;
  const { data: m } = await d.from("game_state").select("state").eq("user_id", s.id).eq("game", ivKey(id)).maybeSingle();
  return <div className="detail hc-page"><Link className="link" href={`/hospitals/${id}?t=intv`}>← {h.name}</Link><h2 style={{ margin: "8px 0 4px" }}>🎤 {h.name} 면접 후기</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>어떤 질문을 받았는지, 술기 시험은 뭐였는지 — 다음 지원자에게 제일 큰 도움이 돼요.</p>
    <div className="card"><InterviewForm hid={id} dept={s.dept} mine={(m?.state as any) ?? null} /></div></div>;
}
