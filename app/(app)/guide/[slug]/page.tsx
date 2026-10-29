import Link from "next/link";
import { notFound } from "next/navigation";
import DeptGuide from "@/components/DeptGuide";
import { guideBySlug } from "@/lib/deptGuides";
export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = guideBySlug(params.slug);
  if (!g) notFound();
  return (
    <div className="news">
      <Link className="link" href={`/board?cat=${encodeURIComponent(g.depts[0])}`}>← {g.depts.join("·")} 라운지</Link>
      <div className="card" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>{g.icon} {g.title}</h3>
        <div className="muted" style={{ fontSize: 12 }}>{g.note} 틀린 부분이나 우리 병원 꿀팁은 라운지에 공유해 주세요!</div>
        <DeptGuide slug={g.slug} />
      </div>
    </div>
  );
}
