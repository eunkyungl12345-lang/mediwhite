import Link from "next/link";
import POCKET from "@/lib/xrayPocket.json";
export const metadata = { title: "포켓 도감 · 일반촬영 실무 프로토콜" };
type P = { id: string; category: string; name_ko: string; summary: string; position: string; central_ray: string; breathing: string; check_points: string[]; pro_tip: string };
/** 📒 포켓 도감 — 검사실에서 바로 펴 보는 10대 기본 X-ray 한 장 요약 (lib/xrayPocket.json) */
export default function Pocket() {
  const list = POCKET.protocols as P[], cats = Array.from(new Set(list.map(p => p.category)));
  return <div className="detail pk">
    <Link className="link" href="/study/xray">← 방사선 촬영법 폼</Link>
    <h2 style={{ margin: "8px 0 2px" }}>📒 포켓 도감</h2>
    <p className="muted" style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6 }}>일반촬영 10대 기본 검사를 자세·중심선·호흡·체크·꿀팁으로 한 장씩. <b>현직 방사선사 검수 전 초안</b>이라 병원 프로토콜과 장비 설정이 우선이에요.</p>
    <nav className="pk-nav" aria-label="부위">{cats.map(c => <a key={c} href={`#${encodeURIComponent(c)}`}>{c}</a>)}</nav>
    {cats.map(c => <section key={c} id={encodeURIComponent(c)} className="pk-sec"><h3>{c}</h3>
      {list.filter(p => p.category === c).map(p => <details key={p.id} id={p.id} className="pk-card">
        <summary><b>{p.name_ko}</b><small>{p.summary}</small></summary>
        <dl>
          <dt>🧍 자세</dt><dd>{p.position}</dd>
          <dt>🎯 중심선</dt><dd>{p.central_ray}</dd>
          <dt>🫁 호흡</dt><dd>{p.breathing}</dd>
          <dt>✅ 체크</dt><dd><ul>{p.check_points.map(x => <li key={x}>{x}</li>)}</ul></dd>
        </dl>
        <p className="pk-tip"><b>💡 꿀팁</b>{p.pro_tip}</p>
      </details>)}
    </section>)}
    <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>틀린 내용이나 우리 병원만의 팁이 있으면 <Link href="/support">문의</Link>로 알려주세요.</p>
  </div>;
}
