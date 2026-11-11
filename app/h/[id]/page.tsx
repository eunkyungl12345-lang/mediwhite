import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { db } from "@/lib/supabase";
import { loadFacts } from "@/lib/hospFactsDb";
import { MIN_N } from "@/lib/hospFacts";
import { loadNps } from "@/lib/nps";
export const dynamic = "force-dynamic";
/** 🔗 로그인 없이 보는 병원 맛보기 — 단톡방에 공유되는 링크. 구체적인 수치·평가는 가입 후에만 (공개 페이지엔 부정적 단정 문구를 싣지 않아요) */
async function load(id: number) {
  const d = db(); const { data: h } = await d.from("hospitals").select("id,name,region,kind").eq("id", id).maybeSingle(); if (!h) return null;
  const [facts, { count: rv }, npsm] = await Promise.all([loadFacts([id]), d.from("hospital_reviews").select("id", { count: "exact", head: true }).eq("hospital_id", id).eq("hidden", false), loadNps([id])]);
  return { h, a: facts[id], rv: rv ?? 0, nps: npsm[id] };
}
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const x = await load(Number(params.id)); if (!x) return { title: "메디화이트" };
  const n = x.a?.n ?? 0, desc = `${x.h.region} ${x.h.kind} · ${n ? `현직자·퇴사자 ${n}명이 알려준 ` : ""}실수령·내부 분위기·입사해야만 아는 리스크. 병원 직원 익명 커뮤니티 메디화이트`;
  return { title: `${x.h.name} — 실수령·분위기·리스크`, description: desc, alternates: { canonical: `/h/${x.h.id}` }, openGraph: { title: `${x.h.name}, 입사 전에 알고 가세요`, description: desc, images: [{ url: "/og.jpg", width: 1200, height: 630 }] } };
}
export default async function PublicHosp({ params }: { params: { id: string } }) {
  const x = await load(Number(params.id)); if (!x) notFound(); const next = `/hospitals/${params.id}`;
  return <div className="login-bg"><div className="app"><main className="ph">
    <Link href="/login" className="ph-brand" aria-label="메디화이트"><BrandLogo /></Link>
    {!x ? <div className="ph-card"><b>없는 병원이에요</b><Link href="/login" className="btn">메디화이트 둘러보기</Link></div> : <div className="ph-card">
      <small>📍 {x.h.region} · {x.h.kind}</small><h1>{x.h.name}</h1>
      <div className="ph-stats"><span><b>{(x.a?.n ?? 0) + x.rv}</b>리뷰</span><span><b>{x.a?.exit.n ?? 0}</b>퇴사자 평가</span>{x.a?.verified ? <span><b>✅{x.a.verified}</b>인증</span> : null}{x.nps?.cnt ? <span><b>{x.nps.cnt}</b>직원(국민연금)</span> : null}</div>
      {(x.a?.n ?? 0) + x.rv === 0 ? <div className="ph-empty">
        <b>🤫 아직 등록된 내부 리뷰가 모이는 중이에요</b>
        <p>이 병원에 다녀보신 적 있나요? 첫 번째 실수령액과 분위기를 남겨주시면 다음 지원자에게 큰 힘이 돼요.</p>
        <Link href={`/login?mode=signup&next=${encodeURIComponent(`/hospitals/check?id=${params.id}`)}`} className="btn ph-cta">✍️ 가입하고 병원 체크하기 <small>+50 XP</small></Link>
      </div> : <>
      <div className="fb-blur ph-blur" aria-hidden><div>💰 세후 실수령 보통 ███만원</div><div>😶 태움·갑질 ████ · 칼퇴 ███</div><div>⚠️ 입사 전에 알았으면 좋았을 것 █개</div><div>🚪 퇴사 사유 1위 ██████</div></div>
      <p>{(x.a?.n ?? 0) >= MIN_N ? "이 병원에 다녀본 사람들이 남긴 진짜 정보가 있어요." : "아직 정보가 모이는 중이에요. 다녀본 적 있다면 처음 알려주세요."}<br />급여·분위기·육아휴직 불이익처럼 <b>입사해야만 알던 것</b>을, 지원하기 전에.</p>
      <Link href={`/login?mode=signup&next=${encodeURIComponent(next)}`} className="btn ph-cta">🔓 가입하고 실수령·분위기 보기</Link>
      </>}
      <small className="muted">아이디·닉네임만으로 가입 · 실명·전화번호 안 받아요</small>
    </div>}
  </main></div></div>;
}
