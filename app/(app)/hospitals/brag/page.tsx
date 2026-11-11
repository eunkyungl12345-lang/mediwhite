import Link from "next/link";
import { getSession } from "@/lib/auth";
import { loadBrags } from "@/lib/bragDb";
import BragCard from "@/components/jobs/BragCard";
export const metadata = { title: "우리 병원 자랑대회" };
export const dynamic = "force-dynamic";
/** 🏆 천하제일 우리병원 자랑대회 */
export default async function BragPage({ searchParams }: { searchParams: { sort?: string; new?: string } }) {
  const s = (await getSession())!; const sort = searchParams.sort === "new" ? "new" : "top";
  const list = await loadBrags(s.id, { sort });
  return <div className="games bg-page">
    <div className="bg-hero"><div><h2>🏆 천하제일 우리병원 자랑대회</h2><p>우리 병원 이건 진짜 자랑할 만하다! 사진 한 장이면 돼요. ❤️ 부러워요를 제일 많이 받은 병원이 1등.</p></div><Link href="/hospitals/brag/new" className="btn">📸 우리 병원 자랑하기 <small>+30</small></Link></div>
    {searchParams.new && <div className="fb-thanks">🎉 자랑 올라갔어요! 동료들한테 ❤️ 받아오세요 <b>+30 XP</b></div>}
    <div className="jb2-filters"><Link href="/hospitals/brag" className={sort === "top" ? "on" : ""}>❤️ 부러워요순</Link><Link href="/hospitals/brag?sort=new" className={sort === "new" ? "on" : ""}>🆕 최신순</Link><Link href="/hospitals">🏥 병원 리뷰</Link></div>
    {list.length === 0 ? <div className="jb2-empty"><span>🏆</span><b>아직 자랑한 병원이 없어요</b><p>첫 자랑의 주인공이 되어주세요. 휴게실, 식당, 창밖 뷰… 뭐든 좋아요.</p><Link href="/hospitals/brag/new" className="btn">📸 첫 자랑 올리기</Link></div>
      : <div className="bg-grid">{list.map((b, i) => <BragCard key={b.owner + b.hid} b={b} me={s.id} admin={s.role === "admin"} rank={sort === "top" && b.likes > 0 ? i + 1 : undefined} />)}</div>}
  </div>;
}
