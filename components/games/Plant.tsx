"use client";
import { useEffect, useState } from "react";
import { plantAction, type Plant } from "@/lib/actions";

const STAGES = ["씨앗", "새싹", "잎", "꽃봉오리", "개화", "열매"];
const ART: Record<string, string[]> = {
  알로에: ["🫘", "🌱", "🌿", "🪴", "🌵", "🧴"], 몬스테라: ["🫘", "🌱", "🍃", "🪴", "🌴", "🎍"], 선인장: ["🫘", "🌱", "🌵", "🌵", "🌸", "🍈"], 방울토마토: ["🫘", "🌱", "🌿", "🌼", "🌸", "🍅"],
};
const NEED = [0, 2, 5, 9, 14, 20];
export default function PlantGame() {
  const [p, setP] = useState<Plant | null>(null); const [stage, setStage] = useState(0); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [loaded, setLoaded] = useState(false); const [kind, setKind] = useState("알로에");
  const [now, setNow] = useState(Date.now());
  const apply = (r: Awaited<ReturnType<typeof plantAction>>) => { setP(r.plant); setStage(r.stage); if (r.msg) setMsg(r.msg); };
  useEffect(() => { plantAction("load").then(apply).catch(() => {}).finally(() => setLoaded(true)); const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const act = async (a: "plant" | "water" | "sun" | "harvest") => { if (busy) return; setBusy(true); try { apply(await plantAction(a, kind)); } catch { setMsg("잠시 후 다시 시도해주세요"); } setBusy(false); };
  const left = (last: number, gap: number) => { const ms = last + gap - now; if (ms <= 0) return ""; const m = Math.ceil(ms / 60000); return `${Math.floor(m / 60)}시간 ${m % 60}분`; };
  const canWater = p ? now - p.lastWater >= 3 * 3600e3 : false, canSun = p ? now - p.lastSun >= 20 * 3600e3 : false;
  const next = NEED[Math.min(5, stage + 1)], prog = p ? Math.min(1, (p.waters - NEED[stage]) / Math.max(1, next - NEED[stage])) : 0;
  return (
    <div className="card">
      <div><h3>병동 창가 화분</h3><div className="muted">진짜 시간으로 자라는 화분이에요. <b>3시간마다 물</b>, <b>하루 한 번 햇빛</b>. 단계가 오를 때마다 경험치, 열매가 열리면 수확 보너스(첫 수확 +300). 48시간 방치하면 시들어요 (물 주면 회복). 계정에 저장돼요.</div></div>
      {!loaded ? <div className="muted">불러오는 중…</div> : !p || (!p.planted && stage === 0 && p.waters === 0) ? (
        <div className="form">
          <div className="row">{Object.keys(ART).map(k => <button key={k} type="button" className="cats-btn" aria-pressed={kind === k} onClick={() => setKind(k)}>{ART[k][5]} {k}</button>)}</div>
          <button className="btn" type="button" disabled={busy} onClick={() => act("plant")}>씨앗 심기</button>
          {p && p.harvests > 0 && <div className="muted">지금까지 {p.harvests}번 수확했어요</div>}
        </div>
      ) : (
        <>
          <div className={"plant" + (p.wilted ? " wilted" : "")}>
            <div className="plant-art">{ART[p.kind]?.[stage] ?? "🪴"}</div>
            <div className="plant-name">{p.kind} · {STAGES[stage]}{p.wilted ? " (시듦 😢)" : ""}</div>
            <div className="xpbar" style={{ width: "100%" }}><i style={{ width: `${Math.round(prog * 100)}%` }} /></div>
            <div className="muted">{stage < 5 ? `다음 단계까지 ${Math.max(0, next - p.waters)}번 더 (물·햇빛 합산)` : "열매가 열렸어요! 수확하세요"} · 수확 {p.harvests}회</div>
          </div>
          <div className="row">
            {stage < 5 ? <>
              <button className="btn" type="button" style={{ flex: 1 }} disabled={busy || !canWater} onClick={() => act("water")}>💧 물 주기{!canWater && p.lastWater ? ` (${left(p.lastWater, 3 * 3600e3)})` : ""}</button>
              <button className="btn ghost" type="button" disabled={busy || !canSun} onClick={() => act("sun")}>☀️ 햇빛{!canSun && p.lastSun ? ` (${left(p.lastSun, 20 * 3600e3)})` : ""}</button>
            </> : <button className="btn" type="button" style={{ flex: 1 }} disabled={busy} onClick={() => act("harvest")}>🧺 수확하기</button>}
          </div>
        </>
      )}
      {msg && <div className="muted" style={{ color: "var(--scrub)" }}>{msg}</div>}
    </div>
  );
}
