"use client";
import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { createBoard, deleteBoard, type FormState } from "@/lib/actions";

export default function BoardTabs({ dept, boards, current, canManage, leaderName }: { dept: string; boards: { id: string; name: string }[]; current: string; canManage: boolean; leaderName: string | null }) {
  const [open, setOpen] = useState(false);
  const [st, action] = useFormState<FormState, FormData>(createBoard, undefined);
  return (
    <div className="subtabs">
      <div className="cats">
        <Link href={`/board?cat=${encodeURIComponent(dept)}`} aria-current={!current ? "true" : undefined}>자유</Link>
        {boards.map(b => <Link key={b.id} href={`/board?cat=${encodeURIComponent(dept)}&tab=${b.id}`} aria-current={current === b.id ? "true" : undefined}>{b.name}</Link>)}
        {canManage && <button type="button" className="cats-btn" onClick={() => setOpen(o => !o)}>＋ 탭 만들기</button>}
      </div>
      <div className="muted" style={{ paddingBottom: 8 }}>{leaderName ? `${dept} 파트 리더: ${leaderName} (파트 경험치 1위, 탭 신설 권한)` : `${dept} 파트 리더 공석 — 첫 가입자가 리더`}</div>
      {canManage && open && (
        <form action={action} className="row" style={{ paddingBottom: 10 }}>
          <input type="hidden" name="dept" value={dept} />
          <input name="name" maxLength={20} placeholder="새 탭 이름 (예: 구인공고)" required />
          <button className="btn">만들기</button>
          {st?.error && <div className="error" style={{ width: "100%" }}>{st.error}</div>}
          {st?.ok && <div className="muted" style={{ width: "100%" }}>{st.ok}</div>}
          {current && <button type="button" className="link" onClick={() => deleteBoard(current, dept)}>현재 탭 삭제 (글은 자유로 이동)</button>}
        </form>
      )}
    </div>
  );
}
