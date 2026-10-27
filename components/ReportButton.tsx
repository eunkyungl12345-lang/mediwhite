"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { reportContent } from "@/lib/actions";
import { REPORT_REASONS } from "@/lib/safety";

export default function ReportButton({ kind, id }: { kind: "post" | "comment"; id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("defame");
  const [detail, setDetail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => { setBusy(true); const r = await reportContent(kind, id, reason, detail); setBusy(false); if (r?.error) setMsg(r.error); else { setMsg("신고 접수 · 임시 블라인드 처리됐어요. 운영팀이 확인합니다."); setTimeout(() => setOpen(false), 1500); } };
  return (
    <>
      <button type="button" className="link" style={{ color: "var(--muted)" }} onClick={() => { setOpen(true); setMsg(""); }}>🚩 신고</button>
      {open && createPortal(
        <div className="ob" onClick={() => setOpen(false)}>
          <div className="ob-card" style={{ textAlign: "left", gap: 8 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 17 }}>🚩 {kind === "post" ? "글" : "댓글"} 신고</h3>
            <div className="muted" style={{ fontSize: 12 }}>신고하면 즉시 가려지고(임시조치), 운영팀이 확인 후 복구하거나 삭제해요. 허위 신고가 반복되면 신고 기능이 제한돼요.</div>
            <div className="rp-list">{REPORT_REASONS.map(([k, n]) => <label key={k} className={"rp" + (reason === k ? " on" : "")}><input type="radio" name="reason" checked={reason === k} onChange={() => setReason(k)} /><span>{n}</span></label>)}</div>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} maxLength={500} placeholder="(선택) 어떤 부분이 문제인지" style={{ minHeight: 60 }} />
            {msg && <div className={msg.includes("접수") ? "muted" : "error"}>{msg}</div>}
            <div className="ob-nav"><button type="button" className="btn ghost" onClick={() => setOpen(false)}>닫기</button><button type="button" className="btn" disabled={busy} onClick={send}>신고하기</button></div>
          </div>
        </div>, document.body)}
    </>
  );
}
