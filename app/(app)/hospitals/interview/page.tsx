import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import InterviewForm from "@/components/jobs/InterviewForm";
import { ivKey } from "@/lib/interview";
export const dynamic = "force-dynamic";
export default async function IvPage({ searchParams }: { searchParams: { id?: string } }) {
  const s = (await getSession())!; const id = Number(searchParams.id) || 0; const d = db();
  const { data: h } = await d.from("hospitals").select("id,name").eq("id", id).maybeSingle();
  if (!h) return <div className="detail"><Link className="link" href="/hospitals">← 병원</Link><div className="empty">병원 화면의 '면접' 탭에서 들어와 주세요.</div></div>;
  const { data: m } = await d.from("game_state").select("state").eq("user_id", s.id).eq("game", ivKey(id)).maybeSingle();
  return <div className="detail hc-page"><Link className="link" href={`/hospitals/${id}?t=intv`}>← {h.name}</Link><h2 style={{ margin: "8px 0 4px" }}>🎤 {h.name} 면접 후기</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>어떤 질문을 받았는지, 술기 시험은 뭐였는지 — 다음 지원자에게 제일 큰 도움이 돼요.</p>
    <div className="card"><InterviewForm hid={id} dept={s.dept} mine={(m?.state as any) ?? null} /></div></div>;
}
