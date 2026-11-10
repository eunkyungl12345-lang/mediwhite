import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import PayCard from "@/components/PayCard";
import { db } from "@/lib/supabase";
import { memo } from "@/lib/memo";
import { DEPTS } from "@/lib/depts";
export const metadata = { title: "내 통장 실수령 카드", description: "연봉을 넣으면 4대 보험·세금 뺀 통장 실수령과 진짜 시급이 나와요. 병원 이름 없이 단톡방에 공유하는 내 실수령 카드", alternates: { canonical: "/pay" } };
/** 최소 표본: 같은 직종 체크가 이만큼 모여야 '상위 %'를 보여줘요 (그 전에는 숫자를 지어내지 않고 '모으는 중') */
const MIN = 20;
const mid = (p: string) => { const m = p.match(/(\d+)\D+(\d+)/); if (m) return (Number(m[1]) + Number(m[2])) / 2; const o = p.match(/(\d+)/); return o ? Number(o[1]) * (p.startsWith("~") ? .9 : 1.1) : 0; };
/** 💳 내 통장 실수령 카드 — 로그인 없이 계산·공유. 병원 이름이 안 들어가서 마음 놓고 단톡방에 올릴 수 있는 결과물 */
export default async function PayPage() {
  const byDept = await memo("pay_dist", 10 * 60_000, async () => {
    const { data } = await db().from("game_state").select("state").like("game", "hfact:%").limit(20000); const m: Record<string, number[]> = {};
    for (const r of data ?? []) { const s = r.state as any; if (!s?.pay || !s?.dept) continue; const v = mid(String(s.pay)); if (v > 0) (m[s.dept] ??= []).push(v); }
    return m;
  });
  const dist: Record<string, number[]> = {}, cnt: Record<string, number> = {};
  for (const [k, v] of Object.entries(byDept)) { cnt[k] = v.length; if (v.length >= MIN) dist[k] = [...v].sort((a, b) => a - b); }
  return <div className="pub-bg"><div className="app"><main className="pub">
    <header className="pub-h"><Link href="/" className="pub-brand" aria-label="메디화이트 홈"><BrandLogo /></Link><Link href="/login?mode=signup" className="btn">로그인 · 가입</Link></header>
    <section className="pub-hero"><small className="pub-kicker">💳 병원 이름 없이 공유</small><h1>내 통장<br />실수령 카드</h1><p>연봉을 넣으면 <b>4대 보험·세금 뺀 실수령</b>과 <b>진짜 시급</b>이 나와요. 동기 단톡방에 올려 보세요.</p></section>
    <PayCard depts={[...DEPTS]} dist={dist} cnt={cnt} min={MIN} />
    <p className="muted" style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>2026년 근로자 부담 요율 · 1인 가구 · 비과세 식대 20만 원 기준 간이 추정이에요. 퇴직금 포함 연봉이거나 부양가족이 있으면 실제와 달라요. 입력한 숫자는 저장하지 않아요.</p>
    <Link href="/" className="pcd-home">메디화이트 — 이직 전에 그 병원 실수령 확인하는 곳 ›</Link>
  </main></div></div>;
}
