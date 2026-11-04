import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import WelfareForm from "@/components/jobs/WelfareForm";
import { welKey } from "@/lib/welfare";
export const dynamic = "force-dynamic";
export default async function WelPage({ searchParams }: { searchParams: { id?: string } }) {
  const s = (await getSession())!; const id = Number(searchParams.id) || 0; const d = db();
  const { data: h } = await d.from("hospitals").select("id,name").eq("id", id).maybeSingle();
  if (!h) return <div className="detail"><Link className="link" href="/hospitals">← 병원</Link><div className="empty">병원 화면의 ‘복지’ 탭에서 들어와 주세요.</div></div>;
  const { data: m } = await d.from("game_state").select("state").eq("user_id", s.id).eq("game", welKey(id)).maybeSingle();
  return <div className="detail hc-page"><Link className="link" href={`/hospitals/${id}?t=welfare`}>← {h.name}</Link><h2 style={{ margin: "8px 0 4px" }}>🎁 복지 평가</h2>
    <div className="wz-safe" style={{ marginBottom: 10 }}>🔒 입력하신 모든 정보는 <b>익명으로 처리</b>돼요. 여러 명이 모여야 합친 숫자로만 공개돼요.</div>
    <div className="card"><WelfareForm hid={id} name={h.name} mine={(m?.state as any) ?? null} /></div></div>;
}
