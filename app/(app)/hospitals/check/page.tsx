import Link from "next/link";
import { memoOnce } from "@/lib/memo";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import ReviewWrite from "@/components/jobs/ReviewWrite";
import { factKey } from "@/lib/hospFacts";
export const metadata = { title: "병원 팩트 제보" };
export const dynamic = "force-dynamic";
/** 🔎 병원 실체 체크 — 다니는/다녔던 병원 30초 익명 체크 */
export default async function CheckPage({ searchParams }: { searchParams: { id?: string; t?: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(searchParams.id) || 0;
  if (s.role !== "admin" && memoOnce("chkopen:" + s.id, 30 * 60_000)) d.from("events").insert({ kind: "chkopen", user_id: s.id, text: String(id || "") }).then(() => {}, () => {}); // 🎯 체크 화면까지 왔는지 (관리자 '진짜 유저 10명' 퍼널)
  const { data: h } = id ? await d.from("hospitals").select("id,name,region,kind").eq("id", id).maybeSingle() : { data: null };
  const { data: mine } = h ? await d.from("game_state").select("state").eq("user_id", s.id).eq("game", factKey(h.id)).maybeSingle() : { data: null };
  return <div className="detail hc-page">
    <Link className="link" href={h ? `/hospitals/${h.id}` : "/jobs"}>← {h ? h.name : "채용"}</Link>
    <h2 style={{ margin: "8px 0 4px" }}>🛡️ {h ? `${h.name} 팩트 제보` : "병원 팩트 제보"}</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6 }}>전부 <b>익명</b>이에요. 하나만 남겨도 6개월간 모든 병원의 고용 현실·실수령이 열려요.</p>
    <ReviewWrite hospital={h} dept={s.dept} mine={(mine?.state as any) ?? null} t0={searchParams.t === "pay" || searchParams.t === "alba" ? searchParams.t : "hosp"} />
  </div>;
}
