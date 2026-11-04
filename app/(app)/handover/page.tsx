import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { HOLIDAYS_2027, NOTE_SECS, type HNote } from "@/lib/handover";
import { OpsForm } from "@/components/jobs/NoteBits";
export const dynamic = "force-dynamic";
const WD = ["일", "월", "화", "수", "목", "금", "토"];
/** 📋 인수인계 — 운영팀 인계 · 이번 주 리포트 · 최근 병원 인계 노트 · 2027 근무표 도우미 */
export default async function Handover() {
  const s = (await getSession())!; const d = db(); const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const gc = (p: string) => d.from("game_state").select("user_id", { count: "exact", head: true }).like("game", p).gte("updated_at", since);
  const [{ data: ops }, a, b, c, e, f, { count: rv }, { count: jb }, { data: views }, { data: notes }] = await Promise.all([
    d.from("settings").select("value").eq("key", "ops_notes").maybeSingle(), gc("hfact:%"), gc("hwel:%"), gc("hintv:%"), gc("hnote:%"), gc("brag:%"),
    d.from("hospital_reviews").select("id", { count: "exact", head: true }).gte("created_at", since), d.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", since),
    d.from("events").select("text").eq("kind", "hview").gte("created_at", since).limit(5000),
    d.from("game_state").select("game,state,updated_at").like("game", "hnote:%").order("updated_at", { ascending: false }).limit(12)]);
  let op: { text: string; at: string } | null = null; try { op = ops?.value ? JSON.parse(ops.value) : null; } catch {}
  const vc = new Map<number, number>(); for (const v of views ?? []) { const k = Number(v.text); if (k) vc.set(k, (vc.get(k) ?? 0) + 1); }
  const top = Array.from(vc.entries()).sort((x, y) => y[1] - x[1]).slice(0, 5), nh = (notes ?? []).map(n => Number(String(n.game).split(":")[1]));
  const ids = Array.from(new Set([...top.map(t => t[0]), ...nh])); const { data: hs } = ids.length ? await d.from("hospitals").select("id,name,region").in("id", ids) : { data: [] as any[] };
  const H = new Map((hs ?? []).map(h => [h.id, h]));
  const stat = [["🔎 실체 체크", a.count], ["⭐ 리뷰", rv], ["🎁 복지 평가", b.count], ["🎤 면접 후기", c.count], ["📋 인계 노트", e.count], ["💼 새 공고", jb]] as [string, number | null][];
  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), next = HOLIDAYS_2027.find(h => h[0] >= today);
  const months = Array.from({ length: 12 }, (_, m) => HOLIDAYS_2027.filter(h => Number(h[0].slice(5, 7)) === m + 1));
  return <div className="ho">
    <div className="ho-hero"><h2>📋 인수인계</h2><p>선배가 남긴 병원 생활 인계, 이번 주에 무슨 일이 있었는지, 내년 근무표 짤 때 볼 공휴일까지.</p></div>

    {(op?.text || s.role === "admin") && <section className="ho-card ops"><h3>📌 운영팀 인계 {op?.at && <small>{op.at.slice(5, 10).replace("-", ".")} 업데이트</small>}</h3>
      {op?.text && <p className="ho-ops">{op.text}</p>}{s.role === "admin" && <details><summary className="muted" style={{ fontSize: 13 }}>✏️ 운영팀 인계 쓰기</summary><OpsForm text={op?.text ?? ""} /></details>}</section>}

    <section className="ho-card"><h3>📊 이번 주 리포트 <small>최근 7일</small></h3>
      <div className="ho-stat">{stat.map(([n, v]) => <div key={n}><b>{v ?? 0}</b><span>{n}</span></div>)}</div>
      {top.length > 0 && <><h4>👀 많이 본 병원</h4><ol className="ho-top">{top.filter(t => H.has(t[0])).map(([id, n]) => <li key={id}><Link href={`/hospitals/${id}`}>{H.get(id)!.name}</Link><small>{H.get(id)!.region} · {n}회</small></li>)}</ol></>}
    </section>

    <section className="ho-card"><h3>🏥 최근 올라온 병원 인계</h3>
      {notes?.length ? <div className="ho-notes">{notes.filter((n, i) => H.has(nh[i])).map((n, i) => { const [, hid, sec] = String(n.game).split(":"), S = NOTE_SECS.find(x => x.k === sec), x = n.state as HNote;
        return <Link key={n.game + i} href={`/hospitals/${hid}?t=note`} className="ho-note"><small>{H.get(Number(hid))?.name} · {S?.icon} {S?.name}</small><p>{x.text}</p></Link>; })}</div>
        : <p className="muted" style={{ fontSize: 13, margin: 0 }}>아직 인계 노트가 없어요. 다니는 병원 화면의 <b>인계장</b> 탭에서 첫 인계를 남겨주세요.</p>}
      <Link href="/hospitals" className="btn ghost" style={{ justifySelf: "start" }}>병원 찾아서 인계 남기기</Link>
    </section>

    <section className="ho-card" id="cal"><h3>🗓️ 2027 근무표 도우미 <small>공휴일 {HOLIDAYS_2027.length}일 (대체공휴일 포함)</small></h3>
      {next && <p className="ho-next">다음 공휴일은 <b>{Number(next[0].slice(5, 7))}월 {Number(next[0].slice(8))}일({WD[new Date(next[0]).getDay()]}) {next[1]}</b></p>}
      <div className="ho-cal">{months.map((hs2, m) => <div key={m} className={hs2.length ? "" : "none"}><b>{m + 1}월 <em>{hs2.length || ""}</em></b>{hs2.map(h => <span key={h[0]} className={h[1].startsWith("대체") ? "sub" : ""}>{Number(h[0].slice(8))}일({WD[new Date(h[0]).getDay()]}) {h[1].replace("대체공휴일", "대체")}</span>)}</div>)}</div>
      <p className="muted" style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>5인 이상 병원은 공휴일이 유급휴일이라, 공휴일에 근무하면 휴일근로수당(통상임금의 1.5배 이상)이나 대체휴무를 받을 수 있어요. 날짜는 한국천문연구원 월력 자료 기준이고, 정부 공식 발표로 확정돼요.</p>
    </section>
  </div>;
}
