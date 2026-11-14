"use client";
import { useEffect, useState } from "react";
/** ✍️ 작성 원칙 서약 — 처음 한 번 체크하면 이후엔 한 줄로만 보여요 (서버에는 매번 pledge=on 전송) */
export default function Pledge() {
  const [done, setDone] = useState(false);
  useEffect(() => { try { setDone(localStorage.getItem("mw-pledge") === "1"); } catch {} }, []);
  if (done) return <div className="pledge done"><input type="hidden" name="pledge" value="on" />✔ 작성 원칙 동의함 · 직접 경험한 사실만, 특정인 비방 없이 <a href="/rules" target="_blank" className="link">원칙 보기</a></div>;
  return <label className="pledge"><input type="checkbox" name="pledge" required onChange={e => { try { if (e.target.checked) localStorage.setItem("mw-pledge", "1"); } catch {} }} />
    <span><b>직접 경험한 사실만 쓰고, 특정인을 비방하거나 알아볼 수 있게 쓰지 않을게요.</b><small>진료·치료 후기는 받지 않아요. 사실과 다른 내용으로 생기는 책임은 작성자에게 있어요. <a href="/rules" target="_blank" className="link">작성 원칙</a></small></span></label>;
}
