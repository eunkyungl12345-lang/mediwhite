import { db } from "@/lib/supabase";
import { memo } from "@/lib/memo";
/** 🏥 등록 병원 가로 롤링 — 실제로 메디화이트에 등록돼 있는 병원 이름만 (제휴·보유 데이터처럼 보이는 병원명은 넣지 않아요) */
export default async function HospMarquee() {
  const names = await memo("mq_hosp", 600_000, async () => { const { data } = await db().from("hospitals").select("name").order("id", { ascending: false }).limit(40); return (data ?? []).map(h => h.name as string); });
  if (names.length < 6) return null;
  const Row = ({ hide }: { hide?: boolean }) => <ul aria-hidden={hide || undefined}>{names.map(n => <li key={n}>🏥 {n}</li>)}</ul>;
  return <section className="mq" aria-label="메디화이트에 등록된 병원"><span className="mq-l">지금 등록된 병원 {names.length >= 40 ? "40곳+" : `${names.length}곳`} · 없는 병원은 누구나 바로 등록할 수 있어요</span>
    <div className="mq-track"><div className="mq-run"><Row /><Row hide /></div></div></section>;
}
