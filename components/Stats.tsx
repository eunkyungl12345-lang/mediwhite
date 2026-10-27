export default function Stats({ series, totals }: { series: { day: string; visitors: number; signups: number }[]; totals: { users: number; today: number; msg24h: number; posts: number; games24h: number } }) {
  const max = Math.max(1, ...series.map(s => s.visitors));
  const week = series.slice(-7).reduce((a, s) => a + s.visitors, 0), prev = series.slice(0, 7).reduce((a, s) => a + s.visitors, 0);
  return (
    <div className="card">
      <h3>지표</h3>
      <div className="stat-row">
        <div className="stat"><b>{totals.today}</b><span>오늘 방문자</span></div>
        <div className="stat"><b>{totals.users}</b><span>전체 회원</span></div>
        <div className="stat"><b>{totals.msg24h}</b><span>24h 채팅</span></div>
        <div className="stat"><b>{totals.games24h}</b><span>24h 게임 기록</span></div>
        <div className="stat"><b>{totals.posts}</b><span>누적 글</span></div>
      </div>
      <div className="muted">최근 14일 일 방문자(로그인한 사람 기준, 중복 제외). 막대 아래 초록 숫자는 그날 가입자. 이번 주 방문 합계 {week} (지난주 {prev}).</div>
      <div className="bars">{series.map(s => <div key={s.day} className="bar-col" title={`${s.day} 방문 ${s.visitors} · 가입 ${s.signups}`}><div className="bar-v" style={{ height: `${Math.max(2, Math.round(s.visitors / max * 100))}%` }}><span>{s.visitors || ""}</span></div><div className="bar-l">{s.day.slice(3)}</div><div className="bar-s">{s.signups ? `+${s.signups}` : ""}</div></div>)}</div>
    </div>
  );
}
