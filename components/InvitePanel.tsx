"use client";
import { useState, useTransition } from "react";
import { createInvite } from "@/lib/actions";
type Inv = { code: string; used: boolean; usedBy?: string | null };
export default function InvitePanel({ invites, left, admin }: { invites: Inv[]; left: number; admin: boolean }) {
  const [list, setList] = useState(invites), [p, start] = useTransition(), [msg, setMsg] = useState(""), [n, setN] = useState(left);
  const link = (c: string) => `${typeof location !== "undefined" ? location.origin : ""}/login?invite=${c}`;
  const copy = async (c: string) => { const text = `메디화이트웹 초대장 💌\n병원 사람들만 들어오는 익명 라운지예요.\n초대 코드: ${c}\n${link(c)}`; try { if (navigator.share) await navigator.share({ title: "메디화이트웹 초대장", text }); else { await navigator.clipboard.writeText(text); setMsg("복사했어요! 카톡에 붙여넣기 하세요"); } } catch {} };
  const make = () => start(async () => { const r = await createInvite(); if (r.code) { setList(l => [{ code: r.code!, used: false }, ...l]); setN(x => Math.max(0, x - 1)); copy(r.code); } else setMsg(r.error ?? ""); });
  return (
    <div className="inv">
      <div className="muted" style={{ fontSize: 13 }}>메디화이트웹은 <b>초대장이 있어야만</b> 가입할 수 있어요. 믿을 수 있는 병원 동료에게만 보내주세요. 초대한 사람이 가입하면 경험치를 받아요.</div>
      <div className="row" style={{ alignItems: "center" }}><button type="button" className="btn" disabled={p || (!admin && n <= 0)} onClick={make}>💌 초대장 만들기</button><span className="muted">{admin ? "운영자: 무제한" : `남은 초대장 ${n}장`}</span></div>
      {msg && <div className="muted">{msg}</div>}
      {list.length > 0 && <div className="inv-list">{list.map(i => <div key={i.code} className={"inv-item" + (i.used ? " used" : "")}><code>{i.code}</code><span>{i.used ? `✅ 사용됨${i.usedBy ? ` · ${i.usedBy}` : ""}` : "대기 중"}</span>{!i.used && <button type="button" className="link" onClick={() => copy(i.code)}>보내기</button>}</div>)}</div>}
    </div>
  );
}
