import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fmt } from "@/lib/format";
import BadgeForm from "@/components/BadgeForm";
import BlueBadge from "@/components/BlueBadge";
export const dynamic = "force-dynamic";

export default async function BadgePage() {
  const s = (await getSession())!; const d = db();
  const [{ data: me }, { data: reqs }] = await Promise.all([d.from("users").select("blue_badge").eq("id", s.id).maybeSingle(), d.from("badge_requests").select("id,status,reason,created_at,decided_at").eq("user_id", s.id).order("created_at", { ascending: false }).limit(5)]);
  const pending = (reqs ?? []).find(r => r.status === "pending"), last = reqs?.[0];
  return (
    <div className="detail bd-page">
      <Link className="link" href="/ssum?tab=meet">← 번개</Link>
      <div className="bd-hero"><span className="bd-big"><BlueBadge size={64} /></span><div><h2 style={{ margin: 0 }}>골드뱃지</h2><p className="muted" style={{ margin: "4px 0 0" }}>신분(운전면허증) + 의료 면허·자격증이 확인된 <b>진짜 병원 사람</b> 표시예요.</p></div></div>
      <div className="card bd-perks">
        <div><b>☕ 커피챗 번개 개설</b><small className="muted">골드뱃지만 열 수 있는 직무 수다·고민 상담 번개</small></div>
        <div><b><BlueBadge size={15} className="bb" /> 이름 옆 뱃지</b><small className="muted">셀소 카드·번개·프로필에 표시 — 신뢰도 UP</small></div>
        <div><b>🔒 서류는 심사 후 즉시 삭제</b><small className="muted">운영팀만 열람, 승인/거절 처리와 동시에 파기</small></div>
      </div>
      {me?.blue_badge ? <div className="card bd-done bd-glow"><BlueBadge size={72} /><b>골드뱃지 회원이에요!</b><div className="bd-preview"><span className="nm">[{s.dept}]{s.nickname}</span><BlueBadge size={16} className="bb" /></div><p className="muted" style={{ margin: 0 }}>번개 탭에서 ☕ 커피챗을 열어보세요.</p><Link className="btn" href="/ssum?tab=meet">⚡ 번개 탭으로</Link></div>
      : pending ? <div className="card bd-done"><span style={{ fontSize: 40 }}>⏳</span><b>심사 중이에요</b><p className="muted" style={{ margin: 0 }}>{fmt(pending.created_at)} 신청 · 운영팀이 확인하면 알림으로 알려드려요 (보통 1~2일)</p></div>
      : <>
        {last?.status === "rejected" && <div className="error">지난 신청({fmt(last.decided_at ?? last.created_at)})은 승인되지 않았어요{last.reason ? ` — ${last.reason}` : ""}. 사진을 다시 확인하고 재신청해주세요.</div>}
        <div className="card"><h3 style={{ marginTop: 0 }}>인증 신청</h3><BadgeForm /></div>
      </>}
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>✔️ 두 서류의 이름이 같아야 해요 · 면허번호·주민번호 뒷자리는 가려서 올려도 돼요 · 골드뱃지가 있어도 닉네임·직종 외 정보는 아무에게도 공개되지 않아요.</div>
    </div>
  );
}
