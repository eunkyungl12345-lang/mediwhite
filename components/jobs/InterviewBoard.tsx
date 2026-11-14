"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IV_FEEL, IV_FOLLOW, IV_LEVEL, IV_RESULT_LABEL, isPass } from "@/lib/interview";

export type IvItem = {
  key: string; dept: string; year: string; route: string; steps: string[];
  level: number; result: string; feel: number; wait?: number;
  q?: string; tip?: string; follow?: string; at: string;
  mine: boolean; locked: boolean;
};
export type IvRel = { id: number; name: string; region: string; kind: string; rv: number; iv: number };

const tone = (r: string) => r.startsWith("합격") ? "ok" : r === "불합격" ? "no" : "wait";
const median = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor((b.length - 1) / 2)]; };
const waitLabel = (m: number) => m >= 60 ? "한 달+" : `${m}일`;
/** 긴 후기는 4줄 정도만 보여주고 '더 보기 ›'로 펼친다 */
function Fold({ long, children }: { long: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!long);
  return <div className={"iv-fold" + (open ? " open" : "")}>
    <div className="iv-fold-in">{children}</div>
    {!open && <button type="button" className="iv-fold-btn" onClick={() => setOpen(true)}>더 보기 ›</button>}
  </div>;
}

/** 🎤 면접 탭 — 메디화이트 '문진 차트'형 면접 진단 · 필터 · Q/A 카드 */
export default function InterviewBoard({ hid, items, mine, rels, relTitle }: { hid: number; items: IvItem[]; mine: boolean; rels: IvRel[]; relTitle: string }) {
  const [dept, setDept] = useState("all"), [res, setRes] = useState<"all" | "pass" | "no" | "wait">("all");
  const depts = useMemo(() => Array.from(new Set(items.map(i => i.dept).filter(Boolean))), [items]);
  const n = items.length;
  const avg = n ? items.reduce((a, b) => a + (b.level || 0), 0) / n : 0;
  const passN = items.filter(x => isPass(x.result)).length, feelN = items.filter(x => x.feel === 0).length;
  const waits = items.map(x => x.wait).filter((w): w is number => typeof w === "number" && w > 0);
  const topSteps = useMemo(() => {
    const m = new Map<string, number>(); items.forEach(i => i.steps.forEach(st => m.set(st, (m.get(st) ?? 0) + 1)));
    return Array.from(m.entries()).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [items]);
  const rows = items.filter(i => (dept === "all" || i.dept === dept)
    && (res === "all" || (res === "pass" ? isPass(i.result) : res === "no" ? i.result === "불합격" : i.result === "결과 대기")));
  const reset = () => { setDept("all"); setRes("all"); };
  const grade = IV_LEVEL[Math.min(4, Math.max(0, Math.round(avg) - 1))];
  const cell = Math.min(5, Math.max(1, Math.ceil(avg || 3)));
  return <div className="ivb">
    {n > 0 && <section className="iv-dash" aria-label="면접 진단">
      <div className="iv-dash-top">
        <div>
          <span className="iv-dash-lab">🩺 면접 난이도 <em>{n}명의 후기</em></span>
          <p className="iv-dash-grade">{grade}<small>{avg.toFixed(1)} / 5.0</small></p>
        </div>
        <div className="iv-meter">
          <div className="iv-meter-bar">
            <span className="iv-meter-bub" style={{ left: `${Math.min(94, Math.max(6, (avg / 5) * 100))}%` }}>{avg.toFixed(1)}</span>
            {[1, 2, 3, 4, 5].map(k => <i key={k} className={"s" + k + (k === cell ? " on" : "")} />)}
          </div>
          <div className="iv-meter-ends"><small>쉬움</small><small>어려움</small></div>
        </div>
      </div>
      {topSteps.length > 0 && <div className="iv-steps"><span className="iv-steps-lab">자주 나온 전형</span>{topSteps.map(([st, c]) => <span key={st}>{st} <b>{c}</b></span>)}</div>}
      <div className="iv-metrics">
        <div className="iv-metric"><b>{Math.round(passN / n * 100)}%</b><span>✅ 합격 후기</span></div>
        {waits.length > 0 && <div className="iv-metric"><b>{waitLabel(median(waits))}</b><span>⏳ 결과 발표</span></div>}
        <div className="iv-metric"><b>{Math.round(feelN / n * 100)}%</b><span>😊 좋은 경험</span></div>
      </div>
    </section>}

    <div className="ivb-cta"><Link href={`/hospitals/interview?id=${hid}`} className="btn">{mine ? "✏️ 내 면접 후기 수정" : "🎤 면접 후기 남기기"}</Link></div>

    {n > 0 && <div className="iv-filter">
      <label className="iv-sel"><select aria-label="직종" className={dept !== "all" ? "on" : ""} value={dept} onChange={e => setDept(e.target.value)}>
        <option value="all">전체 직종</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}
      </select></label>
      <label className="iv-sel"><select aria-label="결과" className={res !== "all" ? "on" : ""} value={res} onChange={e => setRes(e.target.value as any)}>
        <option value="all">전체 결과</option><option value="pass">✅ 합격</option><option value="no">❌ 불합격</option><option value="wait">⏳ 대기중</option>
      </select></label>
      <span className="iv-filter-n">후기 <b>{rows.length}</b>건{rows.length !== n && <> <em>/ 전체 {n}건</em></>}</span>
    </div>}

    {!n ? <div className="iv-empty"><b>아직 면접 후기가 없어요</b><p>면접 본 적 있다면 받은 질문 하나만 남겨주세요. 다음 지원자에게 제일 큰 도움이 돼요.</p><Link href={`/hospitals/interview?id=${hid}`} className="btn">🎤 첫 후기 남기기</Link></div>
      : !rows.length ? <div className="iv-empty"><b>이 조건의 후기가 없어요</b><p>직종이나 결과를 바꿔 보세요.</p><button type="button" className="btn ghost" onClick={reset}>필터 초기화</button></div>
      : <div className="iv-list">{rows.map(i => {
        const F = IV_FOLLOW[i.result];
        const qLen = (i.q?.length ?? 0) + (i.follow?.length ?? 0) + (i.tip?.length ?? 0);
        return <article key={i.key} className={"iv-card" + (i.mine ? " mine" : "")}>
          <div className="iv-card-h"><span className={"iv-chip " + tone(i.result)}>{IV_RESULT_LABEL[i.result] ?? i.result}</span><span className="iv-card-when">{i.year}년 · {i.route}{i.mine && <em className="iv-card-me">내 후기</em>}</span></div>
          <div className="iv-card-tags">{i.dept && <span className="t-dept">{i.dept}</span>}<span>난이도 {IV_LEVEL[(i.level || 3) - 1]}</span>{typeof i.feel === "number" && <span>{IV_FEEL[i.feel]}</span>}{typeof i.wait === "number" && i.wait > 0 && <span>발표 {waitLabel(i.wait)}</span>}{i.steps.map(st => <span key={st}>{st}</span>)}</div>
          {i.locked ? <div className="iv-lock">
            <div className="iv-qa" aria-hidden><span className="iv-qb">Q</span><p className="iv-q">1분 자기소개와 지원 동기, 그리고 이 병원만의 단골 질문이 여기에 있어요</p></div>
            <div className="iv-qa" aria-hidden><span className="iv-ab">A</span><div><em className="iv-atag">{F?.tag ?? "조언"}</em><p className="iv-a">면접 때 실제로 들은 처우·근무 조건에 대한 솔직한 이야기</p></div></div>
            <Link href={`/hospitals/interview?id=${hid}`} className="btn iv-lock-b">🎤 면접 후기 남기고 전부 보기</Link>
          </div> : <Fold long={qLen > 140}>
            {i.q && <div className="iv-qa"><span className="iv-qb">Q</span><p className="iv-q">{i.q}</p></div>}
            {i.follow && F && <div className="iv-qa"><span className="iv-ab">A</span><div><em className="iv-atag">{F.tag}</em><p className="iv-a">{i.follow}</p></div></div>}
            {i.tip && <div className="iv-tip"><span aria-hidden>💡</span><p>{i.tip}</p></div>}
          </Fold>}
        </article>;
      })}</div>}

    {rels.length > 0 && <section className="iv-rel">
      <h4>{relTitle}</h4>
      <div className="iv-rel-row">{rels.map(r => <Link key={r.id} href={`/hospitals/${r.id}?t=intv`} className="iv-rel-c">
        <b>🏥 {r.name}</b><small>{r.region} · {r.kind}</small>
        <em>{r.iv ? `🎤 면접 ${r.iv}` : r.rv ? `리뷰 ${r.rv}` : "후기 없음"}</em>
      </Link>)}</div>
    </section>}
  </div>;
}
