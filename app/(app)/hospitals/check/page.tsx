import Link from "next/link";
import { memoOnce } from "@/lib/memo";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import HospCheck from "@/components/jobs/HospCheck";
import { factKey } from "@/lib/hospFacts";
export const metadata = { title: "다녔던 병원 체크" };
export const dynamic = "force-dynamic";
/** 🔎 병원 실체 체크 — 다니는/다녔던 병원 30초 익명 체크 */
export default async function CheckPage({ searchParams }: { searchParams: { id?: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(searchParams.id) || 0;
  if (s.role !== "admin" && memoOnce("chkopen:" + s.id, 30 * 60_000)) d.from("events").insert({ kind: "chkopen", user_id: s.id, text: String(id || "") }).then(() => {}, () => {}); // 🎯 체크 화면까지 왔는지 (관리자 '진짜 유저 10명' 퍼널)
  const { data: h } = id ? await d.from("hospitals").select("id,name,region,kind").eq("id", id).maybeSingle() : { data: null };
  const { data: mine } = h ? await d.from("game_state").select("state").eq("user_id", s.id).eq("game", factKey(h.id)).maybeSingle() : { data: null };
  return <div className="detail hc-page">
    <Link className="link" href={h ? `/hospitals/${h.id}` : "/jobs"}>← {h ? h.name : "채용"}</Link>
    <h2 style={{ margin: "8px 0 4px" }}>🔎 {h ? `${h.name} 리뷰 쓰기` : "다녀본 병원 리뷰 쓰기"}</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6 }}>급여, 내부 분위기, 육아휴직·임신 불이익 같은 건 <b>입사해야만</b> 알 수 있었죠. 다니는(다녔던) 병원을 탭 몇 번으로 알려주면, 다음 사람은 지원하기 전에 알 수 있어요. 한 화면에 한 질문씩, 1분이면 끝나요. 체크 하나 남기면 6개월간 모든 병원 정보가 열려요.</p>
    <div className="card"><HospCheck hospital={h} dept={s.dept} mine={(mine?.state as any) ?? null} /></div>
  </div>;
}
