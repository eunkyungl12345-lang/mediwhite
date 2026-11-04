import Link from "next/link";
import TermSearch from "@/components/TermSearch";
export default function Terms() {
  return <div className="detail"><Link className="link" href="/study">← 공부방·자료실</Link><h2 style={{ margin: "8px 0 2px" }}>📖 의료 약어 사전</h2>
    <p className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>병동에서 제일 많이 듣는 약어와 말이에요. 병원마다 쓰는 법이 조금씩 달라요. 우리 병원만의 말은 병원 화면 <b>인계장</b>에 남겨주세요.</p><TermSearch /></div>;
}
