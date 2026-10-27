"use client";
import { useRouter } from "next/navigation";
export default function DeptSelect({ value, options, topic, sort }: { value: string; options: readonly string[]; topic: string; sort: string }) {
  const r = useRouter();
  return (
    <label className="dept-sel">
      <span>직종</span>
      <select value={value} onChange={e => { const v = e.target.value; const q = new URLSearchParams({ ...(v !== "전체" ? { cat: v } : {}), ...(topic ? { topic } : {}), ...(sort !== "rank" ? { sort } : {}) }); r.push(`/board${q.toString() ? "?" + q.toString() : ""}`); }}>
        <option value="전체">전체 직종</option>
        {options.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </label>
  );
}
