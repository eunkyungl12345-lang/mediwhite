export type Row = { value: number; mode?: string; nickname: string; dept: string };
export default function Board({ title, rows, fmt }: { title: string; rows: Row[]; fmt: (r: Row) => string }) {
  return (
    <div className="board"><strong style={{ fontSize: 14 }}>{title}</strong>
      <ol>
        {!rows.length && <li><span /><span className="muted">아직 기록이 없어요</span><span /></li>}
        {rows.map((r, i) => <li key={i}><span className="rank">{i + 1}</span><span>{r.nickname}{r.mode === "hard" && <> <span className="tag">하드</span></>}</span><span className="ms">{fmt(r)}</span></li>)}
      </ol>
    </div>
  );
}
