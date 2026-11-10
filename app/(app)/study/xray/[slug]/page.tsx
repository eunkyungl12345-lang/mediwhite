import Link from "next/link";
import { notFound } from "next/navigation";
import XrayFig from "@/components/XrayFig";
import { XVIEWS, xvBySlug } from "@/lib/xrayAll";
import { getSession } from "@/lib/auth";
import { loadXrayPhotos } from "@/lib/xrayPhotoDb";
import XrayGallery from "@/components/XrayGallery";
export function generateMetadata({ params }: { params: { slug: string } }) { const x = xvBySlug(params.slug); return { title: x ? `${x.d?.title ?? `${x.exam.en} ${x.view.v}`} 촬영법` : "촬영법" }; }
/** 🩻 촬영법 — 촬영실 콘솔(X-ray 촬영 PC) 화면 구조 그대로
 *  위: 검사 헤더 / 왼쪽: 큰 뷰어 + 아래 썸네일 줄(도식·자세 사진) / 오른쪽: 검사명·투사명·kV mA Time·Region…팁 (스크롤) */
export default async function XrayForm({ params }: { params: { slug: string } }) {
  const x = xvBySlug(params.slug); if (!x) notFound(); const me = (await getSession())!; const photos = await loadXrayPhotos(x.slug, me.id);
  const { exam, view, d } = x, sibs = XVIEWS.filter(v => v.ei === x.ei), i = XVIEWS.indexOf(x), prev = XVIEWS[i - 1], next = XVIEWS[i + 1];
  const title = d?.title ?? `${exam.en.toUpperCase()} ${view.v}`, code = `MW-${String(x.ei + 1).padStart(2, "0")}${String(x.vi + 1).padStart(2, "0")}`;
  const Sec = ({ h, children }: { h: string; children: React.ReactNode }) => <section className="xc-sec"><h4>{h}</h4>{children}</section>;
  const Ol = ({ a }: { a?: string[] }) => a?.length ? <ol>{a.map((t, k) => <li key={k}>{t}</li>)}</ol> : null;
  return <div className="detail xcw">
    <Link className="link" href="/study/xray">← 촬영법 목록 · {exam.name}</Link>
    <div className="xc">
      <div className="xc-h"><span>PRACTICE · 익명 실습</span><b>{title}</b><span>{code}</span></div>
      <div className="xc-grid">
        <div className="xc-left">
          <XrayGallery slug={x.slug} me={me.id} photos={photos.map(p => ({ uid: p.uid, game: p.game, url: p.url, kind: p.kind, note: p.note, status: p.status }))} fig={view.fig ? <XrayFig name={view.fig} /> : <div className="xf-nofig">그림 준비 중</div>} />
        </div>
        <div className="xc-right">
          <h2 className="xc-t">{title}</h2>
          {d?.proj && <p className="xc-proj">{d.proj}</p>}
          <div className="xc-exp">{d?.exp ? <><span>kV : {d.exp.kv}</span><span>mA : {d.exp.ma}</span><span>Time : {d.exp.ms}</span></> : d?.kvp ? <><span>kV : {d.kvp}</span><small>mA·Time은 장비·AEC 기준</small></> : <small>노출 조건은 병원 프로토콜 기준</small>}</div>
          <div className="xc-scroll">
            {d?.region && <Sec h="Region"><p>{d.region}</p></Sec>}
            {d?.path && <Sec h="Pathology"><p>{d.path}</p></Sec>}
            <Sec h="SID"><p>{d?.sid ?? exam.sid ?? "100 cm (40 inches)"}</p></Sec>
            <Sec h="Central"><p>{d?.cr ?? view.cr}</p></Sec>
            {(d?.breath ?? exam.breath) && <Sec h="호흡"><p>{d?.breath ?? exam.breath}</p></Sec>}
            <Sec h="포지션">{d?.steps?.length ? <Ol a={d.steps} /> : <p>{view.pos}</p>}</Sec>
            {d?.coll && <Sec h="콜리메이션"><p>{d.coll}</p></Sec>}
            {(d?.eval?.length || exam.check?.length) ? <Sec h="평가"><Ol a={d?.eval?.length ? d.eval : exam.check} /></Sec> : null}
            {(d?.tips?.length || exam.tip) ? <Sec h="팁"><Ol a={d?.tips?.length ? d.tips : [exam.tip!]} /></Sec> : null}
          </div>
        </div>
      </div>
      <nav className="xc-sibs" aria-label="같은 검사 다른 뷰">{sibs.map(v => <Link key={v.slug} href={`/study/xray/${v.slug}`} className={v.slug === x.slug ? "on" : ""}>{v.view.v}</Link>)}</nav>
    </div>
    <p className="muted" style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>노출 조건은 촬영실 장비 기준 예시예요. 장비·AEC·체격에 따라 달라지니 병원 프로토콜이 우선이에요. 틀린 부분이나 우리 병원 꿀팁은 방사선 라운지에 알려주세요.</p>
    <nav className="xf-nav">{prev ? <Link href={`/study/xray/${prev.slug}`}>‹ {prev.d?.title ?? `${prev.exam.name} ${prev.view.v}`}</Link> : <span />}{next && <Link href={`/study/xray/${next.slug}`}>{next.d?.title ?? `${next.exam.name} ${next.view.v}`} ›</Link>}</nav>
  </div>;
}
