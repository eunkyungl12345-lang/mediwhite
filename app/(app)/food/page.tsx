import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { AREAS, FOOD_TAGS } from "@/lib/foodData";
import { display } from "@/lib/depts";
import { fmt } from "@/lib/format";
import { deleteRestaurant } from "@/lib/foodActions";
import { FoodForm, FoodLike, AreaPicker } from "@/components/FoodForms";
import Roulette from "@/components/games/Roulette";
export const dynamic = "force-dynamic";

export default async function FoodPage({ searchParams }: { searchParams: { r?: string; d?: string; t?: string } }) {
  const s = (await getSession())!; const d = db();
  const region = searchParams.r && AREAS[searchParams.r] ? searchParams.r : "";
  const district = region && searchParams.d && AREAS[region].includes(searchParams.d) ? searchParams.d : "";
  const tag = FOOD_TAGS.some(t => t.key === searchParams.t) ? searchParams.t! : "";
  let q = d.from("restaurants").select("id,region,district,station,name,menu,price,comment,tags,created_at,author_id,author:users!restaurants_author_id_fkey(nickname,dept)").order("created_at", { ascending: false }).limit(100);
  if (region) q = q.eq("region", region); if (district) q = q.eq("district", district); if (tag) q = q.contains("tags", [tag]);
  const { data: list } = await q;
  const ids = (list ?? []).map(x => x.id);
  const { data: likes } = ids.length ? await d.from("restaurant_likes").select("rest_id,user_id").in("rest_id", ids) : { data: [] as any[] };
  const cnt = (id: number) => (likes ?? []).filter(l => l.rest_id === id).length, mine = (id: number) => (likes ?? []).some(l => l.rest_id === id && l.user_id === s.id);
  const rows = (list ?? []).map((x: any) => ({ ...x, n: cnt(x.id) })).sort((a, b) => b.n - a.n || +new Date(b.created_at) - +new Date(a.created_at));
  const tagLabel = (k: string) => FOOD_TAGS.find(t => t.key === k)?.label ?? k;
  return (
    <div className="games">
      <div className="food-hero"><b>🍚 병원 앞 맛집</b><span>서울·경기·인천·대구 — 병원 사람들이 직접 가본 곳만</span></div>
      <details className="card ss-details"><summary><b>🎯 오늘 뭐 시켜먹지? 배달 룰렛</b></summary><Roulette title="배달 메뉴 룰렛" hint="메뉴를 쉼표로 바꿔 넣어도 돼요." initial="치킨, 피자, 족발, 떡볶이, 짜장면, 국밥, 초밥, 햄버거, 마라탕, 돈까스, 쌀국수, 샐러드" prefix="🛵 오늘 배달은 " /></details>
      <AreaPicker region={region} district={district} tag={tag} />
      <details className="card ss-details"><summary><b>➕ 우리 병원 앞 최애 밥집 올리기</b> <span className="muted">· 첫 등록 +50 XP</span></summary><FoodForm region={region} district={district} /></details>
      <div className="muted" style={{ fontSize: 12 }}>{region ? `${region}${district ? ` ${district}` : ""}` : "전체 지역"} · {rows.length}곳 · "나도 가봤어요" 많은 순</div>
      {!rows.length && <div className="card"><div className="muted">아직 등록된 곳이 없어요. 첫 번째로 우리 동네 밥집을 알려주세요! 🙌</div></div>}
      <div className="food-list">{rows.map((x: any) => (
        <div key={x.id} className="food-card">
          <div className="food-top"><b>{x.name}</b><span className="tag">{x.region} {x.district}{x.station ? ` · ${x.station}` : ""}</span></div>
          {(x.menu || x.price) && <div className="food-menu">{x.menu}{x.menu && x.price ? " · " : ""}{x.price}</div>}
          <div className="food-comment">“{x.comment}”</div>
          {x.tags?.length > 0 && <div className="food-tagrow">{x.tags.map((t: string) => <span key={t}>{tagLabel(t)}</span>)}</div>}
          <div className="food-foot"><FoodLike id={x.id} liked={mine(x.id)} count={x.n} /><span className="time">{x.author ? display(x.author.dept, x.author.nickname) : ""} · {fmt(x.created_at)}</span>{(s.role === "admin" || x.author_id === s.id) && <form action={deleteRestaurant.bind(null, x.id)}><button className="link">삭제</button></form>}</div>
        </div>))}</div>
    </div>
  );
}
