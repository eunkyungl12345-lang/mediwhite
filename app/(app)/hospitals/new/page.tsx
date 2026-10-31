import Link from "next/link";
import { getSession } from "@/lib/auth";
import ReviewForm from "@/components/jobs/ReviewForm";
export default async function NewReviewPage({ searchParams }: { searchParams: { name?: string } }) {
  const s = (await getSession())!;
  return <div className="detail"><Link className="link" href="/hospitals">← 병원 리뷰</Link><h2>⭐ 병원 리뷰 쓰기</h2><div className="card"><ReviewForm dept={s.dept} key={searchParams.name ?? ""} /></div>{searchParams.name && <div className="muted" style={{ fontSize: 12 }}>힌트: 병원 찾기에 “{searchParams.name}” 을 입력해보세요.</div>}</div>;
}
