import Link from "next/link";
import { notFound } from "next/navigation";
import XrayFig from "@/components/XrayFig";
import { XVIEWS, xvBySlug } from "@/lib/xrayAll";
import { getSession } from "@/lib/auth";
import { loadXrayPhotos } from "@/lib/xrayPhotoDb";
import XrayGallery from "@/components/XrayGallery";
export function generateMetadata({ params }: { params: { slug: string } }) { const x = xvBySlug(params.slug); return { title: x ? `${x.d?.title ?? `${x.exam.en} ${x.view.v}`} 촬영법` : "촬영법" }; }
/** 🩻 촬영법 폼 한 장 — 콘솔 촬영 가이드처럼: 제목·투사명·노출·부위·병변·SID·중심선·호흡·포지셔닝·콜리메이션·평가·팁 */
export default async function XrayForm({ params }: { params: { slug: string } }) {
  const x = xvBySlug(params.slug); if (!x) notFound(); const me = (await getSession())!; const photos = await loadXrayPhotos(x.slug, me.id);
  const { exam, view, d } = x, sibs = XVIEWS.filter(v => v.ei === x.ei), i = XVIEWS.indexOf(x), prev = XVIEWS[i - 1], next = XVIEWS[i + 1];
  const title = d?.title ?? `${exam.en.toUpperCase()} ${view.v}`;
  const Sec = ({ h, children }: { h: string; children: React.ReactNode }) => <div className="xf-sec"><h4>{h}</h4>{children}</div>;
  const Ol = ({ a }: { a?: string[] }) => a?.length ? <ol>{a.map((t, k) => <li key={k}>{t}</li>)}</ol> : null;
  return <div className="detail xf">
    <Link className="link" href="/study/xray">← 촬영법 목록 · {exam.name}</Link>
    <header className="xf-h"><small>{exam.part} · {exam.name} ({exam.en})</small><h2>{title}</h2>{d?.proj && <p>{d.proj}</p>}
      <div className="xf-chips">{d?.kvp && <span>kVp <b>{d.kvp}</b></span>}<span>SID <b>{d?.sid ?? exam.sid ?? "100cm"}</b></span>{(d?.breath ?? exam.breath) && <span>호흡 <b>{d?.breath ?? exam.breath}</b></span>}</div></header>
    <div className="xf-grid">
      <div className="xf-left"><XrayGallery slug={x.slug} me={me.id} photos={photos.map(p => ({ uid: p.uid, game: p.game, url: p.url, kind: p.kind, note: p.note, status: p.status }))} fig={view.fig ? <XrayFig name={view.fig} /> : <div className="xf-nofig">그림 준비 중</div>} />
        <div className="xf-sibs">{sibs.map(v => <Link key={v.slug} href={`/study/xray/${v.slug}`} className={v.slug === x.slug ? "on" : ""}>{v.view.v}</Link>)}</div></div>
      <div className="xf-right">
        {d?.region && <Sec h="Region · 촬영 부위"><p>{d.region}</p></Sec>}
        {d?.path && <Sec h="Pathology · 주요 병변"><p>{d.path}</p></Sec>}
        <Sec h="Central · 중심선"><p>{d?.cr ?? view.cr}</p></Sec>
        <Sec h="포지셔닝">{d?.steps?.length ? <Ol a={d.steps} /> : <p>{view.pos}</p>}</Sec>
        {d?.coll && <Sec h="콜리메이션"><p>{d.coll}</p></Sec>}
        {(d?.eval?.length || exam.check?.length) && <Sec h="평가"><Ol a={d?.eval?.length ? d.eval : exam.check} /></Sec>}
        {(d?.tips?.length || exam.tip) && <Sec h="팁"><Ol a={d?.tips?.length ? d.tips : [exam.tip!]} /></Sec>}
      </div>
    </div>
    <p className="muted" style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>kVp는 성인 DR 기준 참고 범위예요. mAs·시간은 장비, AEC, 체격에 따라 달라서 적지 않았어요. 병원 프로토콜이 우선이고, 틀린 부분이나 우리 병원 꿀팁은 방사선 라운지에 알려주세요.</p>
    <nav className="xf-nav">{prev ? <Link href={`/study/xray/${prev.slug}`}>‹ {prev.d?.title ?? `${prev.exam.name} ${prev.view.v}`}</Link> : <span />}{next && <Link href={`/study/xray/${next.slug}`}>{next.d?.title ?? `${next.exam.name} ${next.view.v}`} ›</Link>}</nav>
  </div>;
}
