/** 2026 실수령 간이 계산 (서버·클라이언트 공용) */
/** 💰 통장 실수령 계산기 (2026년 근로자 부담 요율 · 1인 가구 · 비과세 식대 20만 원 가정, 간이 추정)
 *  국민연금 4.75%(기준소득 상한 659만) · 건강 3.595% · 장기요양 0.4724% · 고용 0.9% · 소득세+지방소득세 10% */
export function netMonthly(annualMan: number) {
  const G = annualMan * 10000 / 12, taxable = Math.max(0, G - 200000), base = Math.min(Math.max(taxable, 410000), 6590000);
  const pension = base * .0475, health = taxable * .03595, care = taxable * .004724, emp = taxable * .009;
  const S = taxable * 12; // 총급여
  const ded = S <= 5e6 ? S * .7 : S <= 15e6 ? 3.5e6 + (S - 5e6) * .4 : S <= 45e6 ? 7.5e6 + (S - 15e6) * .15 : S <= 1e8 ? 12e6 + (S - 45e6) * .05 : 14.75e6 + (S - 1e8) * .02;
  const tb = Math.max(0, S - ded - 1.5e6 - pension * 12 - (health + care + emp) * 12);
  const calc = tb <= 14e6 ? tb * .06 : tb <= 50e6 ? tb * .15 - 1.26e6 : tb <= 88e6 ? tb * .24 - 5.76e6 : tb <= 150e6 ? tb * .35 - 15.44e6 : tb * .38 - 19.94e6;
  const credit0 = calc <= 1.3e6 ? calc * .55 : 715000 + (calc - 1.3e6) * .3;
  const cap = S <= 33e6 ? 740000 : S <= 70e6 ? Math.max(660000, 740000 - (S - 33e6) * .008) : Math.max(500000, 660000 - (S - 70e6) / 2);
  const tax = Math.max(0, calc - Math.min(credit0, cap)) * 1.1 / 12;
  return Math.round((G - pension - health - care - emp - tax) / 10000);
}
