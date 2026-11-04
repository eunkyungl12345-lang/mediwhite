"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HOMES, SLOTS, fmt } from "@/lib/tycoon";
import { planOf, roomOf, roomCenter, roomForSlot, SLOT_POS, type Plan, type Room } from "./plan";
import { buildFurniture } from "./furniture";
import { buildKit, hasKit } from "./kit";

/** 🏠 내 집 3D — 평면도(왼쪽 위)에서 방을 누르거나 바닥을 탭하면 캐릭터가 걸어가요. 방마다 가구를 사서 꾸며요. */
type Props = { home: number; items: Record<string, number>; cash: number; onBuy: (slot: string) => void; nick: string };
const WALL_H = 2.7, T = .12;

function canvasTex(draw: (x: CanvasRenderingContext2D, s: number) => void, s = 512, rep = 1) { const c = document.createElement("canvas"); c.width = c.height = s; draw(c.getContext("2d")!, s); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const woodTex = (base: string) => canvasTex((x, s) => { x.fillStyle = base; x.fillRect(0, 0, s, s); for (let i = 0; i < 8; i++) { const y = i * s / 8; x.fillStyle = `rgba(0,0,0,${.03 + (i % 3) * .025})`; x.fillRect(0, y, s, s / 8); x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, y, s, 1.5); const off = ((i * 37) % 8) * s / 8; x.fillRect(off, y, 1.5, s / 8); for (let k = 0; k < 30; k++) { x.strokeStyle = `rgba(60,30,10,${Math.random() * .08})`; x.beginPath(); const yy = y + Math.random() * s / 8; x.moveTo(0, yy); x.bezierCurveTo(s * .3, yy + 2, s * .6, yy - 2, s, yy + 1); x.stroke(); } } }, 512);
const tileTex = (base: string, line: string, n = 6) => canvasTex((x, s) => { x.fillStyle = base; x.fillRect(0, 0, s, s); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * .03})`; x.fillRect(Math.random() * s, Math.random() * s, 3, 3); } x.strokeStyle = line; x.lineWidth = 3; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s / n, 0); x.lineTo(i * s / n, s); x.moveTo(0, i * s / n); x.lineTo(s, i * s / n); x.stroke(); } }, 512);
const marbleTex = () => canvasTex((x, s) => { x.fillStyle = "#EEECE8"; x.fillRect(0, 0, s, s); for (let k = 0; k < 18; k++) { x.strokeStyle = `rgba(120,120,130,${.05 + Math.random() * .15})`; x.lineWidth = .5 + Math.random() * 2; x.beginPath(); let px = Math.random() * s, py = 0; x.moveTo(px, py); while (py < s) { px += (Math.random() - .5) * 40; py += 20 + Math.random() * 30; x.lineTo(px, py); } x.stroke(); } x.strokeStyle = "rgba(0,0,0,.08)"; x.lineWidth = 2; x.strokeRect(0, 0, s, s); }, 512);

function floorMat(room: Room, home: number) {
  const lux = home >= 7, space = !!HOMES[home].space;
  let map: THREE.Texture; let rough = .7;
  if (room.kind === "bath" || room.kind === "spa") { map = lux ? marbleTex() : tileTex("#E9EEF2", "#C9D2DA", 8); rough = .25; }
  else if (room.kind === "kitchen" || room.kind === "util") { map = lux ? marbleTex() : tileTex("#E6E1D8", "#CFC6B6", 5); rough = .35; }
  else if (room.kind === "garage") { map = tileTex("#8C9096", "#6E7277", 3); rough = .9; }
  else map = woodTex(space ? "#CBD5E1" : lux ? "#8B6A4E" : home >= 3 ? "#B48A5E" : "#C8B08A");
  map.repeat.set(room.w / 2, room.d / 2);
  return new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: room.kind === "garage" ? .1 : 0 });
}

function buildOutside(scene: THREE.Scene, plan: Plan, home: number) {
  const h = HOMES[home], v = h.view;
  const space = v === "space" || v === "mars" || v === "orbit";
  scene.background = new THREE.Color(space ? 0x05060f : v === "nightriver" ? 0x0d1430 : 0xbfd9f2);
  scene.fog = new THREE.Fog(scene.background as THREE.Color, 40, 140);
  const g = new THREE.Group(); scene.add(g);
  const cx = plan.W / 2, cz = plan.D / 2;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: v === "mars" ? 0xb5532c : space ? 0x8a8f99 : v === "garden" ? 0x5f8f4e : 0x6b7078, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(cx, -.02, cz); ground.receiveShadow = true; g.add(ground);
  if (space) {
    const st = new THREE.BufferGeometry(), N = 1500, p = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI * .5, r = 150; p[i * 3] = cx + Math.cos(a) * Math.cos(b) * r; p[i * 3 + 1] = Math.sin(b) * r + 5; p[i * 3 + 2] = cz + Math.sin(a) * Math.cos(b) * r; }
    st.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.add(new THREE.Points(st, new THREE.PointsMaterial({ color: 0xffffff, size: .6, sizeAttenuation: true })));
    const planet = new THREE.Mesh(new THREE.SphereGeometry(18, 32, 24), new THREE.MeshStandardMaterial({ color: v === "mars" ? 0x2f7bd6 : 0x3b7dd8, emissive: 0x0a2a5a, emissiveIntensity: .4, roughness: .8 })); planet.position.set(cx - 60, 40, cz - 90); g.add(planet);
    if (v === "orbit") { const ring = new THREE.Mesh(new THREE.TorusGeometry(30, 3, 2, 80), new THREE.MeshStandardMaterial({ color: 0xd8c9a8, transparent: true, opacity: .6 })); ring.position.copy(planet.position); ring.rotation.x = 1.2; g.add(ring); }
    for (let i = 0; i < 30; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 3, 0), new THREE.MeshStandardMaterial({ color: v === "mars" ? 0x8e3b1f : 0x6b6f78, roughness: 1 })); const a = Math.random() * Math.PI * 2, r = 25 + Math.random() * 60; rk.position.set(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r); g.add(rk); }
  } else {
    const win = (lit: number) => canvasTex((x, s) => { x.fillStyle = "#2a3140"; x.fillRect(0, 0, s, s); for (let i = 0; i < 8; i++) for (let k = 0; k < 16; k++) { x.fillStyle = Math.random() < lit ? "#FFE3A3" : "#3c4558"; x.fillRect(i * s / 8 + 6, k * s / 16 + 4, s / 8 - 12, s / 16 - 8); } }, 256);
    const night = v === "nightriver"; const wt = win(night ? .55 : .15);
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r = 45 + Math.random() * 30, H = 10 + Math.random() * (v === "garden" ? 8 : 40), W = 5 + Math.random() * 8; const b = new THREE.Mesh(new THREE.BoxGeometry(W, H, W), new THREE.MeshStandardMaterial({ map: wt, color: night ? 0xffffff : 0xd8dee8, emissive: night ? 0xffffff : 0, emissiveMap: night ? wt : null, emissiveIntensity: night ? .6 : 0, roughness: .8 })); b.position.set(cx + Math.cos(a) * r, H / 2, cz + Math.sin(a) * r); g.add(b); }
    if (v === "river" || v === "nightriver") { const river = new THREE.Mesh(new THREE.PlaneGeometry(400, 30), new THREE.MeshStandardMaterial({ color: night ? 0x0b1a33 : 0x3f78a8, roughness: .1, metalness: .3 })); river.rotation.x = -Math.PI / 2; river.position.set(cx, .01, cz - 30); g.add(river); }
    if (v === "garden") for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 20; const tr = new THREE.Group(); tr.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .3, 2, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2e }))); const lf = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), new THREE.MeshStandardMaterial({ color: 0x4f8f4e, roughness: 1 })); lf.position.y = 2.2; tr.add(lf); tr.position.set(cx + Math.cos(a) * r, 1, cz + Math.sin(a) * r); tr.traverse(o => o.castShadow = true); g.add(tr); }
  }
  return space;
}

function buildHouse(scene: THREE.Scene, plan: Plan, home: number) {
  const group = new THREE.Group(); scene.add(group); const walls: THREE.Mesh[] = []; const floors: THREE.Mesh[] = [];
  const h = HOMES[home], lux = home >= 7;
  const wallMat = () => new THREE.MeshStandardMaterial({ color: new THREE.Color(h.wall), roughness: .92, transparent: true, opacity: 1 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: .05, metalness: .2, transparent: true, opacity: .22, depthWrite: false });
  const frame = new THREE.MeshStandardMaterial({ color: lux ? 0x2b2b2b : 0xf4f4f4, roughness: .4, metalness: lux ? .6 : 0 });
  const baseboard = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: .6 });
  for (const rm of plan.rooms) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(rm.w, rm.d), floorMat(rm, home)); f.rotation.x = -Math.PI / 2; f.position.set(rm.x + rm.w / 2, 0, rm.z + rm.d / 2); f.receiveShadow = true; f.userData.room = rm.key; floors.push(f); group.add(f);
    if (rm.kind === "garage") { const lineM = new THREE.MeshBasicMaterial({ color: 0xffd36e }); for (const dx of [.35, rm.w - .35]) { const ln = new THREE.Mesh(new THREE.PlaneGeometry(.08, rm.d * .8), lineM); ln.rotation.x = -Math.PI / 2; ln.position.set(rm.x + dx, .01, rm.z + rm.d / 2); group.add(ln); }
      const stop = new THREE.Mesh(new THREE.BoxGeometry(rm.w * .5, .12, .2), new THREE.MeshStandardMaterial({ color: 0xffd36e, roughness: .6 })); stop.position.set(rm.x + rm.w / 2, .06, rm.z + .5); group.add(stop);
      for (const fz of [.3, .7]) { const strip = new THREE.Mesh(new THREE.BoxGeometry(rm.w * .7, .04, .12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 })); strip.position.set(rm.x + rm.w / 2, WALL_H - .05, rm.z + rm.d * fz); group.add(strip); const gl = new THREE.PointLight(0xf4f8ff, 2.2, 9, 1.6); gl.position.set(rm.x + rm.w / 2, WALL_H - .3, rm.z + rm.d * fz); group.add(gl); }
      const door = new THREE.Mesh(new THREE.BoxGeometry(.06, 2.4, rm.d * .55), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: .4, metalness: .6 })); door.position.set(rm.x + rm.w + .02, 1.2, rm.z + rm.d * .55); group.add(door); for (let i = 0; i < 8; i++) { const rib = new THREE.Mesh(new THREE.BoxGeometry(.08, .03, rm.d * .55), new THREE.MeshStandardMaterial({ color: 0x7a838d })); rib.position.set(rm.x + rm.w + .04, .2 + i * .3, rm.z + rm.d * .55); group.add(rib); }
    }
    // 각 변: [x1,z1,x2,z2, 방향]
    const edges: [number, number, number, number][] = [[rm.x, rm.z, rm.x + rm.w, rm.z], [rm.x, rm.z + rm.d, rm.x + rm.w, rm.z + rm.d], [rm.x, rm.z, rm.x, rm.z + rm.d], [rm.x + rm.w, rm.z, rm.x + rm.w, rm.z + rm.d]];
    edges.forEach(([x1, z1, x2, z2], ei) => {
      const horiz = z1 === z2, L = horiz ? x2 - x1 : z2 - z1; const inset = (ei === 0 || ei === 2 ? 1 : -1) * T / 2;
      // 이웃 방과 겹치는 구간에 문 구멍
      const gaps: [number, number][] = [];
      for (const o of plan.rooms) { if (o === rm) continue; const oe: [number, number, number, number][] = [[o.x, o.z, o.x + o.w, o.z], [o.x, o.z + o.d, o.x + o.w, o.z + o.d], [o.x, o.z, o.x, o.z + o.d], [o.x + o.w, o.z, o.x + o.w, o.z + o.d]];
        for (const [a1, b1, a2, b2] of oe) { if (horiz && b1 === b2 && Math.abs(b1 - z1) < .01) { const lo = Math.max(x1, a1), hi = Math.min(x2, a2); if (hi - lo >= 1.1) { const c = (lo + hi) / 2 - x1; gaps.push([c - .5, c + .5]); } } if (!horiz && a1 === a2 && Math.abs(a1 - x1) < .01) { const lo = Math.max(z1, b1), hi = Math.min(z2, b2); if (hi - lo >= 1.1) { const c = (lo + hi) / 2 - z1; gaps.push([c - .5, c + .5]); } } } }
      const outer = !gaps.length && (Math.abs(x1) < .01 && !horiz || Math.abs(z1) < .01 && horiz || Math.abs(x1 - plan.W) < .01 && !horiz || Math.abs(z1 - plan.D) < .01 && horiz || true);
      gaps.sort((a, b) => a[0] - b[0]); let cur = 0; const segs: [number, number][] = []; for (const [a, b] of gaps) { if (a > cur) segs.push([cur, a]); cur = Math.max(cur, b); } if (cur < L) segs.push([cur, L]);
      for (const [a, b] of segs) {
        const len = b - a; if (len < .05) continue; const mid = a + len / 2;
        const isOuter = !plan.rooms.some(o => o !== rm && (horiz ? (Math.abs(o.z - z1) < .01 || Math.abs(o.z + o.d - z1) < .01) && o.x < x1 + mid && o.x + o.w > x1 + mid : (Math.abs(o.x - x1) < .01 || Math.abs(o.x + o.w - x1) < .01) && o.z < z1 + mid && o.z + o.d > z1 + mid));
        const winOK = isOuter && len > 1.6 && rm.kind !== "bath" && rm.kind !== "garage" && rm.kind !== "util";
        const pos = (along: number, y: number) => horiz ? new THREE.Vector3(x1 + along, y, z1 + inset) : new THREE.Vector3(x1 + inset, y, z1 + along);
        const mk = (al1: number, al2: number, y1: number, y2: number, m: THREE.Material) => { const ln = al2 - al1, hh = y2 - y1; if (ln <= .01 || hh <= .01) return; const geo = horiz ? new THREE.BoxGeometry(ln, hh, T) : new THREE.BoxGeometry(T, hh, ln); const mm = m.clone() as THREE.MeshStandardMaterial; mm.transparent = true; const w = new THREE.Mesh(geo, mm); w.userData.op = mm.opacity; w.position.copy(pos(al1 + ln / 2, y1 + hh / 2)); w.castShadow = m !== glass; w.receiveShadow = true; group.add(w); walls.push(w); return w; };
        if (winOK) { const wl = Math.min(len - .6, lux ? len - .3 : 2.4), w1 = a + (len - wl) / 2, w2 = w1 + wl, sill = lux ? .15 : .9, top = 2.3; const wm = wallMat(); mk(a, w1, 0, WALL_H, wm); mk(w2, b, 0, WALL_H, wm); mk(w1, w2, 0, sill, wm); mk(w1, w2, top, WALL_H, wm); mk(w1, w2, sill, top, glass); const fr = horiz ? new THREE.BoxGeometry(wl, .05, T + .04) : new THREE.BoxGeometry(T + .04, .05, wl); for (const y of [sill, top]) { const fm = frame.clone(); fm.transparent = true; const m = new THREE.Mesh(fr, fm); m.userData.op = 1; m.position.copy(pos(w1 + wl / 2, y)); group.add(m); walls.push(m); } }
        else { const wm = wallMat(); mk(a, b, 0, WALL_H, wm); }
        const bb = horiz ? new THREE.BoxGeometry(len, .1, T + .02) : new THREE.BoxGeometry(T + .02, .1, len); const bm = new THREE.Mesh(bb, baseboard); bm.position.copy(pos(mid, .05)); group.add(bm);
      }
      void outer;
    });
    // 방 이름 바닥 표시(은은하게)
  }
  // 문틀 위 몰딩·현관 매트
  return { group, walls, floors };
}

function makeChar(nick: string) {
  const g = new THREE.Group(); const m = (c: number, r = .7) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const skin = m(0xf3cfb3, .6), hair = m(0x2b1e18, .8), top = m(0xf4f4f4, .8), pants = m(0x3a4159, .8);
  const legs: THREE.Mesh[] = []; for (const sx of [-.09, .09]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .42, 4, 8), pants); l.position.set(sx, .32, 0); legs.push(l); g.add(l); const sh = new THREE.Mesh(new THREE.BoxGeometry(.12, .07, .22), m(0xf0f0f0, .5)); sh.position.set(sx, .04, .03); l.userData.shoe = sh; g.add(sh); }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .42, 6, 12), top); body.position.y = .92; g.add(body);
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(.23, .26, .5, 16, 1, true), m(0x6fbfa9, .8)); coat.position.y = .82; g.add(coat);
  const arms: THREE.Mesh[] = []; for (const sx of [-.27, .27]) { const a = new THREE.Mesh(new THREE.CapsuleGeometry(.06, .4, 4, 8), top); a.position.set(sx, .92, 0); arms.push(a); g.add(a); }
  const head = new THREE.Group(); head.add(new THREE.Mesh(new THREE.SphereGeometry(.2, 20, 16), skin)); const hr = new THREE.Mesh(new THREE.SphereGeometry(.212, 20, 12, 0, Math.PI * 2, 0, Math.PI * .55), hair); hr.position.y = .02; head.add(hr); const bun = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), hair); bun.position.set(0, .12, -.15); head.add(bun);
  for (const sx of [-.07, .07]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 8), m(0x1a1410, .3)); e.position.set(sx, 0, .185); head.add(e); }
  head.position.y = 1.42; g.add(head);
  const sp = (() => { const c = document.createElement("canvas"), x = c.getContext("2d")!; x.font = "700 30px system-ui"; const w = x.measureText(nick).width + 28; c.width = w; c.height = 46; x.font = "700 30px system-ui"; x.fillStyle = "rgba(20,24,34,.75)"; x.beginPath(); x.roundRect(0, 0, w, 46, 23); x.fill(); x.fillStyle = "#fff"; x.textBaseline = "middle"; x.fillText(nick, 14, 24); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(w / 46 * .3, .3, 1); s.position.y = 1.85; s.renderOrder = 10; return s; })(); g.add(sp);
  g.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  return { g, legs, arms, body };
}

export default function Home3D(props: Props) {
  const { home, items } = props; const { cash, onBuy, nick } = props;
  const box = useRef<HTMLDivElement>(null);
  const plan = useMemo(() => planOf(home), [home]);
  const [here, setHere] = useState<string>(plan.rooms.find(r => r.kind === "living")?.key ?? plan.rooms[0].key);
  const [deco, setDeco] = useState(false);
  const [pos, setPos] = useState({ x: 0, z: 0 });
  const st = useRef<any>({});
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    const el = box.current!; const S = st.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
    const cam = new THREE.PerspectiveCamera(45, 1, .1, 400);
    const space = buildOutside(scene, plan, home);
    const night = HOMES[home].view === "nightriver" || space;
    scene.add(new THREE.HemisphereLight(night ? 0x8090c0 : 0xfff6e8, 0x6b5a48, night ? .35 : .7));
    const sun = new THREE.DirectionalLight(night ? 0x9fb4ff : 0xfff1d6, night ? .5 : 2.2); sun.position.set(plan.W / 2 - 12, 20, plan.D / 2 + 14); sun.target.position.set(plan.W / 2, 0, plan.D / 2); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536); const sc = Math.max(plan.W, plan.D); Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 1, far: 80 }); sun.shadow.bias = -.0004; scene.add(sun, sun.target);
    const house = buildHouse(scene, plan, home);
    for (const rm of plan.rooms) { const l = new THREE.PointLight(night ? 0xffd9a8 : 0xfff4e0, night ? 2.2 : .7, Math.max(rm.w, rm.d) * 1.6, 1.8); l.position.set(rm.x + rm.w / 2, 2.5, rm.z + rm.d / 2); scene.add(l); }
    const furn = new THREE.Group(); scene.add(furn);
    const markers = new THREE.Group(); scene.add(markers);
    const ch = makeChar(nick); scene.add(ch.g);
    const start = roomCenter(plan.rooms.find(r => r.key === here) ?? plan.rooms[0]); ch.g.position.set(start.x, 0, start.z + .3);
    Object.assign(S, { zoom: 1, renderer, scene, cam, house, furn, markers, ch, path: [] as THREE.Vector3[], yaw: 0, camYaw: 0, dragging: false, fade: 0 });
    const size = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    size(); const ro = new ResizeObserver(size); ro.observe(el);
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let down: { x: number; y: number; t: number; yaw: number } | null = null;
    const wheel = (e: WheelEvent) => { e.preventDefault(); S.zoom = Math.max(.45, Math.min(1.8, (S.zoom ?? 1) * (e.deltaY > 0 ? 1.1 : .9))); }; renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    const pts = new Map<number, { x: number; y: number }>(); let pinch0 = 0, zoom0 = 1;
    const pd = (e: PointerEvent) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = S.zoom; down = null; return; } down = { x: e.clientX, y: e.clientY, t: performance.now(), yaw: S.camYaw }; };
    const pmv = (e: PointerEvent) => { if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2 && pinch0) { const [a, b] = [...pts.values()]; S.zoom = Math.max(.45, Math.min(1.8, zoom0 * pinch0 / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)))); return; } if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 6) S.camYaw = down.yaw - dx * .006; };
    const pu = (e: PointerEvent) => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved > 8) return; const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
      const mh = ray.intersectObjects(markers.children, true)[0]; if (mh) { let o: THREE.Object3D | null = mh.object; while (o && !o.userData.slot) o = o.parent; if (o) { S.onMarker?.(o.userData.slot); return; } }
      const hit = ray.intersectObjects(house.floors, false)[0]; if (hit) S.goTo?.(hit.point.x, hit.point.z); };
    renderer.domElement.addEventListener("pointerdown", pd); renderer.domElement.addEventListener("pointermove", pmv); renderer.domElement.addEventListener("pointerup", pu); renderer.domElement.addEventListener("pointercancel", pu);
    let raf = 0, last = performance.now(), t = 0, lastRoom = "";
    const camPos = new THREE.Vector3(), look = new THREE.Vector3();
    const loop = () => { raf = requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
      const p = ch.g.position; let walking = false;
      if (S.path.length) { const tg = S.path[0], dx = tg.x - p.x, dz = tg.z - p.z, d = Math.hypot(dx, dz); if (d < .05) S.path.shift(); else { const sp = Math.min(d, 2.4 * dt); p.x += dx / d * sp; p.z += dz / d * sp; S.yaw = Math.atan2(dx, dz); walking = true; } }
      ch.g.rotation.y += ((S.yaw - ch.g.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * .2;
      const sw = walking ? Math.sin(t * 10) : 0; ch.legs[0].rotation.x = sw * .5; ch.legs[1].rotation.x = -sw * .5; ch.arms[0].rotation.x = -sw * .4; ch.arms[1].rotation.x = sw * .4; ch.body.position.y = .92 + (walking ? Math.abs(Math.sin(t * 10)) * .02 : Math.sin(t * 2) * .006);
      // 카메라: 캐릭터 뒤쪽 위에서 (좌우로 끌면 회전)
      const asp = Math.min(1.2, cam.aspect + .2), dist = 7.5 / asp * (S.zoom ?? 1), ht = dist * 1.05; camPos.set(p.x + Math.sin(S.camYaw) * dist, ht, p.z + Math.cos(S.camYaw) * dist); cam.position.lerp(camPos, .08); look.set(p.x, .8, p.z); cam.lookAt(look);
      // 카메라와 캐릭터 사이 벽은 반투명
      for (const w of house.walls) { const m = w.material as THREE.MeshStandardMaterial; const wp = w.position; const toCam = new THREE.Vector2(cam.position.x - p.x, cam.position.z - p.z).normalize(); const toW = new THREE.Vector2(wp.x - p.x, wp.z - p.z); const ahead = toW.dot(toCam); const base = w.userData.op ?? 1, tgt = ahead > .3 ? Math.min(base, .1) : base; m.opacity += (tgt - m.opacity) * .2; m.depthWrite = base >= 1 && m.opacity > .9; }
      for (const mk of markers.children) { mk.rotation.y += dt; mk.position.y = .5 + Math.sin(t * 2 + mk.position.x) * .06; }
      const rm = roomOf(plan, p.x, p.z); if (rm && rm.key !== lastRoom) { lastRoom = rm.key; setHere(rm.key); }
      if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) setPos({ x: p.x, z: p.z });
      renderer.render(scene, cam); };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.domElement.remove(); renderer.dispose(); pm.dispose(); scene.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mt = m.material as any; if (Array.isArray(mt)) mt.forEach(x => x.dispose()); else mt?.dispose?.(); }); };
  }, [plan, home]); // eslint-disable-line

  // 길찾기: 같은 방이면 직진, 다른 방이면 문(겹치는 구간 가운데)을 거쳐서. 이웃이 아니면 거실을 경유
  useEffect(() => { const S = st.current;
    const doorBetween = (a: Room, b: Room) => { if (Math.abs(a.x + a.w - b.x) < .01 || Math.abs(b.x + b.w - a.x) < .01) { const x = Math.abs(a.x + a.w - b.x) < .01 ? b.x : a.x, lo = Math.max(a.z, b.z), hi = Math.min(a.z + a.d, b.z + b.d); if (hi - lo >= 1.1) return new THREE.Vector3(x, 0, (lo + hi) / 2); } if (Math.abs(a.z + a.d - b.z) < .01 || Math.abs(b.z + b.d - a.z) < .01) { const z = Math.abs(a.z + a.d - b.z) < .01 ? b.z : a.z, lo = Math.max(a.x, b.x), hi = Math.min(a.x + a.w, b.x + b.w); if (hi - lo >= 1.1) return new THREE.Vector3((lo + hi) / 2, 0, z); } return null; };
    const route = (from: Room, to: Room): THREE.Vector3[] | null => { if (from === to) return []; const prev = new Map<Room, Room>(); const q = [from]; const seen = new Set([from]); while (q.length) { const r = q.shift()!; if (r === to) break; for (const o of plan.rooms) if (!seen.has(o) && doorBetween(r, o)) { seen.add(o); prev.set(o, r); q.push(o); } } if (!seen.has(to)) return null; const chain: Room[] = [to]; while (chain[0] !== from) chain.unshift(prev.get(chain[0])!); const pts: THREE.Vector3[] = []; for (let i = 0; i < chain.length - 1; i++) { const d = doorBetween(chain[i], chain[i + 1])!; const inA = new THREE.Vector3(d.x, 0, d.z), c1 = roomCenter(chain[i]), c2 = roomCenter(chain[i + 1]); pts.push(new THREE.Vector3(d.x + (c1.x - d.x) * .15, 0, d.z + (c1.z - d.z) * .15), inA, new THREE.Vector3(d.x + (c2.x - d.x) * .15, 0, d.z + (c2.z - d.z) * .15)); } return pts; };
    S.goTo = (x: number, z: number) => { const ch = S.ch; if (!ch) return; const p = ch.g.position; const a = roomOf(plan, p.x, p.z) ?? plan.rooms[0], b = roomOf(plan, x, z); if (!b) return; const r = route(a, b); const end = new THREE.Vector3(x, 0, z); if (r === null) { p.set(x, 0, z); S.path = []; } else S.path = [...r, end]; };
    S.goRoom = (key: string) => { const rm = plan.rooms.find(r => r.key === key); if (!rm) return; const c = roomCenter(rm); S.goTo(c.x, c.z); };
    S.onMarker = (slot: string) => { setDeco(true); S.focusSlot = slot; };
  }, [plan]);

  // 가구 배치 (아이템 바뀔 때마다)
  useEffect(() => { const S = st.current; if (!S.furn) return; const { furn, markers } = S as { furn: THREE.Group; markers: THREE.Group }; const ver = (S.furnVer = (S.furnVer ?? 0) + 1);
    for (const g of [furn, markers]) { while (g.children.length) { const c = g.children.pop()!; if (!c.userData.kit) c.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); }); } }
    for (const sl of SLOTS) { const outside = sl.key === "car" && !plan.rooms.some(r => r.kind === "garage"); const rm = roomForSlot(plan, sl.key); if (!rm) continue; const [fx, fz] = SLOT_POS[sl.key] ?? [.5, .5]; const x = outside ? plan.W + 2.8 : rm.x + rm.w * fx, z = outside ? plan.D - 2.5 : rm.z + rm.d * fz; const t = items[sl.key] ?? 0; if (outside && !t) continue;
      if (t > 0) { const place = (f: THREE.Group) => { f.position.set(x, 0, z);
        if (sl.key === "car") { // 차고 크기에 맞춰 세로로 세우고, 큰 탈것(전용기·요트·우주선)은 줄여서 쏙
          if (!outside && rm.d > rm.w && !f.userData.kit) f.rotation.y = Math.PI / 2; const bb = new THREE.Box3().setFromObject(f), sz = new THREE.Vector3(); bb.getSize(sz); const along = f.rotation.y ? sz.z : sz.x, across = f.rotation.y ? sz.x : sz.z;
          const limL = outside ? 5 : Math.max(rm.w, rm.d) * .82, limW = outside ? 3 : Math.min(rm.w, rm.d) * .82, k = Math.min(1, limL / Math.max(along, .1), limW / Math.max(across, .1)); f.scale.setScalar(k); } if (sl.key === "sofa") f.rotation.y = Math.PI; if (sl.key === "art") f.position.z = rm.z + T + .02; f.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); furn.add(f); };
        if (hasKit(sl.key, t)) buildKit(sl.key, t).then(g => { if (S.furnVer !== ver) return; if (g) { g.userData.kit = true; place(g); } else place(buildFurniture(sl.key, t, rm.w, rm.d)); }); else place(buildFurniture(sl.key, t, rm.w, rm.d)); }
      else { const mk = new THREE.Group(); mk.userData.slot = sl.key; const ring = new THREE.Mesh(new THREE.TorusGeometry(.22, .03, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 })); ring.rotation.x = Math.PI / 2; const plus = new THREE.Mesh(new THREE.BoxGeometry(.2, .04, .04), new THREE.MeshBasicMaterial({ color: 0xffffff })); const plus2 = plus.clone(); plus2.rotation.y = Math.PI / 2; const hit = new THREE.Mesh(new THREE.SphereGeometry(.35, 8, 8), new THREE.MeshBasicMaterial({ visible: false })); mk.add(ring, plus, plus2, hit); mk.position.set(x, .5, z); markers.add(mk); } }
  }, [itemsKey, plan, home]); // eslint-disable-line

  const room = plan.rooms.find(r => r.key === here) ?? plan.rooms[0];
  const hasGarage = plan.rooms.some(r => r.kind === "garage"); const roomSlots = SLOTS.filter(sl => sl.key === "car" ? (hasGarage ? roomForSlot(plan, sl.key)?.key === room.key : room.kind === "living") : roomForSlot(plan, sl.key)?.key === room.key);
  const sc = 120 / Math.max(plan.W, plan.D);
  return <div className="h3">
    <div ref={box} className="h3-canvas" />
    <div className="h3-plan" aria-label="평면도">
      <div className="h3-plan-t">{HOMES[home].area} {HOMES[home].name}<small>{plan.label}</small></div>
      <svg width={plan.W * sc + 4} height={plan.D * sc + 4} viewBox={`-2 -2 ${plan.W * sc + 4} ${plan.D * sc + 4}`}>
        {plan.rooms.map(r => <g key={r.key} onClick={() => st.current.goRoom?.(r.key)} style={{ cursor: "pointer" }}>
          <rect x={r.x * sc} y={r.z * sc} width={r.w * sc} height={r.d * sc} fill={r.key === here ? "rgba(111,191,169,.55)" : "rgba(255,255,255,.12)"} stroke="#fff" strokeWidth="1.2" />
          <text x={(r.x + r.w / 2) * sc} y={(r.z + r.d / 2) * sc + 3} fontSize={Math.max(7, Math.min(10, r.w * sc / 5))} fill="#fff" textAnchor="middle" fontWeight="700">{r.name}</text></g>)}
        <circle cx={pos.x * sc} cy={pos.z * sc} r="3.5" fill="#F4D35E" stroke="#000" strokeWidth=".8" />
      </svg>
    </div>
    <div className="h3-here"><b>{room.name}</b><span>{roomSlots.filter(s => (items[s.key] ?? 0) > 0).length}/{roomSlots.length} 꾸밈</span></div>
    <button type="button" className="h3-deco-btn" onClick={() => setDeco(d => !d)}>{deco ? "닫기" : "🛋️ 이 방 꾸미기"}</button>
    {deco && <div className="h3-deco">
      <div className="h3-deco-t">{room.name} 꾸미기 <small>💰 {fmt(cash)}원</small></div>
      {roomSlots.length ? roomSlots.map(sl => { const t = items[sl.key] ?? 0, cur = t ? sl.tiers[t - 1] : null, nx = sl.tiers[t]; return <div key={sl.key} className={"h3-item" + (st.current.focusSlot === sl.key ? " focus" : "")}>
        <span className="h3-ico">{(nx ?? cur ?? sl.tiers[0]).icon}</span>
        <div><b>{sl.label}</b> <small>{t}/{sl.tiers.length}</small><div>{cur ? cur.name : "비어 있어요"}{nx ? ` → ${nx.name}` : " · 최고급 ✨"}</div></div>
        {nx && <button type="button" className={"btn" + (cash < nx.price ? " ghost" : "")} onClick={() => onBuy(sl.key)}>{t ? "업그레이드" : "들이기"}<br /><small>{fmt(nx.price)}</small></button>}
      </div>; }) : <div className="muted" style={{ fontSize: 12 }}>이 방엔 아직 둘 수 있는 게 없어요. 다른 방으로 가보세요.</div>}
    </div>}
    <div className="h3-zoom"><button type="button" onClick={() => { st.current.zoom = Math.max(.45, (st.current.zoom ?? 1) * .8); }} aria-label="가까이">＋</button><button type="button" onClick={() => { st.current.zoom = Math.min(1.8, (st.current.zoom ?? 1) * 1.25); }} aria-label="멀리">－</button></div>
    <div className="h3-hint">바닥 탭 = 걷기 · 좌우로 끌기 = 둘러보기 · 평면도 방 탭 = 그 방으로 · ⊕ = 꾸미기</div>
  </div>;
}
