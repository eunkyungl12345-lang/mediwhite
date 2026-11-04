import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import BragForm from "@/components/jobs/BragForm";
import { loadBrags } from "@/lib/bragDb";
export const dynamic = "force-dynamic";
export default async function NewBragPage({ searchParams }: { searchParams: { id?: string } }) {
  const s = (await getSession())!; const id = Number(searchParams.id) || 0;
  const { data: h } = id ? await db().from("hospitals").select("id,name,region").eq("id", id).maybeSingle() : { data: null };
  const mine = h ? (await loadBrags(s.id, { hid: h.id })).find(b => b.owner === s.id) : null;
  return <div className="detail"><Link className="link" href="/hospitals/brag">← 자랑대회</Link>
    <h2 style={{ margin: "8px 0 4px" }}>📸 {h ? `${h.name} 자랑하기` : "우리 병원 자랑하기"}</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>닉네임 없이 <b>직종 재직자</b>로만 표시돼요.</p>
    <div className="card"><BragForm hospital={h} mine={mine ? { tags: mine.tags, text: mine.text, urls: mine.urls } : null} /></div></div>;
}
