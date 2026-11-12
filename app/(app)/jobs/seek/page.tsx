import Link from "next/link";
import { getSession } from "@/lib/auth";
import { loadSeekers, loadMyOffers } from "@/lib/seek";
import { deleteSeek, deleteOffer } from "@/lib/seek.actions";
import { JOB_REGIONS, JOB_DEPTS } from "@/lib/jobs";
import { deptLabel } from "@/lib/depts";
import { ago } from "@/lib/format";
import { SeekForm, OfferForm } from "@/components/jobs/SeekForms";
import ConfirmSubmit from "@/components/ConfirmSubmit";
export const metadata = { title: "저 구해요 · 익명 구직 프로필" };
export const dynamic = "force-dynamic";
/** 🙋 저 구해요 — 익명 구직 프로필. 병원(회원)이 채용 제안을 보내고, 구직자만 그 제안을 봐요 */
export default async function SeekPage({ searchParams }: { searchParams: { dept?: string; region?: string; me?: string } }) {
  const s = (await getSession())!;
  const [{ list, mine }, offers] = await Promise.all([loadSeekers(s.id), loadMyOffers(s.id)]);
  const dept = searchParams.dept ?? "", region = searchParams.region ?? "";
  const shown = list.filter(x => !x.mine && x.open && (!dept || x.dept === dept) && (!region || x.region === region));
  const q = (o: Record<string, string>) => "/jobs/seek?" + new URLSearchParams(Object.entries({ dept, region, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  return <div className="detail sk">
    <Link className="link" href="/jobs">← 채용</Link>
    <div className="sk-hero"><span className="sk-badge">🙋 저 구해요</span><h2>공고를 찾지 말고, 병원이 나를 찾게</h2><p className="muted">이름 없이 경력·희망 조건만 올리면, 병원이 채용 제안을 보내요. 제안은 나만 볼 수 있어요.</p></div>

    <section className="card sk-me" id="me">
      {mine ? <details><summary className="sk-sum"><b>{mine.open ? "🟢 내 프로필 공개 중" : "⚪ 내 프로필 비공개"}</b><span className="muted">{deptLabel(mine.dept)} · {mine.years} · {mine.region} — 수정 ›</span></summary><div style={{ marginTop: 12 }}><SeekForm v={mine} depts={JOB_DEPTS} regions={JOB_REGIONS} myDept={s.dept} /></div></details>
        : <><h3 style={{ margin: "0 0 10px" }}>내 익명 프로필 만들기</h3><SeekForm v={null} depts={JOB_DEPTS} regions={JOB_REGIONS} myDept={s.dept} /></>}
      {mine && <form action={deleteSeek} style={{ marginTop: 8, textAlign: "right" }}><ConfirmSubmit msg="프로필과 받은 제안을 모두 지울까요?">🗑️ 프로필 삭제</ConfirmSubmit></form>}
    </section>

    {mine && <section className="card" id="offers">
      <h3 style={{ margin: "0 0 10px" }}>📨 받은 채용 제안 {offers.length}</h3>
      {offers.length ? offers.map(o => <div key={o.key} className="sk-offer-in">
        <div className="row" style={{ justifyContent: "space-between", gap: 8 }}><b>{o.hosp}</b><span className="muted" style={{ fontSize: 12 }}>{ago(o.at)}</span></div>
        <p style={{ margin: "6px 0", whiteSpace: "pre-wrap" }}>{o.msg}</p>
        <div className="sk-contact">📞 {o.contact}</div>
        <form action={deleteOffer.bind(null, o.key)} style={{ textAlign: "right" }}><ConfirmSubmit msg="이 제안을 지울까요?">지우기</ConfirmSubmit></form>
      </div>) : <p className="muted" style={{ margin: 0, fontSize: 13 }}>아직 받은 제안이 없어요. 프로필을 공개해 두면 알림으로 알려드려요.</p>}
      <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>⚠️ 연락 전 병원 리뷰에서 실수령·고용안정성을 꼭 확인하세요. 선입금·개인정보를 요구하면 신고해 주세요.</p>
    </section>}

    <section>
      <div className="sk-filter">
        <select defaultValue={dept} aria-label="직종" form="skf" name="dept">{[["", "전체 직종"], ...JOB_DEPTS.map(d => [d, deptLabel(d)])].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select defaultValue={region} aria-label="지역" form="skf" name="region">{[["", "전체 지역"], ...JOB_REGIONS.map(r => [r, r])].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <form id="skf" action="/jobs/seek"><button className="btn ghost">찾기</button></form>
        {(dept || region) && <Link href="/jobs/seek" className="link">초기화</Link>}
      </div>
      <h3 style={{ margin: "14px 0 8px" }}>구직 중인 의료인 {shown.length}명</h3>
      {shown.length ? <div className="sk-list">{shown.map(x => <article key={x.key} className="card sk-card">
        <div className="sk-top"><b>익명 {deptLabel(x.dept)}</b><span>{x.years}</span><span>📍 {x.region}</span><span>🕘 {x.want}</span></div>
        {x.skills && <div className="sk-skills">💪 {x.skills}</div>}
        {x.intro && <p className="sk-intro">{x.intro}</p>}
        <div className="sk-foot"><span className="muted" style={{ fontSize: 12 }}>{ago(x.at)} 업데이트</span>{x.offers === -1 ? <span className="sk-ok">✅ 제안 보냄</span> : <OfferForm k={x.key} />}</div>
      </article>)}</div> : <div className="empty">{dept || region ? "조건에 맞는 프로필이 아직 없어요" : "아직 올라온 프로필이 없어요. 첫 번째로 올려보세요!"}</div>}
    </section>
    <p className="muted" style={{ fontSize: 12 }}>메디화이트는 제안을 전달만 해요. 채용 조건·계약은 병원과 직접 확인하세요.</p>
  </div>;
}
