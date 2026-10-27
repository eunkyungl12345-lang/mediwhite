"use client";
import { useFormState } from "react-dom";
import { adminSetBank, adminAdjustPool, type FormState } from "@/lib/actions";
import { DEPTS } from "@/lib/depts";
export default function AdminSupport({ bank, pools }: { bank: string; pools: { dept: string; points: number }[] }) {
  const [bs, bankAction] = useFormState<FormState, FormData>(adminSetBank, undefined);
  const [ps, poolAction] = useFormState<FormState, FormData>(adminAdjustPool, undefined);
  return (
    <div className="form">
      <form action={bankAction} className="row"><input name="bank" defaultValue={bank} maxLength={80} placeholder="입금 계좌 (예: 카카오뱅크 3333-00-0000000 이은경)" /><button className="btn ghost">계좌 저장</button>{bs?.ok && <span className="muted">{bs.ok}</span>}</form>
      <form action={poolAction} className="row" style={{ alignItems: "center" }}>
        <select name="dept" defaultValue={DEPTS[0]} style={{ width: "auto" }}>{DEPTS.map(d => <option key={d} value={d}>[{d}] {pools.find(p => p.dept === d)?.points ?? 0}</option>)}</select>
        <input name="delta" type="number" placeholder="±XP 수동 조정" style={{ width: 140 }} />
        <button className="btn ghost">적용</button>{ps?.ok && <span className="muted">{ps.ok}</span>}{ps?.error && <span className="error">{ps.error}</span>}
      </form>
    </div>
  );
}
