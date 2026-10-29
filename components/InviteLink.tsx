"use client";
import { useEffect, useState } from "react";
export default function InviteLink({ username }: { username: string }) {
  const [url, setUrl] = useState(""); const [ok, setOk] = useState(false);
  useEffect(() => { setUrl(`${location.origin}/login?ref=${username}`); }, [username]);
  return (
    <div className="row">
      <input readOnly value={url} onFocus={e => e.currentTarget.select()} aria-label="초대 링크" />
      <button type="button" className="btn ghost" onClick={async () => { try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1500); } catch {} }}>{ok ? "복사됨" : "복사"}</button>
    </div>
  );
}
