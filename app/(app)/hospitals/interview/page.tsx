import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import InterviewForm from "@/components/jobs/InterviewForm";
import { ivKey, guessRegion } from "@/lib/interview";
import { EXT_JOBS } from "@/lib/extJobs";
import { JOB_REGIONS } from "@/lib/jobs";
export const dynamic = "force-dynamic";
export default async function IvPage({ searchParams }: { searchParams: { id?: string; ext?: string } }) {
  const s = (await getSession())!; let id = Number(searchParams.id) || 0; const d = db();
  // 🔗 외부(메디잡) 공고에서 바로 면접 후기 쓰기 — 등록된 병원이면 그 병원으로, 없으면 후기와 함께 새로 등록
  const e = searchParams.ext ? EXT_JOBS.find(x => x.id === Number(searchParams.ext)) : undefined;
  if (e && !id) { const { data: eh } = await d.from("hospitals").select("id").eq("name", e.h).limit(1).maybeSingle(); if (eh) id = eh.id;
    else return <div className="detail hc-page"><Link className="link" href={`/jobs/ext/${e.id}`}>← 공고로</Link><h2 style={{ margin: "8px 0 4px" }}>🎤 {e.h} 면접 후기</h2>
      <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>어떤 질문을 받았는지, 결과는 어땠는지 — 다음 지원자에게 제일 큰 도움이 돼요.</p>
      <div className="card"><InterviewForm hid={0} dept={s.dept} mine={null} ext={{ id: e.id, name: e.h, region: guessRegion(e.area, JOB_REGIONS), regions: JOB_REGIONS }} /></div></div>; }
  const { data: h } = await d.from("hospitals").select("id,name").eq("id", id).maybeSingle();
  if (!h) return <div className="detail"><Link className="link" href="/hospitals">← 병원</Link><div className="empty">병원 화면의 '면접' 탭에서 들어와 주세요.</div></div>;
  const { data: m } = await d.from("game_state").select("state").eq("user_id", s.id).eq("game", ivKey(id)).maybeSingle();
  return <div className="detail hc-page"><Link className="link" href={`/hospitals/${id}?t=intv`}>← {h.name}</Link><h2 style={{ margin: "8px 0 4px" }}>🎤 {h.name} 면접 후기</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>어떤 질문을 받았는지, 술기 시험은 뭐였는지 — 다음 지원자에게 제일 큰 도움이 돼요.</p>
    <div className="card"><InterviewForm hid={id} dept={s.dept} mine={(m?.state as any) ?? null} /></div></div>;
}
