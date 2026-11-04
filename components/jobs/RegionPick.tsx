"use client";
import { useState } from "react";
import { JOB_REGIONS } from "@/lib/jobs";
import { SEOUL_GU } from "@/lib/district";
/** 지역 + (서울이면) 구 선택 */
export default function RegionPick({ region = "서울", gu = "강남구" }: { region?: string; gu?: string }) {
  const [r, setR] = useState(region);
  return <>
    <label className="jb-lab">지역<select name="region" value={r} onChange={e => setR(e.target.value)}>{JOB_REGIONS.map(x => <option key={x}>{x}</option>)}</select></label>
    {r === "서울" && <label className="jb-lab">구<select name="gu" defaultValue={gu}>{SEOUL_GU.map(x => <option key={x}>{x}</option>)}</select></label>}
  </>;
}
