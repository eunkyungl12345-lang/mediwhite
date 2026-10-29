"use client";
import { useFormState, useFormStatus } from "react-dom";
import { saveBirth, type FormState } from "@/lib/actions";
function Btn() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "…" : "저장"}</button>; }
const HOURS = [["", "모름"], ["00:00", "자시 23~01시"], ["02:00", "축시 01~03시"], ["04:00", "인시 03~05시"], ["06:00", "묘시 05~07시"], ["08:00", "진시 07~09시"], ["10:00", "사시 09~11시"], ["12:00", "오시 11~13시"], ["14:00", "미시 13~15시"], ["16:00", "신시 15~17시"], ["18:00", "유시 17~19시"], ["20:00", "술시 19~21시"], ["22:00", "해시 21~23시"]];
export default function BirthForm({ name, date, time }: { name?: string | null; date?: string | null; time?: string | null }) {
  const [st, action] = useFormState<FormState, FormData>(saveBirth, undefined);
  return (
    <form action={action} className="form">
      <input name="fortune_name" defaultValue={name ?? ""} maxLength={20} placeholder="이름 (선택)" />
      <label className="muted" style={{ fontSize: 12 }}>생년월일 (양력)</label>
      <input name="birth_date" type="date" defaultValue={date ?? ""} required min="1920-01-01" />
      <label className="muted" style={{ fontSize: 12 }}>태어난 시간</label>
      <select name="birth_time" defaultValue={time ? HOURS.find(h => h[0] && Number(h[0].slice(0, 2)) === (Math.floor(((Number(time.slice(0, 2)) + 1) % 24) / 2) * 2))?.[0] ?? "" : ""}>{HOURS.map(([v, l]) => <option key={l} value={v}>{l}</option>)}</select>
      <div className="muted" style={{ fontSize: 12 }}>🔒 운세 계산에만 쓰여요. 다른 사람에게는 절대 보이지 않아요(익명 유지).</div>
      <div className="row"><Btn />{date && <button name="clear" value="1" className="link">정보 지우기</button>}{st?.error && <span className="error">{st.error}</span>}{st?.ok && <span className="muted">{st.ok}</span>}</div>
    </form>
  );
}
