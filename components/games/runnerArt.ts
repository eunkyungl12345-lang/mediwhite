/** 복도 질주 — 벡터 아트 (이모지 대신 직접 그림). 모든 좌표는 '발 밑 중심' 기준, u = 단위 크기 */
export type Zone = { name: string; wall: string; wall2: string; floor: string; floor2: string; sky?: boolean; accent: string; deco: ("window" | "door" | "poster" | "lamp" | "monitor" | "city" | "siren")[] };
export const ZONES: Zone[] = [
  { name: "일반 병동", wall: "#EAF1EE", wall2: "#D7E4DF", floor: "#CFDAD5", floor2: "#BFCEC8", accent: "#6FBFA9", deco: ["window", "door", "poster"] },
  { name: "응급실", wall: "#F6ECEA", wall2: "#E8D5D1", floor: "#D9CFCC", floor2: "#C9BDB9", accent: "#E2574C", deco: ["door", "siren", "monitor"] },
  { name: "수술실", wall: "#E4EEF4", wall2: "#CBDCE6", floor: "#C8D6DE", floor2: "#B7C7D0", accent: "#3D7EA6", deco: ["lamp", "monitor", "door"] },
  { name: "옥상", wall: "#1B2742", wall2: "#26365A", floor: "#3A4150", floor2: "#2F3542", accent: "#F4D35E", sky: true, deco: ["city"] },
];
export const ZONE_LEN = 600;
export const zoneAt = (dist: number) => ZONES[Math.min(ZONES.length - 1, Math.floor(dist / ZONE_LEN) % ZONES.length)];

export type ObKind = "cart" | "bucket" | "sign" | "chair" | "ivpole" | "stretcher" | "pigeon" | "chart" | "vent";
/** 장애물 스펙: w,h는 u 배수. air=true면 공중(점프하면 맞음, 안 뛰면 통과) */
export const OBS: Record<ObKind, { w: number; h: number; air?: boolean; zones: number[] }> = {
  cart: { w: 1.5, h: 1.25, zones: [0, 1, 2] }, bucket: { w: .9, h: .95, zones: [0, 2] }, sign: { w: .9, h: 1.1, zones: [0, 1, 2] }, chair: { w: 1.4, h: 1.35, zones: [0, 1] },
  ivpole: { w: .5, h: 1.9, zones: [0, 1, 2] }, stretcher: { w: 2.4, h: 1.0, zones: [1, 2] }, pigeon: { w: .9, h: .6, air: true, zones: [3] }, chart: { w: .9, h: .7, air: true, zones: [0, 1] }, vent: { w: 1.6, h: 1.1, zones: [3] },
};

const rr = (x: CanvasRenderingContext2D, X: number, Y: number, W: number, H: number, r: number) => { x.beginPath(); x.roundRect(X, Y, W, H, r); };

export function drawBg(x: CanvasRenderingContext2D, W: number, H: number, ground: number, dist: number, z: Zone, t: number) {
  // 벽/하늘
  if (z.sky) { const g = x.createLinearGradient(0, 0, 0, ground); g.addColorStop(0, "#0E1730"); g.addColorStop(1, "#2B3A63"); x.fillStyle = g; x.fillRect(0, 0, W, ground);
    x.fillStyle = "#FFF7C2"; for (let i = 0; i < 26; i++) { const sx = ((i * 137.5 + 40) - dist * .15) % (W + 40), sy = (i * 71) % (ground * .7); x.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 2 + i)); x.fillRect((sx + W + 40) % (W + 40) - 20, sy, 2, 2); } x.globalAlpha = 1;
    x.fillStyle = "#F7EFC6"; x.beginPath(); x.arc(W * .82, ground * .22, H * .06, 0, 7); x.fill();
    // 도시 실루엣 (느린 패럴랙스)
    x.fillStyle = "#121A2E"; const bw = W * .09; for (let i = -1; i < 14; i++) { const bx = i * bw - (dist * .35) % bw; const bh = ground * (.18 + ((i * 7919) % 5) * .07); x.fillRect(bx, ground - bh, bw - 4, bh); x.fillStyle = "#F4D35E"; for (let k = 0; k < 3; k++) if ((i + k) % 3) x.fillRect(bx + 6 + k * (bw / 3.4), ground - bh + 10 + ((i * 13) % 3) * 12, 5, 7); x.fillStyle = "#121A2E"; }
    // 난간
    x.fillStyle = "#4B5569"; x.fillRect(0, ground - H * .11, W, 4); x.fillRect(0, ground - H * .06, W, 3); for (let i = -1; i < 20; i++) { const px = i * W * .08 - (dist * 1.5) % (W * .08); x.fillRect(px, ground - H * .11, 3, H * .11); }
  } else {
    x.fillStyle = z.wall; x.fillRect(0, 0, W, ground);
    // 천장 띠 + 형광등
    x.fillStyle = z.wall2; x.fillRect(0, 0, W, H * .07); x.fillStyle = "#FFFFFF"; for (let i = -1; i < 6; i++) { const lx = i * W * .3 - (dist * 2) % (W * .3); rr(x, lx, H * .025, W * .14, H * .022, 4); x.fill(); }
    // 벽 장식(패럴랙스 0.8)
    const seg = W * .42; for (let i = -1; i < 5; i++) { const bx = i * seg - (dist * 1.6) % seg; const kind = z.deco[Math.abs(Math.floor((dist * 1.6) / seg) + i) % z.deco.length];
      if (kind === "window") { x.fillStyle = "#BFD9F2"; rr(x, bx + 20, H * .14, W * .2, H * .3, 6); x.fill(); x.fillStyle = "#FFFFFF"; x.fillRect(bx + 20 + W * .1 - 2, H * .14, 4, H * .3); x.fillStyle = "#E7F0FA"; x.fillRect(bx + 20, H * .29 - 2, W * .2, 4); }
      else if (kind === "door") { x.fillStyle = z.wall2; rr(x, bx + 30, H * .16, W * .13, ground - H * .16, 4); x.fill(); x.fillStyle = "#BFD9F2"; rr(x, bx + 30 + W * .035, H * .2, W * .06, H * .14, 3); x.fill(); x.fillStyle = z.accent; x.fillRect(bx + 30 + W * .1, ground * .55, 10, 4); }
      else if (kind === "poster") { x.fillStyle = "#FFFFFF"; rr(x, bx + 40, H * .2, W * .1, H * .16, 3); x.fill(); x.fillStyle = z.accent; x.fillRect(bx + 48, H * .23, W * .085, 5); x.fillStyle = "#A9BDB6"; x.fillRect(bx + 48, H * .27, W * .07, 3); x.fillRect(bx + 48, H * .30, W * .05, 3); }
      else if (kind === "lamp") { x.fillStyle = "#8EA7B8"; x.fillRect(bx + W * .1, 0, 4, H * .12); x.fillStyle = "#DDE9F0"; x.beginPath(); x.ellipse(bx + W * .1 + 2, H * .14, W * .07, H * .03, 0, 0, 7); x.fill(); x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.moveTo(bx + W * .03, H * .14); x.lineTo(bx + W * .17, H * .14); x.lineTo(bx + W * .22, ground); x.lineTo(bx - W * .02, ground); x.fill(); }
      else if (kind === "monitor") { x.fillStyle = "#1E2A2A"; rr(x, bx + 40, H * .2, W * .12, H * .14, 4); x.fill(); x.strokeStyle = "#6FE3A5"; x.lineWidth = 2; x.beginPath(); for (let k = 0; k <= 12; k++) { const px = bx + 46 + k * (W * .12 - 12) / 12; const ph = (k % 6 === 3) ? -H * .05 : (k % 6 === 4) ? H * .03 : 0; x.lineTo(px, H * .27 + ph); } x.stroke(); }
      else if (kind === "siren") { x.fillStyle = "#E2574C"; x.globalAlpha = .5 + .5 * Math.abs(Math.sin(t * 6)); rr(x, bx + 60, H * .11, 26, 14, 4); x.fill(); x.globalAlpha = 1; x.fillStyle = "#FFFFFF"; x.font = `${Math.floor(H * .05)}px sans-serif`; x.textAlign = "left"; x.fillText("EMERGENCY", bx + 100, H * .145); }
    }
  }
  // 바닥 (타일 + 원근선)
  x.fillStyle = z.floor; x.fillRect(0, ground, W, H - ground); x.fillStyle = z.floor2; x.fillRect(0, ground, W, 3);
  const tw = W * .12; x.strokeStyle = z.floor2; x.lineWidth = 2; for (let i = -1; i < 12; i++) { const lx = i * tw - (dist * 4) % tw; x.beginPath(); x.moveTo(lx, ground); x.lineTo(lx - W * .03, H); x.stroke(); }
  x.beginPath(); x.moveTo(0, ground + (H - ground) * .55); x.lineTo(W, ground + (H - ground) * .55); x.stroke();
}

/** 간호사 캐릭터. 발 밑 (0,0) 기준, u=키의 절반 정도 */
export function drawNurse(x: CanvasRenderingContext2D, u: number, t: number, state: "run" | "jump" | "hit" | "idle", shield: boolean) {
  const leg = state === "run" ? Math.sin(t * 16) : state === "jump" ? -.6 : 0;
  x.save(); x.lineCap = "round"; x.lineJoin = "round";
  if (shield) { x.fillStyle = "rgba(111,191,169,.22)"; x.beginPath(); x.arc(0, -u * 1.05, u * 1.35, 0, 7); x.fill(); x.strokeStyle = "rgba(111,191,169,.8)"; x.lineWidth = 2; x.stroke(); }
  // 그림자
  x.fillStyle = "rgba(0,0,0,.14)"; x.beginPath(); x.ellipse(0, 2, u * .55, u * .12, 0, 0, 7); x.fill();
  // 다리
  x.strokeStyle = "#F2D7C8"; x.lineWidth = u * .2; x.beginPath(); x.moveTo(-u * .12, -u * .75); x.lineTo(-u * .12 + leg * u * .35, -u * .05); x.moveTo(u * .12, -u * .75); x.lineTo(u * .12 - leg * u * .35, -u * .05); x.stroke();
  x.strokeStyle = "#FFFFFF"; x.lineWidth = u * .22; x.beginPath(); x.moveTo(-u * .12 + leg * u * .35, -u * .05); x.lineTo(-u * .12 + leg * u * .35 + u * .12, -u * .05); x.moveTo(u * .12 - leg * u * .35, -u * .05); x.lineTo(u * .12 - leg * u * .35 + u * .12, -u * .05); x.stroke();
  // 몸통(스크럽)
  x.fillStyle = state === "hit" ? "#F3B5AE" : "#6FBFA9"; rr(x, -u * .36, -u * 1.45, u * .72, u * .78, u * .14); x.fill();
  x.fillStyle = "#FFFFFF"; x.fillRect(-u * .3, -u * 1.0, u * .18, u * .05); // 주머니
  // 팔
  const arm = state === "run" ? Math.sin(t * 16 + Math.PI) : state === "jump" ? -1 : .2;
  x.strokeStyle = "#F2D7C8"; x.lineWidth = u * .17; x.beginPath(); x.moveTo(-u * .3, -u * 1.3); x.lineTo(-u * .3 + arm * u * .3, -u * .95); x.moveTo(u * .3, -u * 1.3); x.lineTo(u * .3 - arm * u * .3, -u * .95); x.stroke();
  // 머리
  x.fillStyle = "#F7DFD2"; x.beginPath(); x.arc(0, -u * 1.8, u * .36, 0, 7); x.fill();
  x.fillStyle = "#4A3328"; x.beginPath(); x.arc(0, -u * 1.86, u * .37, Math.PI, 0); x.fill(); // 머리카락
  x.fillStyle = "#4A3328"; x.beginPath(); x.arc(-u * .34, -u * 1.8, u * .14, 0, 7); x.fill(); // 똥머리
  x.fillStyle = "#FFFFFF"; rr(x, -u * .28, -u * 2.22, u * .56, u * .18, 3); x.fill(); x.fillStyle = "#E2574C"; x.fillRect(-u * .03, -u * 2.2, u * .06, u * .14); x.fillRect(-u * .07, -u * 2.16, u * .14, u * .06); // 캡
  x.fillStyle = "#222"; if (state === "hit") { x.font = `${u * .3}px sans-serif`; x.textAlign = "center"; x.fillText("><", u * .1, -u * 1.72); } else { x.beginPath(); x.arc(u * .12, -u * 1.8, u * .035, 0, 7); x.arc(u * .26, -u * 1.8, u * .035, 0, 7); x.fill(); }
  x.restore();
}

export function drawOb(x: CanvasRenderingContext2D, kind: ObKind, w: number, h: number, t: number) {
  x.save(); x.lineCap = "round";
  const sh = () => { x.fillStyle = "rgba(0,0,0,.14)"; x.beginPath(); x.ellipse(0, 2, w * .5, h * .07, 0, 0, 7); x.fill(); };
  if (kind === "cart") { sh(); x.fillStyle = "#8FA7B8"; rr(x, -w / 2, -h, w, h * .72, 6); x.fill(); x.fillStyle = "#DDE6EC"; x.fillRect(-w / 2 + 5, -h + 7, w - 10, h * .24); x.fillRect(-w / 2 + 5, -h * .55, w - 10, h * .18); x.fillStyle = "#3C4A55"; for (const px of [-w * .32, w * .32]) { x.beginPath(); x.arc(px, -h * .1, h * .11, 0, 7); x.fill(); } x.fillStyle = "#E2574C"; x.fillRect(-w * .1, -h + 10, w * .2, 4); }
  else if (kind === "bucket") { sh(); x.fillStyle = "#F4D35E"; x.beginPath(); x.moveTo(-w / 2, -h * .7); x.lineTo(w / 2, -h * .7); x.lineTo(w * .4, 0); x.lineTo(-w * .4, 0); x.fill(); x.fillStyle = "#D9B93A"; x.fillRect(-w / 2, -h * .72, w, 5); x.strokeStyle = "#8C6E3E"; x.lineWidth = 4; x.beginPath(); x.moveTo(w * .1, -h * .7); x.lineTo(w * .3, -h); x.stroke(); x.fillStyle = "#C9C2B0"; x.beginPath(); x.arc(w * .3, -h, w * .14, 0, 7); x.fill(); }
  else if (kind === "sign") { sh(); x.fillStyle = "#F4D35E"; x.beginPath(); x.moveTo(0, -h); x.lineTo(w / 2, 0); x.lineTo(-w / 2, 0); x.fill(); x.fillStyle = "#1E1E1E"; x.font = `bold ${Math.floor(h * .3)}px sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("!", 0, -h * .35); x.fillStyle = "#1E1E1E"; x.fillRect(-w * .3, -h * .22, w * .6, 3); }
  else if (kind === "chair") { sh(); x.fillStyle = "#3C4A55"; x.beginPath(); x.arc(-w * .2, -h * .25, h * .25, 0, 7); x.fill(); x.fillStyle = "#6B7B88"; x.beginPath(); x.arc(-w * .2, -h * .25, h * .12, 0, 7); x.fill(); x.fillStyle = "#3C4A55"; x.beginPath(); x.arc(w * .3, -h * .12, h * .12, 0, 7); x.fill(); x.fillStyle = "#4F7CAC"; rr(x, -w * .15, -h * .62, w * .5, h * .14, 4); x.fill(); rr(x, -w * .15, -h, w * .12, h * .4, 4); x.fill(); x.strokeStyle = "#6B7B88"; x.lineWidth = 3; x.beginPath(); x.moveTo(-w * .03, -h); x.lineTo(w * .12, -h); x.stroke(); }
  else if (kind === "ivpole") { sh(); x.strokeStyle = "#8FA7B8"; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -h); x.moveTo(-w, 0); x.lineTo(w, 0); x.stroke(); x.fillStyle = "#DDE6EC"; rr(x, -w * .5, -h, w, h * .3, 4); x.fill(); x.fillStyle = "#BFD9F2"; x.fillRect(-w * .5 + 2, -h + h * .3 * .45, w - 4, h * .3 * .5); x.strokeStyle = "#BFD9F2"; x.lineWidth = 2; x.beginPath(); x.moveTo(w * .2, -h * .7); x.quadraticCurveTo(w * .8, -h * .5, w * .3, -h * .2); x.stroke(); }
  else if (kind === "stretcher") { sh(); x.fillStyle = "#DDE6EC"; rr(x, -w / 2, -h, w, h * .32, 6); x.fill(); x.fillStyle = "#FFFFFF"; rr(x, -w / 2 + 4, -h + 4, w * .3, h * .18, 4); x.fill(); x.fillStyle = "#6FBFA9"; rr(x, -w / 2 + w * .33, -h + 5, w * .62, h * .2, 4); x.fill(); x.strokeStyle = "#8FA7B8"; x.lineWidth = 3; x.beginPath(); for (const px of [-w * .35, w * .35]) { x.moveTo(px, -h * .68); x.lineTo(px, -h * .12); } x.stroke(); x.fillStyle = "#3C4A55"; for (const px of [-w * .35, w * .35]) { x.beginPath(); x.arc(px, -h * .1, h * .1, 0, 7); x.fill(); } }
  else if (kind === "pigeon") { const f = Math.sin(t * 18); x.fillStyle = "#9AA4B1"; x.beginPath(); x.ellipse(0, -h * .5, w * .35, h * .3, 0, 0, 7); x.fill(); x.beginPath(); x.arc(w * .3, -h * .7, h * .18, 0, 7); x.fill(); x.fillStyle = "#F2A541"; x.beginPath(); x.moveTo(w * .45, -h * .7); x.lineTo(w * .58, -h * .66); x.lineTo(w * .45, -h * .62); x.fill(); x.strokeStyle = "#7B8794"; x.lineWidth = h * .14; x.beginPath(); x.moveTo(-w * .05, -h * .55); x.lineTo(-w * .35, -h * .55 - f * h * .45); x.stroke(); x.fillStyle = "#222"; x.beginPath(); x.arc(w * .34, -h * .73, 2, 0, 7); x.fill(); }
  else if (kind === "chart") { x.save(); x.rotate(Math.sin(t * 6) * .3); x.fillStyle = "#FFFFFF"; rr(x, -w / 2, -h, w, h, 4); x.fill(); x.fillStyle = "#8FA7B8"; rr(x, -w * .2, -h - 4, w * .4, 8, 3); x.fill(); x.fillStyle = "#A9BDB6"; for (let i = 0; i < 3; i++) x.fillRect(-w * .35, -h * .75 + i * h * .22, w * .7 - i * w * .15, 3); x.restore(); }
  else if (kind === "vent") { sh(); x.fillStyle = "#6B7280"; rr(x, -w / 2, -h, w, h, 6); x.fill(); x.fillStyle = "#9CA3AF"; for (let i = 0; i < 4; i++) x.fillRect(-w / 2 + 6, -h + 8 + i * (h - 12) / 4, w - 12, 4); x.fillStyle = "rgba(255,255,255,.25)"; for (let i = 0; i < 3; i++) { const py = -h - 6 - ((t * 40 + i * 9) % 26); x.beginPath(); x.arc(-w * .25 + i * w * .25, py, 4 + i, 0, 7); x.fill(); } }
  x.restore();
}

export function drawItem(x: CanvasRenderingContext2D, kind: "coffee" | "pill" | "star" | "heart", r: number, t: number) {
  x.save(); const bob = Math.sin(t * 5) * r * .15; x.translate(0, bob);
  if (kind === "coffee") { x.fillStyle = "#F5EFE6"; x.beginPath(); x.moveTo(-r * .7, -r * .9); x.lineTo(r * .7, -r * .9); x.lineTo(r * .5, r * .6); x.lineTo(-r * .5, r * .6); x.fill(); x.fillStyle = "#B08968"; x.fillRect(-r * .7, -r * .7, r * 1.4, r * .35); x.fillStyle = "#6B4F3A"; x.fillRect(-r * .75, -r * 1.05, r * 1.5, r * .2); x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 2; x.beginPath(); x.moveTo(-r * .15, -r * 1.25); x.quadraticCurveTo(0, -r * 1.5, -r * .05, -r * 1.7); x.stroke(); }
  else if (kind === "pill") { x.save(); x.rotate(-.6); x.fillStyle = "#9B7EDE"; rr(x, -r, -r * .45, r, r * .9, r * .45); x.fill(); x.fillStyle = "#FFFFFF"; rr(x, 0, -r * .45, r, r * .9, r * .45); x.fill(); x.fillStyle = "rgba(255,255,255,.5)"; x.fillRect(-r * .8, -r * .3, r * .5, r * .12); x.restore(); }
  else if (kind === "star") { x.fillStyle = "#F4D35E"; x.shadowColor = "#F4D35E"; x.shadowBlur = 10; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .5 : r; x.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } x.fill(); }
  else { x.fillStyle = "#F07A70"; x.beginPath(); x.moveTo(0, r * .7); x.bezierCurveTo(-r * 1.4, -r * .3, -r * .4, -r * 1.2, 0, -r * .4); x.bezierCurveTo(r * .4, -r * 1.2, r * 1.4, -r * .3, 0, r * .7); x.fill(); }
  x.restore();
}

export function drawHearts(x: CanvasRenderingContext2D, X: number, Y: number, n: number, max: number, shields: number) {
  for (let i = 0; i < max; i++) { x.save(); x.translate(X + i * 22, Y); x.fillStyle = i < n ? "#F07A70" : "rgba(0,0,0,.15)"; const r = 8; x.beginPath(); x.moveTo(0, r * .7); x.bezierCurveTo(-r * 1.4, -r * .3, -r * .4, -r * 1.2, 0, -r * .4); x.bezierCurveTo(r * .4, -r * 1.2, r * 1.4, -r * .3, 0, r * .7); x.fill(); x.restore(); }
  for (let i = 0; i < shields; i++) { x.save(); x.translate(X + max * 22 + 4 + i * 18, Y); x.fillStyle = "#6FBFA9"; x.beginPath(); x.moveTo(0, -8); x.lineTo(7, -5); x.lineTo(6, 3); x.lineTo(0, 8); x.lineTo(-6, 3); x.lineTo(-7, -5); x.fill(); x.restore(); }
}
