import Link from "next/link";
import XrayIndex from "@/components/XrayIndex";
export const metadata = { title: "방사선 촬영법 폼 · 메디화이트웹" };
export default function XrayList() {
  return <div className="detail"><Link className="link" href="/study">← 공부방·자료실</Link><h2 style={{ margin: "8px 0 2px" }}>🩻 방사선 촬영법 폼</h2>
    <p className="muted" style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6 }}>검사·뷰마다 부위, 주요 병변, 중심선, 호흡, 포지셔닝 순서, 콜리메이션, 평가, 팁을 한 장에 정리했어요. 교과서 표준 기준이라 <b>병원 프로토콜과 장비 설정이 우선</b>이에요.</p><XrayIndex /></div>;
}
