"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { JOB_REGIONS } from "@/lib/jobs";
/** 🗺️ 병원 피드 지역 필터 — '적용' 버튼 없이 고르면 바로 URL에 반영 */
export default function HospFilterSelect({ value }: { value: string }) {
  const r = useRouter(), sp = useSearchParams();
  return <select className="hfs" value={value} aria-label="지역" onChange={e => {
    const p = new URLSearchParams(sp.toString());
    if (e.target.value) p.set("region", e.target.value); else p.delete("region");
    const qs = p.toString(); r.push(`/hospitals${qs ? "?" + qs : ""}`);
  }}>{["", ...JOB_REGIONS].map(x => <option key={x} value={x}>{x || "지역"}</option>)}</select>;
}
