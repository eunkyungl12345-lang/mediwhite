"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { JOB_REGIONS } from "@/lib/jobs";
export default function RegionSelect({ value }: { value: string }) {
  const r = useRouter(), sp = useSearchParams();
  return <select className="jb2-region" value={value} aria-label="지역" onChange={e => { const p = new URLSearchParams(sp.toString()); e.target.value ? p.set("region", e.target.value) : p.delete("region"); r.push(`/jobs${p.toString() ? "?" + p : ""}`); }}>{["", ...JOB_REGIONS].map(x => <option key={x} value={x}>{x || "📍 전체 지역"}</option>)}</select>;
}
