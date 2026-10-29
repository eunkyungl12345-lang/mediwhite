import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { fortune } from "@/lib/fortune";
import BirthForm from "@/components/BirthForm";
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
