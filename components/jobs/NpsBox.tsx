import type { NpsInfo } from "@/lib/nps";
/** 📊 국민연금 공공데이터 — 체크가 없어도 보이는 기본 정보 (추정치임을 분명히) */
export default function NpsBox({ n }: { n?: NpsInfo | null }) {
  if (!n || !n.cnt) return null;
  const yr = n.months ? Math.round(n.outN / n.months * 12) : 0, rate = n.cnt && n.months ? Math.round(yr / n.cnt * 100) : 0;
  return <div className="nps">
    <div className="nps-h"><b>📊 공공데이터로 본 이 병원</b><small>국민연금 가입 사업장 · {n.ym ? `${n.ym.slice(0, 4)}.${n.ym.slice(4, 6)}` : ""} 기준</small></div>
    <div className="nps-g">
      <div><b>{n.cnt.toLocaleString()}명</b><span>국민연금 가입 직원</span></div>
      {n.avgPay > 0 && <div><b>{n.avgPay.toLocaleString()}만</b><span>추정 평균 월급(세전)</span></div>}
      {n.months > 0 && <div><b>+{n.inN} / −{n.outN}</b><span>최근 {n.months}개월 입사 / 퇴사</span></div>}
      {n.months > 0 && n.cnt >= 5 && <div><b>{rate}%</b><span>연간 퇴사율(추정)</span></div>}
    </div>
    <small className="nps-note">국민연금 보험료로 거꾸로 계산한 <b>추정치</b>예요. 기준소득 상한이 있어 고연봉은 낮게 잡히고, 수당·세후 실수령과 달라요. 진짜 실수령은 위 '실체 체크'를 보세요.</small>
  </div>;
}
