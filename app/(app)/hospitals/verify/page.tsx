import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import VerifyForm from "@/components/jobs/VerifyForm";
import { vKey, V_LABEL, type VState } from "@/lib/hverify";
import { factKey } from "@/lib/hospFacts";
export const dynamic = "force-dynamic";
export default async function VerifyPage({ searchParams }: { searchParams: { id?: string } }) {
  const s = (await getSession())!; const d = db(); const id = Number(searchParams.id) || 0;
  const { data: h } = await d.from("hospitals").select("id,name,region").eq("id", id).maybeSingle();
  if (!h) return <div className="detail"><Link className="link" href="/hospitals">← 병원</Link><div className="empty">병원을 먼저 골라주세요. 병원 상세 화면의 '인증하기'에서 들어와요.</div></div>;
  const [{ data: v }, { data: f }] = await Promise.all([d.from("game_state").select("state").eq("user_id", s.id).eq("game", vKey(id)).maybeSingle(), d.from("game_state").select("state").eq("user_id", s.id).eq("game", factKey(id)).maybeSingle()]);
  const vs = v?.state as VState | undefined, kind0 = (f?.state as any)?.status === "퇴사" ? "exit" : "work";
  return <div className="detail hc-page"><Link className="link" href={`/hospitals/${id}`}>← {h.name}</Link>
    <h2 style={{ margin: "8px 0 4px" }}>✅ {h.name} 인증</h2>
    <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6 }}>인증하면 내 실체 체크·리뷰·자랑에 ✅ 마크가 붙어서 훨씬 믿을 만한 정보가 돼요. 닉네임은 여전히 안 보여요. <b>인증 완료 +50 XP</b></p>
    {vs?.status === "approved" ? <div className="fb-thanks">{V_LABEL[vs.kind]} 완료된 병원이에요 🙌</div> : vs?.status === "pending" ? <div className="fb-thanks">⏳ 심사 중이에요. 확인되면 알림으로 알려드려요.</div> : null}
    {vs?.status === "rejected" && <div className="error">이전 신청이 승인되지 않았어요{vs.reason ? `: ${vs.reason}` : ""}. 다시 신청할 수 있어요.</div>}
    {vs?.status !== "pending" && vs?.status !== "approved" && <div className="card"><VerifyForm hid={id} nick={s.nickname} kind0={kind0} /></div>}
  </div>;
}
