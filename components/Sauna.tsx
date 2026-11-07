"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { restDone, restBeat, restLeave, type RestPerson } from "@/lib/rest.actions";
/** 🧖 당직실 찜질방 — 방 고르기, 고구마 굽기, 맥반석 달걀 이마로 깨기, 식혜 한 모금. 기록은 내 브라우저에만 */
type Room = "fire" | "salt" | "ice";
const ROOMS: Record<Room, { n: string; e: string; bg: string; t: string; tip: string }> = {
  fire: { n: "불가마", e: "🔥", bg: "linear-gradient(180deg,#5A2A12,#B4532A 60%,#E58A3A)", t: "78℃", tip: "고구마는 여기서만 익어요" },
  salt: { n: "소금방", e: "🧂", bg: "linear-gradient(180deg,#F3E6D2,#E7C9A0 60%,#D9B184)", t: "48℃", tip: "누워서 등 지지기 좋아요" },
  ice: { n: "얼음방", e: "🧊", bg: "linear-gradient(180deg,#CFEFFF,#9FD8F2 60%,#7CC3E6)", t: "4℃", tip: "땀 식히고 다시 불가마로!" },
};
const POTATO = (s: number) => s < 0 ? { e: "🍠", t: "생고구마" } : s < 35 ? { e: "🍠", t: "익는 중…" } : s < 70 ? { e: "🍠", t: "노릇노릇 거의 다 됐어요" } : s < 100 ? { e: "🍠", t: "다 익었어요! 지금 꺼내요" } : s < 130 ? { e: "🍠", t: "살짝 탔어요… 그래도 먹을 만해요" } : { e: "⚫", t: "숯이 됐어요 😇" };
const DOING: Record<string, string> = { p: "🍠 고구마 굽는 중", e: "🥚 달걀 까는 중", s: "🥤 식혜 마시는 중", i: "😌 쉬는 중" };
const DC: Record<string, string> = { 간호사: "#E86F8A", 간호조무사: "#F29B5C", 방사선사: "#4F86E8", 임상병리사: "#2FA67A", 물리치료사: "#8C6BE0", 치위생사: "#2BB3C0" };
/** 찜질방 접속자: rest_presence 의 scene="sauna", pose="sn:<방>:<하는 일>" */
const parse = (p: RestPerson) => { const [, r, d] = (p.pose ?? "").split(":"); return { room: (["fire", "salt", "ice"].includes(r) ? r : "fire") as Room, doing: d ?? "i" }; };
const LINES = ["아~ 시원하다", "이게 사는 거지", "나이트 끝나고 오니까 천국이네", "등 좀 지져야겠다", "오늘 인계 생각 금지", "식혜 한 사발 더!"];
export default function Sauna() {
  const [room, setRoom] = useState<Room>("fire"), [towel, setTowel] = useState(true), [heat, setHeat] = useState(0);
  const [pot, setPot] = useState(-1), [eaten, setEaten] = useState({ potato: 0, egg: 0, sikhye: 0 }), [egg, setEgg] = useState<"whole" | "crack" | "peel">("whole"), [sip, setSip] = useState(100);
  const [say, setSay] = useState(""), [xp, setXp] = useState(""), [bump, setBump] = useState(0), started = useRef(Date.now()), done = useRef(false);
  const [ppl, setPpl] = useState<RestPerson[]>([]), [live, setLive] = useState(true), doing = useRef("i");
  const beat = useRef<() => void>(() => {});
  beat.current = () => { restBeat(null, false, { scene: "sauna", x: 0, z: 0, pose: `sn:${room}:${doing.current}` }).then(v => setPpl(v.people.filter(p => !p.me && p.scene === "sauna" && p.pose?.startsWith("sn:")))).catch(() => setLive(false)); };
  useEffect(() => { beat.current(); }, [room]);
  useEffect(() => { const id = setInterval(() => beat.current(), 15000); const bye = () => { restLeave().catch(() => {}); }; window.addEventListener("pagehide", bye); return () => { clearInterval(id); window.removeEventListener("pagehide", bye); bye(); }; }, []);
  const mark = (d: string) => { if (doing.current === d) return; doing.current = d; beat.current(); };
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem("mw-sauna") ?? "{}"); if (v.eaten) setEaten(v.eaten); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("mw-sauna", JSON.stringify({ eaten })); } catch {} }, [eaten]);
  useEffect(() => { const id = setInterval(() => {
    setHeat(h => Math.max(0, Math.min(100, h + (room === "fire" ? 1.6 : room === "salt" ? .6 : -2.5))));
    setPot(p => p < 0 ? p : room === "fire" ? p + 1 : p);
  }, 500); return () => clearInterval(id); }, [room]);
  const toast = (t: string) => { setSay(t); setTimeout(() => setSay(s => s === t ? "" : s), 2400); };
  const reward = async () => { if (done.current || Date.now() - started.current < 60_000) return; done.current = true; const x = await restDone("sauna").catch(() => 0); setXp(x ? `🧖 오늘 찜질 완료 +${x} XP` : "🧖 오늘 찜질 완료"); };
  const eat = (k: "potato" | "egg" | "sikhye") => { setEaten(e => ({ ...e, [k]: e[k] + 1 })); reward(); };
  const potState = POTATO(pot);
  const potatoTap = () => {
    if (pot < 0) { if (room !== "fire") return toast("🔥 고구마는 불가마에서만 구워져요"); setPot(0); mark("p"); toast("🍠 숯 속에 고구마를 묻었어요"); return; }
    if (pot < 70) return toast(`아직이에요… ${potState.t}`);
    eat("potato"); toast(pot < 100 ? "😋 후후 불어서 한 입! 꿀고구마네요" : pot < 130 ? "😅 살짝 탄 맛도 매력이에요" : "🥲 숯은… 못 먹어요"); setPot(-1); mark("i");
  };
  const eggTap = () => {
    if (egg === "whole") { setEgg("crack"); mark("e"); setBump(Date.now()); navigator.vibrate?.(30); toast(towel ? "🐑 양머리 이마에 톡! 쩍 갈라졌어요" : "🤕 이마에 톡! …양머리 쓰고 할 걸"); return; }
    if (egg === "crack") { setEgg("peel"); toast("🥚 껍질 술술 까졌어요. 소금 콕!"); return; }
    eat("egg"); setEgg("whole"); mark(pot >= 0 ? "p" : "i"); toast("😋 맥반석 달걀 한 입에 꿀꺽");
  };
  const sikhye = () => { if (sip <= 0) { setSip(100); toast("🥤 식혜 한 잔 더 받아왔어요"); return; } setSip(s => Math.max(0, s - 34)); mark("s"); if (sip - 34 <= 0) eat("sikhye"); toast(sip - 34 <= 0 ? "😮‍💨 캬~ 살얼음 식혜 원샷" : "🥤 쭈욱… 살얼음이 사각사각"); };
  const R = ROOMS[room];
  return <div className="sn">
    <div className="sn-h"><Link href="/rest" className="link">← 당직실</Link><b>🧖 당직실 찜질방</b><small className="sn-live">{live ? `👥 지금 ${ppl.length + 1}명 찜질 중` : ""}</small><small>먹은 것 🍠{eaten.potato} 🥚{eaten.egg} 🥤{eaten.sikhye}</small></div>
    <div className="sn-rooms">{(Object.keys(ROOMS) as Room[]).map(k => <button key={k} type="button" className={room === k ? "on" : ""} onClick={() => { setRoom(k); toast(`${ROOMS[k].e} ${ROOMS[k].n} 입장 · ${ROOMS[k].tip}`); }}>{ROOMS[k].e} {ROOMS[k].n}<small>{ROOMS[k].t}{(() => { const c = ppl.filter(p => parse(p).room === k).length; return c ? ` · ${c}명` : ""; })()}</small></button>)}</div>
    <div className="sn-scene" style={{ background: R.bg }}>
      {room === "fire" && <div className="sn-coal">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ animationDelay: `${i * .23}s` }} />)}{pot >= 0 && <span className={"sn-pot" + (pot >= 100 ? " burnt" : "")}>{potState.e}{pot < 100 && <em className="sn-smoke">♨️</em>}</span>}</div>}
      {room === "ice" && <div className="sn-snow">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${i * .4}s` }}>❄</i>)}</div>}
      <div className="sn-others">{ppl.filter(p => parse(p).room === room).slice(0, 8).map((p, i) => { const d = parse(p).doing; return <div key={p.nick} className={"sn-o" + (i % 2 ? " r" : "")} style={{ ["--dc" as any]: DC[p.dept ?? ""] ?? "#9A8F86", left: `${6 + (i % 4) * 23}%`, top: i < 4 ? "48px" : "auto", bottom: i < 4 ? "auto" : "14px" }} title={`${p.dept ? `[${p.dept}] ` : ""}${p.nick} · ${DOING[d] ?? ""}`}>
        <span className="sn-of">{room === "ice" ? "🥶" : d === "p" ? "😋" : d === "s" ? "😮‍💨" : "😌"}<em>{d === "p" ? "🍠" : d === "e" ? "🥚" : d === "s" ? "🥤" : "🐑"}</em></span><small>{p.nick}</small></div>; })}</div>
      <div className={"sn-me" + (bump && Date.now() - bump < 600 ? " bump" : "")} onClick={() => toast("💬 " + LINES[Math.floor(Math.random() * LINES.length)])}>
        <span className="sn-face">{heat > 70 ? "🥵" : heat > 35 ? "😌" : room === "ice" ? "🥶" : "🙂"}</span>
        {towel && <span className="sn-towel">🐑</span>}{heat > 50 && <span className="sn-sweat">💦</span>}
      </div>
      <div className="sn-heat"><span>땀 게이지</span><i><em style={{ width: `${heat}%` }} /></i><b>{heat > 85 ? "얼음방 가요!" : heat > 50 ? "개운해요" : "데워지는 중"}</b></div>
      {say && <div className="sn-say">{say}</div>}
    </div>
    <div className="sn-acts">
      <button type="button" onClick={potatoTap}><span>{pot < 0 ? "🍠" : potState.e}</span><b>{pot < 0 ? "고구마 굽기" : pot >= 70 ? "꺼내 먹기" : "굽는 중"}</b><small>{pot < 0 ? "불가마 숯에 묻기" : potState.t}</small>{pot >= 0 && <i className="sn-bar"><em style={{ width: `${Math.min(100, pot)}%`, background: pot >= 100 ? "#5A3A2A" : "#E58A3A" }} /></i>}</button>
      <button type="button" onClick={eggTap}><span>{egg === "peel" ? "🍳" : "🥚"}</span><b>{egg === "whole" ? "맥반석 달걀" : egg === "crack" ? "껍질 까기" : "먹기"}</b><small>{egg === "whole" ? "이마로 톡 깨기" : egg === "crack" ? "금 갔어요" : "소금 콕 찍어서"}</small></button>
      <button type="button" onClick={sikhye}><span>🥤</span><b>살얼음 식혜</b><small>{sip > 0 ? `${sip}% 남음` : "한 잔 더?"}</small><i className="sn-bar"><em style={{ width: `${sip}%`, background: "#E8C98A" }} /></i></button>
      <button type="button" className={towel ? "on" : ""} onClick={() => { setTowel(!towel); toast(towel ? "양머리 풀었어요" : "🐑 양머리 완성! 찜질방 국룰"); }}><span>🐑</span><b>양머리 수건</b><small>{towel ? "쓰는 중" : "말아서 쓰기"}</small></button>
    </div>
    {xp && <div className="fb-thanks">{xp}</div>}
    <p className="muted" style={{ fontSize: 12, margin: 0, textAlign: "center" }}>1분 넘게 쉬다가 뭔가 먹으면 오늘의 쉼 XP가 들어와요. 너무 뜨거우면 얼음방으로!</p>
  </div>;
}
