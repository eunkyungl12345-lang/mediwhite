import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { fortune } from "@/lib/fortune";
import BirthForm from "@/components/BirthForm";
import { analyze, flowRel, monthPillarNow, yearPillarOf, pHan, pName, tenGod, STEM_EL, BRANCH_EL, EL_COLOR, EL_HAN, GOD_DESC, type Pillar } from "@/lib/saju";
import { STEMS, BRANCHES, dayGanzhi } from "@/lib/fortune";
export const dynamic = "force-dynamic";
const Bar = ({ label, s, t, icon }: { label: string; s: number; t: string; icon: string }) => (
  <div className="ft-row"><div className="ft-row-h"><b>{icon} {label}</b><span className="ft-stars">{"★".repeat(Math.round(s / 20))}<i>{"★".repeat(5 - Math.round(s / 20))}</i></span></div><div className="ft-bar"><i style={{ width: s + "%" }} /></div><div className="ft-t">{t}</div></div>);
export default async function FortunePage() {
  const s = (await getSession())!;
  const { data: u } = await db().from("users").select("fortune_name,birth_date,birth_time,nickname").eq("id", s.id).maybeSingle();
  if (!u?.birth_date) return (
    <div className="news">
      <div className="card ft-hero"><div className="ft-moon">🔮</div><h3 style={{ margin: 0 }}>오늘의 운세</h3><div className="muted">생년월일과 태어난 시간을 한 번만 넣으면, 매일 아침 나만의 운세가 자동으로 바뀌어요.</div></div>
      <div className="card"><BirthForm /></div>
    </div>);
  const f = fortune(u.birth_date, u.birth_time, u.fortune_name, new Date());
  const who = u.fortune_name || u.nickname;
  const A = analyze(u.birth_date, u.birth_time);
  const monthP = monthPillarNow(f.today.y, f.today.m, f.today.d), yearP = yearPillarOf(f.today.y), td = dayGanzhi(f.today.y, f.today.m, f.today.d), today = flowRel(A.P.day.stem, td.stem);
  return (
    <div className="news">
      <div className="card ft-hero">
        <div className="muted" style={{ fontSize: 12 }}>{f.today.y}년 {f.today.m}월 {f.today.d}일 · 오늘의 일진 <b>{f.today.name}</b></div>
        <div className="ft-score"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="10" /><circle cx="60" cy="60" r="52" fill="none" stroke="#FFD36E" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${f.score * 3.27} 400`} transform="rotate(-90 60 60)" /></svg><div><b>{f.score}</b><span>점</span></div></div>
        <h3 style={{ margin: 0 }}>{who}님, {f.headline}</h3>
        <div className="ft-tags"><span>{f.me.animalEmoji} {f.me.year}년생 {f.me.animal}띠</span><span>{f.me.elEmoji} 일간 {f.me.day.slice(0, 1)}{f.me.el}</span><span>✨ {f.me.zodiac}</span>{f.me.hour && <span>🕰️ {f.me.hour.split("(")[0]}생</span>}</div>
        <div className="ft-total">{f.total}</div>
        <div className="muted" style={{ fontSize: 12, color: "#C9C3E6" }}>{f.relDesc} ({f.rel})</div>
      </div>
      <div className="card sj">
        <div className="bar"><h3 style={{ margin: 0 }}>📜 {who}님의 사주팔자</h3><span className="muted" style={{ fontSize: 11 }}>{u.birth_date.replace(/-/g, ".")} {f.me.hour ? f.me.hour.split("(")[0] + "생" : "· 시간 모름"}</span></div>
        <div className="sj-table">
          {(([["시주", A.P.hour], ["일주", A.P.day], ["월주", A.P.month], ["년주", A.P.year]]) as [string, Pillar | null][]).map(([label, p]) => <div key={label} className={"sj-col" + (label === "일주" ? " me" : "")}>
            <span className="sj-l">{label}{label === "일주" ? " (나)" : ""}</span>
            {p ? <>
              <span className="sj-god">{label === "일주" ? "일간" : tenGod(A.P.day.stem, STEM_EL[p.stem], p.stem % 2 === 0)}</span>
              <span className="sj-c" style={{ background: EL_COLOR[STEM_EL[p.stem]] }}><b>{pHan(p)[0]}</b><i>{STEMS[p.stem]} · {STEM_EL[p.stem]}</i></span>
              <span className="sj-c" style={{ background: EL_COLOR[BRANCH_EL[p.branch]] }}><b>{pHan(p)[1]}</b><i>{BRANCHES[p.branch]} · {BRANCH_EL[p.branch]}</i></span>
              <span className="sj-god">{tenGod(A.P.day.stem, BRANCH_EL[p.branch], p.branch % 2 === 0)}</span>
            </> : <span className="sj-c none">?<i>시간 모름</i></span>}
          </div>)}
        </div>
        <div className="sj-els">{(["목", "화", "토", "금", "수"] as const).map(e => <div key={e}><span style={{ color: EL_COLOR[e] }}>{EL_HAN[e]} {e}</span><div className="sj-bar"><i style={{ width: `${A.count[e] / (A.P.hour ? 8 : 6) * 100}%`, background: EL_COLOR[e] }} /></div><b>{A.count[e]}</b></div>)}</div>
        <div className="sj-note">⚖️ {A.lackText}{A.muchText ? <><br />🔥 {A.muchText}</> : null}</div>
      </div>
      <div className="card sj">
        <h3 style={{ margin: 0 }}>🧭 타고난 기질 · {A.me.title}</h3>
        <div className="sj-p">{A.me.nature}</div>
        <div className="sj-p"><b>🏥 일·직장</b> {A.me.work}</div>
        <div className="sj-p"><b>💘 연애</b> {A.me.love}</div>
        <div className="sj-p"><b>💪 기운의 세기</b> {A.strong ? "신강(身強) — 내 기운이 강한 편이라 주도적으로 밀고 나갈 때 운이 트여요. 다만 고집은 내려놓기!" : "신약(身弱) — 주변의 도움을 받을 때 더 잘 풀리는 사주예요. 좋은 사람과 함께하세요."}</div>
        <div className="sj-gods">{A.topGods.map(g => <span key={g}><b>{g}</b> {GOD_DESC[g]}</span>)}</div>
      </div>
      <div className="card sj">
        <h3 style={{ margin: 0 }}>🌊 운의 흐름</h3>
        {[["오늘", `${f.today.name}`, today], ["이번 달", `${pName(monthP)}월`, flowRel(A.P.day.stem, monthP.stem)], [`${f.today.y}년`, `${pName(yearP)}년`, flowRel(A.P.day.stem, yearP.stem)]].map(([k, n, r]: any) => <div key={k} className="sj-flow"><div><b>{k}</b> <span className="muted">{n} · {r.god}</span></div><div>{r.text}</div></div>)}
      </div>
      <div className="card" style={{ gap: 12 }}>
        <Bar label="재물운" icon="💰" s={f.money.s} t={f.money.t} />
        <Bar label="애정운" icon="💘" s={f.love.s} t={f.love.t} />
        <Bar label="직장운" icon="🏥" s={f.work.s} t={f.work.t} />
        <Bar label="건강운" icon="🩺" s={f.health.s} t={f.health.t} />
      </div>
      <div className="card"><h3 style={{ margin: 0 }}>🍀 오늘의 행운</h3>
        <div className="ft-lucky"><div><span>행운의 색</span><b><i style={{ background: f.lucky.hex }} />{f.lucky.color}</b></div><div><span>행운의 숫자</span><b>{f.lucky.num}</b></div><div><span>행운의 방향</span><b>{f.lucky.dir}</b></div><div><span>행운의 시간</span><b>{f.lucky.time}</b></div><div><span>행운의 아이템</span><b>{f.lucky.item}</b></div></div>
      </div>
      <details className="card"><summary><b>✏️ 내 생일 정보 수정</b></summary><BirthForm name={u.fortune_name} date={u.birth_date} time={u.birth_time} /></details>
      <div className="muted" style={{ fontSize: 11, textAlign: "center" }}>사주 일진을 바탕으로 만든 재미용 운세예요. 매일 자정(한국시간)에 바뀌어요. <Link href="/news" className="link">📰 오늘의 핫뉴스 보기</Link></div>
    </div>
  );
}
