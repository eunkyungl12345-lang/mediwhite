"use client";
import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { addRestaurant, likeRestaurant } from "@/lib/foodActions";
import { AREAS, REGIONS, FOOD_TAGS, PRICES } from "@/lib/foodData";

function Btn() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "…" : "🍚 등록하기"}</button>; }
export function FoodForm({ region: r0, district: d0 }: { region: string; district: string }) {
  const [st, act] = useFormState(addRestaurant, undefined);
  const [region, setRegion] = useState(r0 || "서울");
  return (
    <form action={act} className="ss-form">
      <div className="ss-grid2">
        <label>지역<select name="region" value={region} onChange={e => setRegion(e.target.value)}>{REGIONS.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>구·시<select name="district" defaultValue={d0}>{AREAS[region].map(x => <option key={x}>{x}</option>)}</select></label>
      </div>
      <label>가까운 역·동네 (선택)<input name="station" maxLength={20} placeholder="예: 신촌역, 아산동" /></label>
      <label>가게 이름<input name="name" maxLength={40} required placeholder="예: 할매순대국" /></label>
      <div className="ss-grid2">
        <label>대표 메뉴<input name="menu" maxLength={40} placeholder="예: 순대국 9천원" /></label>
        <label>가격대<select name="price" defaultValue=""><option value="">선택 안 함</option>{PRICES.map(x => <option key={x}>{x}</option>)}</select></label>
      </div>
      <label>한 줄 평<textarea name="comment" maxLength={200} required placeholder="예: 나이트 끝나고 아침에 가면 해장 최고. 혼밥 자리 많아요" style={{ minHeight: 60 }} /></label>
      <div className="food-tags">{FOOD_TAGS.map(t => <label key={t.key}><input type="checkbox" name="tags" value={t.key} /><span>{t.label}</span></label>)}</div>
      <div className="muted" style={{ fontSize: 12 }}>병원 이름 대신 동네·역으로 적어주세요. 어디서 일하는지 드러나지 않게요 🙂</div>
      {st?.error && <div className="error">{st.error}</div>}{st?.ok && <div className="ss-ok">{st.ok}</div>}
      <Btn />
    </form>
  );
}
export function FoodLike({ id, liked: l0, count: c0 }: { id: number; liked: boolean; count: number }) {
  const [liked, setLiked] = useState(l0), [count, setCount] = useState(c0), [p, start] = useTransition();
  return <button type="button" className={"react-btn" + (liked ? " on" : "")} disabled={p} onClick={() => { setLiked(!liked); setCount(c => c + (liked ? -1 : 1)); start(async () => { const r = await likeRestaurant(id); if (r) { setLiked(r.liked); setCount(r.count); } }); }}>👍 <b>{count}</b><small>나도 가봤어요</small></button>;
}
export function AreaPicker({ region, district, tag }: { region: string; district: string; tag: string }) {
  const r = useRouter();
  const go = (rg: string, d: string, t = tag) => { const q = new URLSearchParams({ ...(rg ? { r: rg } : {}), ...(d ? { d } : {}), ...(t ? { t } : {}) }); r.push(`/food${q.toString() ? "?" + q : ""}`); };
  return (
    <div className="food-pick">
      <div className="cats" style={{ paddingBottom: 6 }}>{["", ...REGIONS].map(x => <button key={x} type="button" className="cats-btn" aria-pressed={region === x} onClick={() => go(x, "")}>{x || "전체"}</button>)}</div>
      {region && <select value={district} onChange={e => go(region, e.target.value)}><option value="">{region} 전체</option>{AREAS[region].map(x => <option key={x}>{x}</option>)}</select>}
      <div className="sorts">{[{ key: "", label: "전체" }, ...FOOD_TAGS].map(t => <a key={t.key} href="#" onClick={e => { e.preventDefault(); go(region, district, t.key); }} aria-current={tag === t.key ? "true" : undefined}>{t.label}</a>)}</div>
    </div>
  );
}
