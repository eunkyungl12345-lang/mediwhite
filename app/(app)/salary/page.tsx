import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { PAY, MIN_N, type HFact } from "@/lib/hospFacts";
import { npsKey } from "@/lib/nps";
import SalaryCurve from "@/components/jobs/SalaryCurve";
export const metadata = { title: "급여" };
export const dynamic = "force-dynamic";
/** 💰 급여 — 직종별 실수령 분포·내 위치 + 공공데이터 추정 평균 월급 높은 병원 */
export default async function SalaryPage() {
  const s = (await getSession())!; const d = db();
  const [{ data: rows }, { data: npsRows }] = await Promise.all([d.from("game_state").select("user_id,state").like("game", "hfact:%").limit(10000), d.from("settings").select("key,value").like("key", "nps:%").limit(5000)]);
  const facts = (rows ?? []).map(r => ({ uid: r.user_id, s: r.state as HFact })).filter(r => r.s?.pay && (PAY as readonly string[]).includes(r.s.pay));
  const byDept: Record<string, number[]> = { 전체: PAY.map(() => 0) };
  for (const { s: f } of facts) { const i = PAY.indexOf(f.pay as any); byDept["전체"][i]++; const k = f.dept ?? "기타"; (byDept[k] ??= PAY.map(() => 0))[i]++; }
  const depts = Object.entries(byDept).filter(([k]) => k !== "전체").sort((a, b) => b[1].reduce((x, y) => x + y, 0) - a[1].reduce((x, y) => x + y, 0)).map(([k]) => k).slice(0, 8);
  const mine = facts.find(f => f.uid === s.id)?.s.pay;
  const npsList = (npsRows ?? []).map(r => { try { return { hid: Number(String(r.key).slice(4)), ...JSON.parse(r.value) }; } catch { return null; } }).filter((x: any) => x && x.avgPay > 0 && x.cnt >= 5).sort((a: any, b: any) => b.avgPay - a.avgPay).slice(0, 10) as any[];
  const { data: hs } = npsList.length ? await d.from("hospitals").select("id,name,region,kind").in("id", npsList.map(x => x.hid)) : { data: [] as any[] };
  return <div className="sal">
    <div className="sal-top"><span>등록된 실수령</span><b>총 {facts.length.toLocaleString()}건</b></div>
    <h2 className="sal-h">💰 내 급여 위치</h2>
    <SalaryCurve ranges={PAY} byDept={byDept} depts={depts} myDept={s.dept} myPay={mine} minN={MIN_N} />
    {!mine && <Link href="/hospitals/check" className="rh-empty"><b>🔎 내 실수령도 보태기</b><span>다니는 병원 체크하면서 실수령 구간을 고르면 분포가 더 정확해져요 · 익명</span></Link>}
    <h2 className="sal-h">📊 공공데이터로 본 평균 월급 높은 병원</h2>
    {npsList.length ? <div className="sal-list">{npsList.map((x, i) => { const h = (hs ?? []).find(y => y.id === x.hid); if (!h) return null; return <Link key={x.hid} href={`/hospitals/${x.hid}`} className="sal-row"><b>{i + 1}</b><div><strong>{h.name}</strong><small>{h.kind} · {h.region} · 직원 {x.cnt}명</small></div><em>{x.avgPay}만</em></Link>; })}</div>
      : <p className="muted" style={{ fontSize: 13 }}>국민연금 데이터가 연결된 병원이 늘어나면 여기에 보여요.</p>}
    <small className="muted" style={{ lineHeight: 1.6 }}>평균 월급은 국민연금 보험료로 거꾸로 계산한 세전 추정치예요. 기준소득 상한 때문에 고연봉 병원은 낮게 잡혀요.</small>
  </div>;
}
