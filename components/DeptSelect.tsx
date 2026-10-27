"use client";
import { useRouter } from "next/navigation";
/** 블라인드식: [전체] [내 직종 라운지] [다른 직종 ▾] */
export default function DeptSelect({ value, options, mine, topic, sort }: { value: string; options: readonly string[]; mine: string; topic: string; sort: string }) {
  const r = useRouter();
  const go = (v: string) => { const q = new URLSearchParams({ ...(v !== "전체" ? { cat: v } : {}), ...(topic ? { topic } : {}), ...(sort !== "rank" ? { sort } : {}) }); r.push(`/board${q.toString() ? "?" + q.toString() : ""}`); };
  const isMine = value === mine, isOther = value !== "전체" && !isMine;
  const others = options.filter(d => d !== mine);
  return (
    <div className="scope">
      <button type="button" className={"scope-btn" + (value === "전체" ? " on" : "")} onClick={() => go("전체")}>전체</button>
      {options.includes(mine) && <button type="button" className={"scope-btn" + (isMine ? " on" : "")} onClick={() => go(mine)}>🏷️ {mine} 라운지</button>}
      <label className={"scope-btn scope-sel" + (isOther ? " on" : "")}>
        <span>{isOther ? value : "다른 직종"} ▾</span>
        <select value={isOther ? value : ""} onChange={e => e.target.value && go(e.target.value)} aria-label="다른 직종 보기">
          <option value="">다른 직종…</option>
          {others.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
    </div>
  );
}
