"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeJob, deleteJob, deleteReview } from "@/lib/jobActions";
export function JobOwnerButtons({ id, closed }: { id: number; closed: boolean }) {
  const [p, start] = useTransition(); const r = useRouter();
  return <span className="row" style={{ gap: 6 }}>
    <button type="button" className="btn ghost" disabled={p} onClick={() => start(async () => { await closeJob(id); r.refresh(); })}>{closed ? "다시 모집" : "✅ 마감 처리"}</button>
    <button type="button" className="link" disabled={p} onClick={() => { if (confirm("공고를 삭제할까요?")) start(async () => { await deleteJob(id); }); }}>삭제</button>
  </span>;
}
export function ReviewDelete({ id }: { id: number }) {
  const [p, start] = useTransition(); const r = useRouter();
  return <button type="button" className="link" disabled={p} onClick={() => { if (confirm("내 리뷰를 삭제할까요?")) start(async () => { await deleteReview(id); r.refresh(); }); }}>삭제</button>;
}
