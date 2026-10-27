import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { deptPools, bankInfo, AMOUNTS, POINT_PER_WON } from "@/lib/support";
import { fmt } from "@/lib/format";
import SupportForm from "@/components/SupportForm";
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const s = (await getSession())!;
  const [{ rows, top }, bank, { data: mine }, { data: recent }] = await Promise.all([
    deptPools(), bankInfo(),
    db().from("contributions").select("id,amount,points,status,created_at").eq("user_id", s.id).order("created_at", { ascending: false }).limit(10),
    db().from("contributions").select("dept,points,created_at,users(nickname)").eq("status", "confirmed").order("confirmed_at", { ascending: false }).limit(10),
  ]);
  const max = Math.max(1, rows[0]?.points ?? 1);
  return (
    <div className="games">
      <div className="card">
        <h3>파트 응원전</h3>
        <div className="muted">파트에 응원 포인트를 쌓으면 <b>1위 파트</b>가 대표 파트가 돼요. 대표 파트 글은 게시판 <b>🏆 대표 파트</b> 탭에 그 파트만 상위노출되고 금빛 배지가 붙어요. 1,000원 = {Math.round(1000 * POINT_PER_WON)} XP, 응원한 사람도 절반을 개인 경험치로 받아요.</div>
        <div className="pools">
          {rows.map((r, i) => (
            <div key={r.dept} className={"pool" + (r.dept === top ? " top" : "") + (r.dept === s.dept ? " mine" : "")}>
              <div className="pool-head"><span>{i === 0 && r.points > 0 ? "🏆 " : ""}[{r.dept}]{r.dept === s.dept ? " ← 내 파트" : ""}</span><span className="ms">{r.points.toLocaleString()} XP</span></div>
              <div className="xpbar"><i style={{ width: `${Math.round(r.points / max * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>[{s.dept}] 응원하기</h3>
        {bank ? <div className="bank">입금 계좌: <b>{bank}</b></div> : <div className="muted">아직 입금 계좌가 등록되지 않았어요. 관리자가 등록하면 열려요.</div>}
        <SupportForm amounts={AMOUNTS} rate={POINT_PER_WON} disabled={!bank} />
        <div className="muted">입금 후 관리자가 확인하면 반영돼요 (보통 당일). 환불은 반영 전까지만 가능해요.</div>
      </div>
      {!!mine?.length && <div className="card"><h3>내 응원 내역</h3><div className="quests">{mine.map(c => <div key={c.id} className="quest"><span>{c.amount.toLocaleString()}원 → +{c.points} XP</span><span className={c.status === "confirmed" ? "" : "muted"}>{c.status === "confirmed" ? "반영됨" : c.status === "rejected" ? "취소" : "입금 확인 대기"} · {fmt(c.created_at)}</span></div>)}</div></div>}
      {!!recent?.length && <div className="card"><h3>최근 응원</h3><div className="quests">{recent.map((c: any, i) => <div key={i} className="quest"><span>[{c.dept}] +{c.points} XP</span><span className="muted">{c.users?.nickname ?? "익명"} · {fmt(c.created_at)}</span></div>)}</div></div>}
    </div>
  );
}
