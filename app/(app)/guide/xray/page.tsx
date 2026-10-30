import Link from "next/link";
import XrayGuide from "@/components/XrayGuide";
export default function XrayGuidePage() {
  return (
    <div className="news">
      <Link className="link" href={`/board?cat=${encodeURIComponent("방사선")}`}>← 방사선 라운지</Link>
      <div className="card" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>📖 일반촬영 포지셔닝 가이드</h3>
        <div className="muted" style={{ fontSize: 12 }}>두부 → 척추 → 흉곽 → 상지 → 골반·하지 → 전척추 순으로, 검사별 뷰(AP·LAT·OBL…)마다 자세와 중심선(CR)을 정리했어요. 교과서 표준 기준이라 <b>병원 프로토콜과 장비 설정이 우선</b>이에요. 틀린 부분이나 우리 병원 꿀팁은 라운지에 공유해 주세요!</div>
        <XrayGuide />
      </div>
    </div>
  );
}
