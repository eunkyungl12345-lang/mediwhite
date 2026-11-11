import { db } from "@/lib/supabase";
/** 🎯 진짜 유저 10명 — 회원 한 명씩 '가입 → 병원 조회 → 체크 화면 열기 → 체크 완료' 어디서 멈췄는지 보여줘요.
 *  운영 계정(관리자·분신·테스트)은 빼고, 목표는 체크 완료 10명 */
export default async function AdminTen() {
  const d = db();
  const [{ data: us }, { data: evH }, { data: evC }, { data: gs }, { data: rv }] = await Promise.all([
    d.from("users").select("id,nickname,dept,role,stealth,created_at,username").order("created_at", { ascending: false }).limit(500),
    d.from("events").select("user_id").eq("kind", "hview").not("user_id", "is", null).order("created_at", { ascending: false }).limit(20000),
    d.from("events").select("user_id").eq("kind", "chkopen").order("created_at", { ascending: false }).limit(20000), // 병원 조회가 아무리 많아도 체크 화면 기록이 잘리지 않게 따로 가져와요
    d.from("game_state").select("user_id,updated_at").like("game", "hfact:%").limit(5000),
    d.from("hospital_reviews").select("user_id,created_at").limit(5000),
  ]);
  const real = (us ?? []).filter(u => u.role !== "admin" && !u.stealth && !String(u.username).startsWith("zz_"));
  const cnt = (rows: any[] | null) => { const m = new Map<string, number>(); for (const r of rows ?? []) if (r.user_id) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1); return m; };
  const hv = cnt(evH), co = cnt(evC), ck = cnt(gs), rw = cnt(rv);
  const rows = real.map(u => { const done = (ck.get(u.id) ?? 0) + (rw.get(u.id) ?? 0), stage = done ? 3 : co.get(u.id) ? 2 : hv.get(u.id) ? 1 : 0; return { u, done, stage, hv: hv.get(u.id) ?? 0, co: co.get(u.id) ?? 0 }; }).sort((a, b) => b.stage - a.stage);
  const doneN = rows.filter(r => r.stage === 3).length, STAGE = ["가입만 함", "병원 조회까지", "체크 화면 열고 멈춤", "체크 완료 ✅"];
  const by = [0, 1, 2, 3].map(i => rows.filter(r => r.stage === i).length);
  return <div className="ten">
    <div className="ten-goal"><b>{doneN} / 10명</b><span>현직자 체크 완료</span><i><i style={{ width: `${Math.min(100, doneN * 10)}%` }} /></i></div>
    <div className="ten-fun">{STAGE.map((n, i) => <div key={n} className={i === 2 && by[2] ? "warn" : ""}><b>{by[i]}</b><small>{n}</small></div>)}</div>
    {rows.length ? <div className="ten-list">{rows.slice(0, 40).map(r => <div key={r.u.id} className={"ten-row s" + r.stage}>
      <b>[{r.u.dept}] {r.u.nickname}</b><span>{STAGE[r.stage]}</span><small>가입 {String(r.u.created_at).slice(5, 10).replace("-", "/")} · 병원 조회 {r.hv} · 체크 화면 {r.co} · 완료 {r.done}</small>
    </div>)}</div> : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 운영 계정 말고는 회원이 없어요.</p>}
    <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>‘체크 화면 열고 멈춤’이 많으면 체크 질문이 길거나 어려운 거예요. 그 사람에게 직접 물어보는 게 제일 빨라요. (체크 화면 기록은 오늘부터 쌓여요)</p>
  </div>;
}
