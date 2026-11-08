"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { RestPerson, RestPos } from "@/lib/rest.actions";
import { restSay, restBurn, restDone } from "@/lib/rest.actions";
import { buildSauna, SAUNA_SEATS, SAUNA_BEDS, SAUNA_ROUTE, SAUNA_SPOTS, SAUNA_FIRE } from "./scenes3";
import { Ambience, unlockAudio } from "./ambience";
import { Fireworks, FW_TYPES } from "./fireworks";
import BurnPaper from "./BurnPaper";
import { buildZenHall, ZEN_SEATS } from "./scenes2";

/* ========================================================================
   🛋️ 당직실 3D — 병원 옥상 야경 / 병원 앞 포장마차
   - 로우폴리 three.js, 바닥 탭 → 이동, 앉기, 한마디 말풍선, 걱정 태우기, 불멍 모드
   - 위치·포즈는 RestRoom이 restBeat로 서버에 보내고, 다른 사람 위치는 people로 받아요
   ======================================================================== */
export type Scene = "roof" | "zen" | "sauna";
type Seat = { x: number; z: number; ry: number };
type Props = { extra?: React.ReactNode; full?: boolean; people: RestPerson[]; me: string; myDept: string; breathK: number; onMove: (p: RestPos) => void; onToast: (m: string) => void; onXp: (m: string) => void; onFirework?: (code: string) => void; actPulse: { k: number; a: string } | null };

const DCOL: Record<string, number> = { 간호사: 0xf48fb1, 간호조무사: 0xf8bbd0, 의사: 0x5fa8e8, 한의사: 0x8fbf9f, 방사선: 0x9f8be8, 물리치료: 0x4fb59a, 작업치료사: 0x6fcf97, 임상병리: 0x7ed69b, 응급구조: 0xf2a900, 원무: 0x3d5a80, 총괄: 0x2b3a67, 병원컨설팅: 0x5b7db1, 치과위생사: 0x7fd1e0, 치과기공사: 0x9bb0c9, 취준생: 0xc9a227, 대학생: 0xe0b84a, 타직장인: 0x8e95ae, 업체: 0x7a8aa0 };
const SEATS: Record<Scene, Seat[]> = {
  roof: [{ x: -3.2, z: 1.6, ry: Math.PI / 2 }, { x: -3.2, z: 0.4, ry: Math.PI / 2 }, { x: 3.2, z: 1.6, ry: -Math.PI / 2 }, { x: 3.2, z: 0.4, ry: -Math.PI / 2 }, { x: -1.2, z: 3.4, ry: Math.PI }, { x: 1.2, z: 3.4, ry: Math.PI }, { x: -5.5, z: -3, ry: 0.6 }, { x: 5.5, z: -3, ry: -0.6 }],
  zen: ZEN_SEATS,
  sauna: SAUNA_SEATS,
};
const BEDS: Partial<Record<Scene, Seat[]>> = { sauna: SAUNA_BEDS };
const FIRE: Record<Scene, THREE.Vector3> = { roof: new THREE.Vector3(0, 0, 0), zen: new THREE.Vector3(0, .8, -6.6), sauna: SAUNA_FIRE };

/* ---------- 텍스트 스프라이트 (이름표·말풍선) ---------- */
function textSprite(text: string, opt: { bg?: string; fg?: string; size?: number; pad?: number } = {}) {
  const c = document.createElement("canvas"), x = c.getContext("2d")!, fs = opt.size ?? 28, pad = opt.pad ?? 14;
  x.font = `700 ${fs}px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
  const w = Math.min(520, Math.ceil(x.measureText(text).width) + pad * 2), h = fs + pad * 1.4;
  c.width = w * 2; c.height = h * 2; x.scale(2, 2); x.font = `700 ${fs}px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
  x.fillStyle = opt.bg ?? "rgba(20,24,34,.78)"; x.beginPath(); if ((x as any).roundRect) (x as any).roundRect(0, 0, w, h, h / 2); else x.rect(0, 0, w, h); x.fill();
  x.fillStyle = opt.fg ?? "#fff"; x.textBaseline = "middle"; x.textAlign = "center"; x.fillText(text, w / 2, h / 2 + 1, w - pad);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); sp.scale.set(w / 110, h / 110, 1); sp.renderOrder = 10; return sp;
}

/* ---------- 아바타 ---------- */
type Avatar = { g: THREE.Group; body: THREE.Mesh; legs: THREE.Group; arms: THREE.Group; head: THREE.Group; name: THREE.Sprite; bubble: THREE.Sprite | null; bubbleText: string; tx: number; tz: number; pose: string; ry: number; walkT: number; v?: number; sk?: number; lk?: number; seed?: number; spd?: number; hold?: { m: THREE.Object3D; t: number; dur: number; kind: Food } };
function makeAvatar(nick: string, dept: string | null, me: boolean): Avatar {
  const g = new THREE.Group(); const col = DCOL[dept ?? ""] ?? 0x8e95ae;
  const mat = (c: number, r = .9) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
  const skin = mat(0xf6d2b8), hair = mat(0x3b2a24), cloth = mat(col), pants = mat(0x3a4159), shoe = mat(0x222831);
  const legs = new THREE.Group(); for (const sx of [-.11, .11]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .3, 4, 8), pants); l.position.set(sx, .32, 0); legs.add(l); const s = new THREE.Mesh(new THREE.BoxGeometry(.2, .1, .28), shoe); s.position.set(sx, .05, .04); legs.add(s); }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .42, 6, 12), cloth); body.position.y = .82;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.17, .035, 6, 16), mat(0xffffff)); collar.rotation.x = Math.PI / 2; collar.position.y = 1.1;
  const arms = new THREE.Group(); for (const sx of [-.33, .33]) { const a = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .34, 4, 8), cloth); a.position.set(sx, .82, 0); arms.add(a); const h = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 8), skin); h.position.set(sx, .58, 0); arms.add(h); }
  const head = new THREE.Group(); const hd = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 14), skin); head.add(hd);
  const hr = new THREE.Mesh(new THREE.SphereGeometry(.31, 16, 10, 0, Math.PI * 2, 0, Math.PI * .5), hair); hr.position.y = .04; head.add(hr);
  const eyeM = mat(0x2b2118, 1); for (const sx of [-.1, .1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 6), eyeM); e.position.set(sx, 0, .27); head.add(e); }
  const cheekM = new THREE.MeshStandardMaterial({ color: 0xf2a3a3, transparent: true, opacity: .6 }); for (const sx of [-.16, .16]) { const c = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 6), cheekM); c.position.set(sx, -.06, .24); head.add(c); }
  if (dept === "간호사" || dept === "간호조무사") { const cap = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .1, 12), mat(0xffffff)); cap.position.y = .22; head.add(cap); }
  if (dept === "의사" || dept === "한의사") { const st = new THREE.Mesh(new THREE.TorusGeometry(.2, .02, 6, 20, Math.PI), mat(0x444)); st.position.set(0, 1.0, .22); st.rotation.z = Math.PI; g.add(st); }
  head.position.y = 1.42; head.scale.setScalar(1.5); // 큰 머리 치비
  g.add(legs, body, collar, arms, head);
  const name = textSprite(me ? (nick === "나" ? "나" : "나 · " + nick) : nick, { bg: me ? "rgba(31,94,60,.9)" : "rgba(20,24,34,.72)", size: 26 }); name.position.y = 2.05; g.add(name);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.36, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28 })); sh.rotation.x = -Math.PI / 2; sh.position.y = .012; g.add(sh);
  g.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; } });
  g.rotation.order = "YXZ";
  return { g, body, legs, arms, head, name, bubble: null, bubbleText: "", tx: 0, tz: 0, pose: "stand", ry: 0, walkT: 0, v: 0, sk: 0, lk: 0, seed: Math.random() * 10 };
}
function setBubble(a: Avatar, text: string | null) {
  if (a.bubble) { a.g.remove(a.bubble); a.bubble.material.map?.dispose(); a.bubble.material.dispose(); a.bubble = null; }
  a.bubbleText = text ?? "";
  if (text) { const b = textSprite(text, { bg: "rgba(255,255,255,.95)", fg: "#1b1b1b", size: 24, pad: 16 }); b.position.y = 2.5; a.g.add(b); a.bubble = b; }
}

/* ---------- 공통 재료 ---------- */
const M = (c: number, r = .95, e?: number, ei = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, emissive: e ?? 0x000000, emissiveIntensity: ei });
function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; return b; }
function windowsTexture(cols: number, rows: number, lit = .55, warm = true) {
  const c = document.createElement("canvas"); c.width = cols * 8; c.height = rows * 8; const x = c.getContext("2d")!;
  x.fillStyle = "#0e1424"; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { if (Math.random() < lit) { x.fillStyle = Math.random() < .8 ? (warm ? "#ffe3a3" : "#cfe6ff") : "#9fd3f5"; x.globalAlpha = .55 + Math.random() * .45; x.fillRect(i * 8 + 2, j * 8 + 2, 4, 5); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
}
function stars(n: number) {
  const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * .45; p[i * 3] = Math.cos(th) * Math.cos(ph) * 120; p[i * 3 + 1] = Math.sin(ph) * 120 + 5; p[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * 120; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: .35, sizeAttenuation: true, transparent: true, opacity: .85 }));
}
function skyline(scene: THREE.Scene, radius: number, count: number) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * .1, r = radius + Math.random() * 25, w = 4 + Math.random() * 7, h = 8 + Math.random() * 30, d = 4 + Math.random() * 6;
    const tex = windowsTexture(Math.round(w * 1.5), Math.round(h * 1.5), .35 + Math.random() * .4, Math.random() < .7);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .9, roughness: 1 }));
    m.position.set(Math.cos(a) * r, h / 2 - 2, Math.sin(a) * r); m.lookAt(0, m.position.y, 0); scene.add(m);
    if (Math.random() < .25) { const l = new THREE.Mesh(new THREE.SphereGeometry(.25, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); l.position.set(m.position.x, h - 1.5, m.position.z); scene.add(l); }
  }
}
/* ---------- 불 (파티클) ---------- */
function makeFire(pos: THREE.Vector3, scale = 1) {
  const N = 70, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), life = new Float32Array(N);
  for (let i = 0; i < N; i++) life[i] = Math.random();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const tex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d")!; const gr = x.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, "rgba(255,230,160,1)"); gr.addColorStop(.35, "rgba(255,140,40,.9)"); gr.addColorStop(1, "rgba(255,60,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: tex, size: .55 * scale, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffb060 }));
  const light = new THREE.PointLight(0xff9a3c, 2.2 * scale, 14 * scale, 1.6); light.position.copy(pos).add(new THREE.Vector3(0, .8, 0)); light.castShadow = false;
  const update = (dt: number) => { for (let i = 0; i < N; i++) { life[i] += dt * (.9 + (i % 5) * .12); if (life[i] > 1) life[i] -= 1; const t = life[i], r = (1 - t) * .28 * scale, a = i * 2.4 + t * 3; p[i * 3] = pos.x + Math.cos(a) * r; p[i * 3 + 1] = pos.y + .15 + t * 1.5 * scale; p[i * 3 + 2] = pos.z + Math.sin(a) * r; } g.attributes.position.needsUpdate = true; light.intensity = (2 + Math.sin(performance.now() / 90) * .35 + Math.random() * .25) * scale; };
  return { pts, light, update };
}

/* ---------- 씬: 병원 옥상 ---------- */
function buildRoof(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x0a1022); scene.fog = new THREE.Fog(0x0a1022, 40, 140);
  scene.add(new THREE.HemisphereLight(0x5a6aa0, 0x2a2018, .9));
  const moon = new THREE.DirectionalLight(0x9fb4ff, .55); moon.position.set(-20, 30, -10); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -14; moon.shadow.camera.right = 14; moon.shadow.camera.top = 14; moon.shadow.camera.bottom = -14; scene.add(moon);
  const moonBall = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff3c4 })); moonBall.position.set(-45, 38, -60); scene.add(moonBall);
  scene.add(stars(500)); skyline(scene, 42, 46);
  // 바닥(우레탄 방수 옥상) + 패러핏
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), M(0x3f5a4e, 1)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.name = "ground"; scene.add(floor);
  const grid = new THREE.GridHelper(16, 16, 0x2f473c, 0x2f473c); (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = .35; grid.position.y = .01; scene.add(grid);
  const wallM = M(0x9aa1ad, 1); for (const [x, z, w, d] of [[0, -8, 16.4, .4], [0, 8, 16.4, .4], [-8, 0, .4, 16.4], [8, 0, .4, 16.4]] as number[][]) scene.add(box(w, 1.1, d, wallM, x, .55, z));
  const railM = M(0xd8dde6, .6); for (const [x, z, w, d] of [[0, -8, 16.4, .06], [0, 8, 16.4, .06], [-8, 0, .06, 16.4], [8, 0, .06, 16.4]] as number[][]) scene.add(box(w, .06, d, railM, x, 1.5, z));
  // 드럼통 불
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.5, .48, 1, 16), M(0x5a3b2a, .8)); drum.position.y = .5; drum.castShadow = true; scene.add(drum);
  for (let k = 0; k < 3; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .025, 6, 24), M(0x2b2b2b)); ring.rotation.x = Math.PI / 2; ring.position.y = .2 + k * .3; scene.add(ring); }
  const fire = makeFire(new THREE.Vector3(0, .85, 0), 1); scene.add(fire.pts, fire.light);
  // 벤치 2개 + 파라솔 테이블
  const bench = (x: number, z: number, ry: number) => { const g = new THREE.Group(); g.add(box(.5, .08, 1.9, M(0x8b5a2b), 0, .45, 0)); g.add(box(.08, .5, 1.9, M(0x8b5a2b), -.25, .75, 0)); for (const dz of [-.8, .8]) g.add(box(.5, .45, .08, M(0x3a3a3a), 0, .22, dz)); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); };
  bench(-3.6, 1, 0); bench(3.6, 1, Math.PI);
  const tbl = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .06, 16), M(0xffffff, .7)); tbl.position.set(0, .72, 3.4); scene.add(tbl); scene.add(box(.08, .72, .08, M(0x777), 0, .36, 3.4));
  // 자판기 · 물탱크 · 실외기 · 옥탑 출입구
  const vm = box(1, 1.9, .8, M(0xd9463c, .5), -6.5, .95, -6.6); scene.add(vm); const panel = box(.7, 1.1, .02, M(0x9fe7ff, .3, 0x9fe7ff, 1.2), -6.5, 1.2, -6.18); scene.add(panel);
  scene.add(box(.9, .08, .6, M(0x222), -6.5, 1.94, -6.6));
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 18), M(0xe8e3d6, .9)); tank.position.set(6.2, 1.6, -6.2); tank.castShadow = true; scene.add(tank); for (const [dx, dz] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) scene.add(box(.12, .8, .12, M(0x555), 6.2 + dx, .4, -6.2 + dz));
  for (let i = 0; i < 3; i++) { scene.add(box(.9, .8, .4, M(0xcfd4dc, .7), -2 + i * 1.2, .4, -7.4)); const fan = new THREE.Mesh(new THREE.CircleGeometry(.28, 12), M(0x4a4f57)); fan.position.set(-2 + i * 1.2, .45, -7.19); scene.add(fan); }
  const hut = box(2.6, 2.4, 2.2, M(0xb8bcc6, 1), 5.5, 1.2, 6.4); scene.add(hut); scene.add(box(.9, 1.8, .06, M(0x3b4a5a), 5.5, .9, 5.27)); const sign = textSprite("옥상", { bg: "rgba(60,70,90,.95)", size: 30 }); sign.position.set(5.5, 2.1, 5.2); sign.scale.multiplyScalar(.8); scene.add(sign);
  // 줄전구
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xffe08a }); for (let i = 0; i < 14; i++) { const t = i / 13, x = -7 + t * 14, y = 2.6 - Math.sin(t * Math.PI) * .5; const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 6), bulbM); b.position.set(x, y, -7.6); scene.add(b); const b2 = b.clone(); b2.position.set(x, y, 7.6); scene.add(b2); }
  const warm = new THREE.PointLight(0xffd79a, 1.2, 24); warm.position.set(0, 3, -7.4); scene.add(warm);
  // 화분·캔
  for (const [x, z] of [[-7, 6.8], [-6.2, 7], [7, -7]]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.22, .18, .3, 10), M(0xb86b3b)); pot.position.set(x, .15, z); scene.add(pot); const leaf = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 8), M(0x3f8a4a)); leaf.position.set(x, .5, z); scene.add(leaf); }
  // 🌙 저 멀리 롯데월드타워(555m) 실루엣: 위로 갈수록 좁아지는 곡선 몸체 + 첨탑 + 깜빡이는 항공장애등
  const lotte = new THREE.Group(); const TH = 26;
  const prof: THREE.Vector2[] = []; for (let k = 0; k <= 16; k++) { const y = k / 16 * TH; prof.push(new THREE.Vector2(1.35 * (1 - Math.pow(y / TH, 1.6) * .8), y)); }
  const towerTex = windowsTexture(6, 40, .35, true);
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 4), new THREE.MeshStandardMaterial({ color: 0x8a7650, map: towerTex, emissive: 0xc9a865, emissiveIntensity: .45, roughness: .35, metalness: .4 }));
  body.rotation.y = Math.PI / 4; lotte.add(body);
  const seam = new THREE.Mesh(new THREE.CylinderGeometry(.04, .3, TH * .98, 4, 1, true), new THREE.MeshBasicMaterial({ color: 0xf3dca0, transparent: true, opacity: .35 })); seam.position.y = TH * .49; lotte.add(seam);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.18, .3, 1.8, 4, 1, true), new THREE.MeshBasicMaterial({ color: 0xf6e2ae, transparent: true, opacity: .55, side: THREE.DoubleSide })); crown.position.y = TH + .9; crown.rotation.y = Math.PI / 4; lotte.add(crown);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(.08, 2.6, 6), new THREE.MeshBasicMaterial({ color: 0xe9d6a6 })); spire.position.y = TH + 3.1; lotte.add(spire);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2a2a })); beacon.position.y = TH + 4.5; lotte.add(beacon);
  lotte.position.set(-7, -13, -38); scene.add(lotte);
  { const fu = fire.update; let bt = 0; fire.update = (dt: number) => { fu(dt); bt += dt; beacon.visible = bt % 1 < .5; }; } // 1초마다 깜빡
  return { fire, camBase: new THREE.Vector3(0, 0, 0) };
}

/* ---------- 씬: 명상·요가실 (따뜻한 나무 바닥 · 창호지 창 · 싱잉볼 · 촛불 · 식물) ---------- */
function buildZen(scene: THREE.Scene) {
  scene.background = new THREE.Color(0xf3e9dc); scene.fog = new THREE.Fog(0xf3e9dc, 18, 40);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0xcdb79a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff0d2, .9); sun.position.set(-6, 9, 4); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -10; sun.shadow.camera.right = 10; sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10; scene.add(sun);
  // 바닥(원목) + 널빤지 선
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M(0xc9a37a, .9)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.name = "ground"; scene.add(floor);
  for (let i = -6; i <= 6; i++) scene.add(box(.02, .005, 14, M(0xb08a62), i * 1.1, .003, 0));
  // 벽 + 창호지 창 (은은한 빛)
  const wallM = M(0xf6efe4, 1); for (const [x, z, w, d] of [[0, -7, 14.4, .3], [-7, 0, .3, 14.4], [7, 0, .3, 14.4]] as number[][]) scene.add(box(w, 3.2, d, wallM, x, 1.6, z));
  const paperM = new THREE.MeshStandardMaterial({ color: 0xfff8ea, emissive: 0xffe9c4, emissiveIntensity: .55, roughness: 1 });
  for (const x of [-4.2, -1.4, 1.4, 4.2]) { scene.add(box(2.2, 1.9, .06, paperM, x, 1.6, -6.82)); for (const dx of [-.55, 0, .55]) scene.add(box(.04, 1.9, .08, M(0x6b4a2e), x + dx, 1.6, -6.8)); for (const dy of [-.5, 0, .5]) scene.add(box(2.2, .04, .08, M(0x6b4a2e), x, 1.6 + dy, -6.8)); }
  for (const z of [-3, 1]) { scene.add(box(.06, 1.9, 2.2, paperM, -6.82, 1.6, z)); scene.add(box(.06, 1.9, 2.2, paperM, 6.82, 1.6, z)); }
  const glow = new THREE.PointLight(0xffe2b0, 1.1, 16); glow.position.set(0, 2.6, -5.5); scene.add(glow);
  // 요가 매트(좌석)
  const matCols = [0x9fd3c7, 0xf2b8c6, 0xc9b8f0, 0xf7d59c, 0xa8d8a0, 0xf2a7a0, 0xbfd8f2, 0xe8d3a2];
  SEATS.zen.forEach((st, i) => { const mt = box(.9, .03, 1.9, M(matCols[i % matCols.length], .95), st.x, .015, st.z); mt.rotation.y = st.ry; mt.receiveShadow = true; scene.add(mt); });
  // 싱잉볼 (중앙 방석 위)
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(.75, .8, .18, 24), M(0x8b3a3a, .95)); cushion.position.y = .09; cushion.castShadow = true; scene.add(cushion);
  const bowlM = new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: .35, metalness: .75, emissive: 0x5a3a00, emissiveIntensity: .15 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.5, .32, .4, 28, 1, true), bowlM); bowl.position.y = .38; bowl.castShadow = true; bowl.name = "bowl"; scene.add(bowl);
  const bowlIn = new THREE.Mesh(new THREE.CylinderGeometry(.48, .3, .38, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xe0b464, roughness: .3, metalness: .6, side: THREE.BackSide })); bowlIn.position.y = .39; scene.add(bowlIn);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(.32, 24), bowlM); bottom.rotation.x = -Math.PI / 2; bottom.position.y = .19; scene.add(bottom);
  const mallet = box(.06, .06, .7, M(0x6b4a2e), .7, .22, .3); mallet.rotation.y = .5; scene.add(mallet); const mhead = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 10), M(0xd9c7a8)); mhead.position.set(.98, .22, .45); scene.add(mhead);
  // 울림 링 (싱잉볼 칠 때 퍼짐)
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, side: THREE.DoubleSide }); const ring = new THREE.Mesh(new THREE.RingGeometry(.5, .56, 48), ringM); ring.rotation.x = -Math.PI / 2; ring.position.y = .25; ring.name = "bowlring"; scene.add(ring);
  // 촛불(3개) + 향 연기 + 식물 + 족자
  const flames: ReturnType<typeof makeFire>[] = [];
  for (const [x, z] of [[-5.6, -5.6], [5.6, -5.6], [0, -6.1]]) { scene.add(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .35, 10), M(0xfff1d6, .9)).translateX(x).translateY(.18).translateZ(z)); const f = makeFire(new THREE.Vector3(x, .3, z), .22); (f.pts.material as THREE.PointsMaterial).size = .18; f.light.intensity = .9; f.light.distance = 6; scene.add(f.pts, f.light); flames.push(f); }
  const incense = makeFire(new THREE.Vector3(2.6, .6, -5.4), .5); (incense.pts.material as THREE.PointsMaterial).color.set(0xffffff); (incense.pts.material as THREE.PointsMaterial).opacity = .22; (incense.pts.material as THREE.PointsMaterial).size = .25; incense.light.intensity = 0; scene.add(incense.pts); flames.push(incense);
  scene.add(box(.5, .5, .5, M(0x6b4a2e), 2.6, .25, -5.4));
  const plant = (x: number, z: number, h: number) => { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.3, .24, .4, 12), M(0xd9cbb4)); pot.position.set(x, .2, z); pot.castShadow = true; scene.add(pot); for (let k = 0; k < 7; k++) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 8), M(0x5f9e6e, 1)); leaf.scale.set(1, 1.6, .5); leaf.position.set(x + Math.cos(k * .9) * .25, .5 + h * (.3 + (k % 3) * .25), z + Math.sin(k * .9) * .25); leaf.rotation.set(Math.cos(k) * .5, k, Math.sin(k) * .4); leaf.castShadow = true; scene.add(leaf); } };
  plant(-6, 5.5, 1.4); plant(6, 5.5, 1.2); plant(-6, -5.8, 1); 
  const scroll = textSprite("숨 · 쉼", { bg: "rgba(255,250,240,.98)", fg: "#4a3b2a", size: 40 }); scroll.position.set(0, 2.3, -6.7); scroll.scale.multiplyScalar(1.2); scene.add(scroll);
  const combined = { pts: flames[0].pts, light: flames[0].light, update: (dt: number) => { for (const f of flames) f.update(dt); const r = scene.getObjectByName("bowlring") as THREE.Mesh | undefined; if (r) { const t = (r.userData.t ?? 0) as number; if (t > 0) { const k = 1 - t; r.scale.setScalar(1 + k * 9); (r.material as THREE.MeshBasicMaterial).opacity = t * .6; r.userData.t = Math.max(0, t - dt / 5); } } } };
  return { fire: combined, camBase: new THREE.Vector3(0, 0, 0) };
}
/* ---------- 씬: 병원 앞 포장마차 ---------- */
const boxMesh = box;
/* ---------- 함께 있는 동료들 (분위기용 · 이름표 없음 · 인원수에는 안 들어가요) ---------- */
const NPC_DEPTS = ["간호사", "의사", "방사선", "물리치료", "임상병리", "응급구조", "원무", "간호조무사"];
/** 🍠🥚🥤 손에 드는 음식: 나·동료·다른 접속자 공용 */
type Food = "potato" | "egg" | "cup";
function makeFood(kind: Food) {
  const m = kind === "potato" ? (() => { const g = new THREE.Group(); const skin = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .22, 4, 10), M(0x7a3352, .8)); const in_ = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), M(0xf2b23a, .6, 0xf2a020, .25)); in_.position.y = .16; skin.add(in_); g.add(skin); return g; })()
      : kind === "egg" ? (() => { const e = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), M(0xfaf6ee, .5)); e.scale.set(1, 1.25, 1); const y = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), M(0xf2b23a, .6)); y.position.z = .07; e.add(y); return e; })()
      : (() => { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(.1, .08, .2, 12), M(0xf5e6c8, .4)); const d = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .02, 12), M(0xe8cf98, .6)); d.position.y = .08; g.add(c, d); return g; })();
  return m;
}
function startHold(a: Avatar, kind: Food, dur: number) { if (a.hold) a.g.remove(a.hold.m); const m = makeFood(kind); a.g.add(m); a.hold = { m, t: 0, dur, kind }; }
/** 음식이 무릎에서 입으로 올라가 오물오물 → 점점 작아짐 */
function holdTick(a: Avatar, dt: number) { const H = a.hold; if (!H) return; H.t += dt; const sit = a.pose === "sit"; const hy = (sit ? 1.22 : 1.42) - .28; const k = Math.min(1, H.t / .35); const bob = H.kind === "cup" ? 0 : Math.max(0, Math.sin(H.t * 7)) * .08;
  H.m.position.set(.28 * (1 - k) + .02, (sit ? .7 : .9) * (1 - k) + (hy + bob) * k, .3 + k * .2 - bob); H.m.rotation.x = H.kind === "cup" ? -k * .9 : 0; H.m.rotation.z = H.kind === "potato" ? .3 : 0;
  if (H.kind !== "cup") H.m.scale.setScalar(1 - Math.min(.7, H.t / H.dur * .7));
  if (H.t > H.dur) { a.g.remove(H.m); a.hold = undefined; } }
const FOOD_SAY: Record<Food, string[]> = { cup: ["🥤 후루룩~", "🥤 캬~ 시원해"], egg: ["🥚 톡! 냠냠", "🥚 이마로 톡!"], potato: ["🍠 호호~ 꿀맛", "🍠 냠냠 달다"] };
const foodOf = (t: string): Food | null => t.includes("🍠") ? "potato" : t.includes("🥚") ? "egg" : t.includes("🥤") ? "cup" : null;
/** 찜질방 옷 + 🐑 양머리 수건 */
function jjim(a: Avatar) {
  (a.body.material as THREE.MeshStandardMaterial).color.set(0xe8925a); const leg = a.legs.children[0] as THREE.Mesh; (leg.material as THREE.MeshStandardMaterial).color.set(0xd47640);
  const tw = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xfff4e6, emissiveIntensity: .35 }); const cap = new THREE.Mesh(new THREE.SphereGeometry(.335, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), tw); cap.position.y = .03; a.head.add(cap);
  for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.TorusGeometry(.12, .075, 8, 14), tw); ear.position.set(sx * .3, .16, 0); ear.rotation.y = Math.PI / 2; a.head.add(ear); }
  const band = new THREE.Mesh(new THREE.TorusGeometry(.31, .045, 8, 24), tw); band.rotation.x = Math.PI / 2; band.position.y = .07; a.head.add(band);
}
function spawnNPCs(scene: Scene, sc: THREE.Scene) {
  const seats = SEATS[scene], rate = scene === "zen" ? .72 : scene === "sauna" ? .6 : .55, out: { a: Avatar; seat: number; stand?: boolean; walk?: { wait: number } }[] = [];
  const rnd = (i: number) => { const v = Math.sin(i * 12.9898 + seats.length * 78.233) * 43758.5453; return v - Math.floor(v); };
  seats.forEach((st, i) => { if (rnd(i) > rate || (scene === "zen" && (i === 20 || i === 21))) return; const a = makeAvatar("", NPC_DEPTS[i % NPC_DEPTS.length], false); a.g.remove(a.name); if (scene === "sauna") jjim(a); a.g.position.set(st.x, 0, st.z); a.tx = st.x; a.tz = st.z; a.pose = "sit"; a.g.rotation.y = st.ry; sc.add(a.g); out.push({ a, seat: i }); });
  const extra: [number, number, number][] = scene === "roof" ? [[-6.5, -6, .4], [6.6, 5.8, -2.4], [4.8, -6.4, 0]] : scene === "sauna" ? [[-6.6, .4, -1.5]] : [];
  extra.forEach(([x, z, ry], i) => { const a = makeAvatar("", NPC_DEPTS[(i + 3) % NPC_DEPTS.length], false); a.g.remove(a.name); if (scene === "sauna") jjim(a); a.g.position.set(x, 0, z); a.tx = x; a.tz = z; a.pose = "stand"; a.g.rotation.y = ry; sc.add(a.g); out.push({ a, seat: -1, stand: true }); });
  if (scene === "sauna") {
    (BEDS.sauna ?? []).forEach((st, i) => { if (rnd(i + 40) > .72) return; const a = makeAvatar("", NPC_DEPTS[(i + 5) % NPC_DEPTS.length], false); a.g.remove(a.name); jjim(a); a.g.position.set(st.x, .38, st.z); a.tx = st.x; a.tz = st.z; a.pose = "lie"; a.lk = 1; a.g.rotation.y = st.ry; a.g.rotation.x = -Math.PI / 2; sc.add(a.g); out.push({ a, seat: -10 - i }); });
    for (let i = 0; i < 3; i++) { const p = SAUNA_ROUTE[i * 2]; const a = makeAvatar("", NPC_DEPTS[(i + 7) % NPC_DEPTS.length], false); a.g.remove(a.name); jjim(a); a.spd = 1.05 + i * .12; a.g.position.set(p.x, 0, p.z); a.tx = p.x; a.tz = p.z; sc.add(a.g); out.push({ a, seat: -1, stand: true, walk: { wait: 1 + i * 2 } }); }
  }
  return out;
}
export default function Rest3D({ people, me, myDept, breathK, onMove, onToast, onXp, actPulse, extra, full, onFirework }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<Scene>(() => { try { const q = new URLSearchParams(location.search).get("s"); if (q && q in SEATS) return q as Scene; } catch {} return "sauna"; }); // 기본은 찜질방
  const [snd, setSnd] = useState<"off" | "on" | "wait">("wait"), [vol, setVol] = useState(() => { try { return Number(localStorage.getItem("mw-rest-vol") ?? .7); } catch { return .7; } });
  const amb = useRef<Ambience | null>(null); const sndRef = useRef(snd); sndRef.current = snd;
  const [fwOpen, setFwOpen] = useState(false); const [burning, setBurning] = useState<string | null>(null); const fwCd = useRef(0);
  const [mode, setMode] = useState<"normal" | "zen">("normal"), [say, setSay] = useState(""), [burn, setBurn] = useState<string | null>(null), [busy, setBusy] = useState(false), [sitting, setSitting] = useState(false);
  const st = useRef<{ flare?: number; fw?: Fireworks; fwSeen?: Record<string, number>; lookCur?: THREE.Vector3; fwAt?: number; npcs?: { a: Avatar; seat: number; stand?: boolean; walk?: { wait: number }; eatT?: number }[]; renderer?: THREE.WebGLRenderer; cam?: THREE.PerspectiveCamera; sc?: THREE.Scene; ground?: THREE.Object3D; me?: Avatar; others: Map<string, Avatar>; fire?: ReturnType<typeof makeFire>; raf: number; yaw: number; last: number; emo: { sp: THREE.Sprite; t: number }[]; paper?: { sp: THREE.Sprite; t: number; from: THREE.Vector3 }; camBase: THREE.Vector3; seat: number; bump?: number; foodSeen?: Record<string, number> }>({ others: new Map(), raf: 0, yaw: 0, last: 0, emo: [], camBase: new THREE.Vector3(), seat: -1 });
  const peopleRef = useRef(people), breathRef = useRef(breathK), sceneRef = useRef(scene), modeRef = useRef(mode);
  peopleRef.current = people; breathRef.current = breathK; sceneRef.current = scene; modeRef.current = mode;
  const moveTimer = useRef<any>(null);
  const emitMove = (pose: string) => { const a = st.current.me; if (!a) return; clearTimeout(moveTimer.current); moveTimer.current = setTimeout(() => onMove({ scene: sceneRef.current, x: a.tx, z: a.tz, pose }), 350); };

  /** 불꽃 발사 (mine=true면 서버로 알려 다른 사람도 보게) */
  const launchFw = (type: number, ox: number, mine: boolean, at?: { x: number; z: number }) => { const S = st.current; if (!S.fw) return; const o = at ?? { x: 3.2, z: -5.8 }; const from = new THREE.Vector3(o.x + ox * .3, .5, o.z - .6), to = new THREE.Vector3(ox * 2.2, 11 + Math.random() * 2.5, -16 - Math.random() * 3); // 카메라 정면 밤하늘 한가운데 // 내가 서 있는 자리에서 쏘아 올림 S.fw.launch(type, from, to, 1.1);
    if (amb.current && sndRef.current === "on") amb.current.firework(1.1, mine ? 1 : .7); if (mine) { try { navigator.vibrate?.([10, 1050, 40]); } catch {} onFirework?.(`fw:${type}:${ox.toFixed(1)}:0`); } };
  /* ---- 초기화 / 씬 전환 ---- */
  useEffect(() => {
    const el = box.current; if (!el) return;
    const S = st.current;
    if (!S.renderer) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" }); r.setPixelRatio(Math.min(innerWidth < 720 ? 1.5 : 2, devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.35;
      el.appendChild(r.domElement); S.renderer = r;
      S.cam = new THREE.PerspectiveCamera(50, 1, .1, 300);
    }
    // 씬 구성
    const sc = new THREE.Scene(); S.sc = sc; S.others.forEach(a => setBubble(a, null)); S.others.clear(); S.emo = []; S.paper = undefined; S.seat = -1; setSitting(false);
    const H = { M, box: boxMesh, makeFire, textSprite }; const built = scene === "roof" ? buildRoof(sc) : scene === "zen" ? buildZenHall(sc, H) : buildSauna(sc, H); S.npcs = spawnNPCs(scene, sc); S.fw?.dispose(); S.fw = undefined; S.fwSeen = S.fwSeen ?? {};
    if (scene === "roof") { S.fw = new Fireworks(sc); const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .08, 24), M(0x2a2f3a, .7)); pad.position.set(3.2, .04, -5.8); pad.receiveShadow = true; sc.add(pad); const stripe = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.28, 32), new THREE.MeshBasicMaterial({ color: 0xffd36e, side: THREE.DoubleSide })); stripe.rotation.x = -Math.PI / 2; stripe.position.set(3.2, .09, -5.8); sc.add(stripe); for (let i = 0; i < 5; i++) { const tube = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .5, 10), M([0xe2574c, 0xf2a900, 0x5fa8e8, 0x7ed69b, 0xf48fb1][i], .5)); tube.position.set(2.6 + i * .3, .3, -5.8 + (i % 2) * .3); tube.rotation.x = -.2; tube.castShadow = true; sc.add(tube); } const fsign = textSprite("🎆 불꽃놀이 존", { bg: "rgba(242,169,0,.95)", fg: "#2b1a08", size: 28 }); fsign.position.set(3.2, 2.2, -5.8); sc.add(fsign); } S.fire = built.fire; S.camBase = built.camBase; S.ground = sc.getObjectByName("ground")!;
    const meAv = makeAvatar(me, myDept, true); if (scene === "sauna") { jjim(meAv); meAv.name.scale.multiplyScalar(.6); } const spawn = scene === "roof" ? { x: 0, z: 5.5 } : scene === "zen" ? { x: 0, z: 7 } : { x: 0, z: 5.6 }; meAv.g.position.set(spawn.x, 0, spawn.z); meAv.tx = spawn.x; meAv.tz = spawn.z; meAv.ry = Math.PI; meAv.g.rotation.y = Math.PI; sc.add(meAv.g); S.me = meAv;
    try { localStorage.setItem("mw-rest-scene", scene); } catch {}
    onMove({ scene, x: spawn.x, z: spawn.z, pose: "stand" });

    const resize = () => { const w = el.clientWidth, h = el.clientHeight > 200 ? el.clientHeight : Math.round(Math.min(560, Math.max(380, w * 1.15))); S.renderer!.setSize(w, h, false); S.renderer!.domElement.style.width = "100%"; S.renderer!.domElement.style.height = h + "px"; S.cam!.aspect = w / h; S.cam!.updateProjectionMatrix(); };
    resize(); addEventListener("resize", resize); const ro = new ResizeObserver(resize); ro.observe(el);

    // 입력: 탭 → 이동, 드래그 → 카메라 회전
    let down: { x: number; y: number; t: number; yaw: number } | null = null;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY, t: e.timeStamp, yaw: S.yaw }; };
    const onMoveP = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 6) S.yaw = down.yaw - dx * .006; };
    const onUp = (e: PointerEvent) => {
      if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y, dt = e.timeStamp - down.t; down = null;
      if (Math.hypot(dx, dy) > 12 || dt > 650 || modeRef.current === "zen") return;
      const rc = S.renderer!.domElement.getBoundingClientRect(); ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
      ray.setFromCamera(ndc, S.cam!); // 바닥 메시 대신 무한 바닥면과 교차: 멀리(벽 너머)를 눌러도 그쪽 끝까지 걸어가요
      const pt = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3()); if (!pt) return; const hit = { point: pt };
      const a = S.me!; const sN = sceneRef.current; const inIce = sN === "sauna" && hit.point.x > 8.4 && hit.point.z > -1.2 && hit.point.z < 3.2; // 얼음방 문 안쪽
      a.tx = Math.max(sN === "sauna" ? -7 : -7.4, Math.min(inIce ? 12.5 : 7.4, hit.point.x)); a.tz = Math.max(sN === "zen" ? -5.4 : sN === "sauna" ? -3.2 : -7.4, Math.min(sN === "roof" ? 7.4 : 9, hit.point.z)); if (inIce) a.tz = Math.max(-.8, Math.min(2.8, hit.point.z)); a.pose = "stand"; S.seat = -1; setSitting(false); setLying(false); emitMove("stand");
    };
    const dom = S.renderer!.domElement; dom.addEventListener("pointerdown", onDown); addEventListener("pointermove", onMoveP); addEventListener("pointerup", onUp);

    // 루프
    const camPos = new THREE.Vector3(), look = new THREE.Vector3(); S.last = performance.now();
    const tick = () => {
      S.raf = requestAnimationFrame(tick); const now = performance.now(), dt = Math.min(.05, (now - S.last) / 1000); S.last = now; const t = now / 1000;
      S.fire?.update(dt); S.fw?.update(dt); if (S.flare && S.flare > 0 && S.fire) { S.flare -= dt; const k = Math.sin(Math.min(1, S.flare / 6) * Math.PI); S.fire.light.intensity += k * 4; S.fire.pts.scale.setScalar(1 + k * .9); } else if (S.fire) S.fire.pts.scale.setScalar(1);
      if (S.fw) for (const p of peopleRef.current) { if (p.me || p.scene !== "roof" || !p.act?.startsWith("fw:") || p.actAge > 6) continue; const key = p.nick + p.act; if (S.fwSeen![key]) continue; S.fwSeen![key] = Date.now(); const [, ty, ox] = p.act.split(":"); launchFw(+ty || 0, +ox || 0, false, { x: p.x ?? 3.2, z: p.z ?? -5.8 }); }
      // 다른 사람 동기화
      const ps = peopleRef.current.filter(p => !p.me && p.scene === sceneRef.current); const alive = new Set<string>();
      for (const p of ps) { alive.add(p.nick); let a = S.others.get(p.nick); if (!a) { a = makeAvatar(p.nick, p.dept, false); if (sceneRef.current === "sauna") jjim(a); a.g.position.set(p.x, 0, p.z); a.tx = p.x; a.tz = p.z; sc.add(a.g); S.others.set(p.nick, a); } a.tx = p.x; a.tz = p.z; a.pose = p.pose; const txt = p.say && p.sayAge < 12 ? p.say : null; if ((txt ?? "") !== a.bubbleText) setBubble(a, txt);
        if (p.say && p.sayAge < 4) { const fk = foodOf(p.say), seen = (S.foodSeen ??= {}), key = p.nick + p.say; if (fk && Date.now() - (seen[key] ?? 0) > 6000) { seen[key] = Date.now(); startHold(a, fk, 2.5); } } }
      for (const [k, a] of S.others) if (!alive.has(k)) { sc.remove(a.g); S.others.delete(k); }
      // 아바타 이동/애니메이션
      const anim = (a: Avatar, isMe: boolean) => {
        const dx = a.tx - a.g.position.x, dz = a.tz - a.g.position.z, d = Math.hypot(dx, dz);
        // 부드럽게 출발·감속: 목표 속도로 천천히 붙고, 도착 직전엔 느려져요
        const want = d > .03 ? Math.min(a.spd ?? 2.1, .5 + d * 1.8) : 0; a.v = (a.v ?? 0) + (want - (a.v ?? 0)) * Math.min(1, dt * 4);
        if (d > .02 && a.v > .02) { const sp = Math.min(d, a.v * dt); a.g.position.x += dx / d * sp; a.g.position.z += dz / d * sp; if (d > .15) { const ty = Math.atan2(dx, dz); let dr = ty - a.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); a.g.rotation.y += dr * Math.min(1, dt * 6); } a.walkT += dt * (3 + a.v * 3.2); }
        else { a.v = 0; a.walkT += (0 - (a.walkT % (Math.PI * 2))) * .15; if (a.pose === "sit" || a.pose === "lie") { const list = a.pose === "lie" ? BEDS[sceneRef.current] ?? [] : SEATS[sceneRef.current]; const seat = list.find(s => Math.hypot(s.x - a.tx, s.z - a.tz) < .3); if (seat) { let dr = seat.ry - a.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); a.g.rotation.y += dr * Math.min(1, dt * 5); } } }
        const walking = (a.v ?? 0) > .12, amp = Math.min(1, (a.v ?? 0) / 1.6), swing = Math.sin(a.walkT) * .5 * amp;
        a.legs.children[0].rotation.x = swing; a.legs.children[1].rotation.x = swing; a.legs.children[2].rotation.x = -swing; a.legs.children[3].rotation.x = -swing;
        a.arms.children[0].rotation.x = -swing * .7; a.arms.children[1].rotation.x = -swing * .7; a.arms.children[2].rotation.x = swing * .7; a.arms.children[3].rotation.x = swing * .7;
        a.sk = (a.sk ?? 0) + ((a.pose === "sit" && !walking ? 1 : 0) - (a.sk ?? 0)) * Math.min(1, dt * 5); a.lk = (a.lk ?? 0) + ((a.pose === "lie" && !walking ? 1 : 0) - (a.lk ?? 0)) * Math.min(1, dt * 3);
        const sk = a.sk, lk = a.lk, k = isMe ? breathRef.current : 0, sd = a.seed ?? 0;
        const bob = walking ? Math.abs(Math.sin(a.walkT)) * .05 * amp : Math.sin(t * (lk > .5 ? 1.2 : 2) + sd) * (lk > .5 ? .02 : .012);
        a.body.position.y = .82 - .2 * sk + bob + k * .03; a.head.position.y = 1.42 - .2 * sk + bob * .8 + k * .04; a.arms.position.y = -.2 * sk; a.body.rotation.x = .1 * amp;
        a.legs.rotation.x = -Math.PI / 2 * sk; a.legs.position.y = .4 * sk; a.legs.position.z = .2 * sk;
        a.g.rotation.x = -Math.PI / 2 * lk; a.g.position.y = .38 * lk;
        a.name.position.set(0, (2.05 - .2 * sk) * (1 - lk) + 1.45 * lk, 1.15 * lk); if (a.bubble) a.bubble.position.set(0, (2.5 - .2 * sk) * (1 - lk) + 1.45 * lk, 1.7 * lk);
        a.body.scale.setScalar(1 + k * .05);
        a.head.rotation.y = !isMe && !walking && lk < .5 ? Math.sin(t * .23 + sd) * .35 * Math.max(0, Math.sin(t * .11 + sd * 2)) : a.head.rotation.y * .9;
        if (isMe) a.head.rotation.x = S.bump && now - S.bump < 500 ? Math.sin((now - S.bump) / 500 * Math.PI) * .7 : 0;
      };
      S.npcs?.forEach(n => { if (!n.walk) return; const a = n.a; if (Math.hypot(a.tx - a.g.position.x, a.tz - a.g.position.z) < .1) { n.walk.wait -= dt; if (n.walk.wait <= 0) { const p = SAUNA_ROUTE[Math.floor(Math.random() * SAUNA_ROUTE.length)]; a.tx = p.x + (Math.random() - .5) * 1.2; a.tz = p.z + (Math.random() - .5) * 1.2; n.walk.wait = 2 + Math.random() * 6; } } });
      if (S.me) anim(S.me, true); S.others.forEach(a => anim(a, false)); S.npcs?.forEach(n => anim(n.a, false));
      // 이모지·종이
      if (S.me) holdTick(S.me, dt); for (const a of S.others.values()) holdTick(a, dt);
      // 🧖 가까이 가면 앉아 있는 동료들이 가끔 먹어요
      if (sceneRef.current === "sauna" && S.me) for (const n of S.npcs ?? []) { holdTick(n.a, dt); if (n.seat < 0 || n.a.pose !== "sit") continue; const d = Math.hypot(n.a.g.position.x - S.me.g.position.x, n.a.g.position.z - S.me.g.position.z); if (d > 2.8) continue;
        n.eatT = (n.eatT ?? 1 + Math.random() * 3) - dt; if (n.eatT > 0 || n.a.hold) continue; n.eatT = 5 + Math.random() * 3; const kinds: Food[] = ["cup", "egg", "potato"]; const kind = kinds[Math.floor(Math.random() * 3)]; startHold(n.a, kind, 2.2);
        const say = FOOD_SAY[kind][Math.floor(Math.random() * 2)]; const sp = textSprite(say, { bg: "rgba(160,72,28,.85)", size: 22 }); sp.scale.multiplyScalar(.55); sp.position.set(n.a.g.position.x, 2.3, n.a.g.position.z); sc.add(sp); S.emo.push({ sp, t: 0 }); }
      for (const e of S.emo) { e.t += dt; e.sp.position.y += dt * .9; (e.sp.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - e.t / 1.8); } S.emo = S.emo.filter(e => { if (e.t > 1.8) { sc.remove(e.sp); return false; } return true; });
      if (S.paper) { const p = S.paper; p.t += dt; const fp = FIRE[sceneRef.current].clone().add(new THREE.Vector3(0, .9, 0)); p.sp.position.lerpVectors(p.from, fp, Math.min(1, p.t / 1.4)); p.sp.position.y += Math.sin(Math.min(1, p.t / 1.4) * Math.PI) * 1.2; p.sp.material.rotation += dt * 4; if (p.t > 1.4) { p.sp.material.opacity -= dt * 2.5; if (p.sp.material.opacity <= 0) { sc.remove(p.sp); S.paper = undefined; } } }
      // 카메라
      const meP = S.me ? S.me.g.position : S.camBase;
      if (modeRef.current === "zen") { const f = FIRE[sceneRef.current]; const ang = t * .12; camPos.set(f.x + Math.cos(ang) * 4.2, f.y + 1.6 + Math.sin(t * .3) * .1, f.z + Math.sin(ang) * 4.2); look.set(f.x, f.y + .9, f.z); }
      else if (sceneRef.current === "sauna") { const far = 8.5; camPos.set(meP.x + Math.sin(S.yaw) * far, meP.y + 5, meP.z + Math.cos(S.yaw) * far); look.set(meP.x, meP.y + 1.1, meP.z); } // 찜질방: 늘 내 캐릭터 중심을 정면으로
      else { const far = S.cam!.aspect < .8 ? 9.6 : 6.4, rf = sceneRef.current === "roof"; camPos.set(meP.x + Math.sin(S.yaw) * far, far * (rf ? .5 : .66), meP.z + Math.cos(S.yaw) * far); look.set(meP.x, rf ? 2.8 : 1, meP.z - (sceneRef.current === "zen" ? 3 : 1.2)); } // 옥상은 하늘(야경)이 더 보이게
      if (S.fw && S.fw.active > 0 && modeRef.current !== "zen") { const k = Math.min(1, S.fw.active / 1.2); const sky = new THREE.Vector3(S.fw.lastBurst.x * .4, 10.5, -14); look.lerp(sky, k * .8); }
      S.cam!.position.lerp(camPos, Math.min(1, dt * 4)); if (!S.lookCur) S.lookCur = look.clone(); S.lookCur.lerp(look, Math.min(1, dt * 3)); S.cam!.lookAt(S.lookCur);
      S.renderer!.render(sc, S.cam!);
    };
    cancelAnimationFrame(S.raf); tick();
    return () => { cancelAnimationFrame(S.raf); ro.disconnect(); removeEventListener("resize", resize); dom.removeEventListener("pointerdown", onDown); removeEventListener("pointermove", onMoveP); removeEventListener("pointerup", onUp); sc.traverse(o => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as any; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((x: any) => { x.map?.dispose?.(); x.dispose?.(); }); }); };
  }, [scene]); // eslint-disable-line
  useEffect(() => () => { st.current.renderer?.dispose(); st.current.renderer?.domElement.remove(); st.current.renderer = undefined; }, []);

  /* ---- 내 별명이 늦게 오면 이름표 갱신 ---- */
  useEffect(() => { const a = st.current.me; if (!a || !me || me === "나") return; a.g.remove(a.name); a.name.material.map?.dispose(); a.name.material.dispose(); a.name = textSprite("나 · " + me, { bg: "rgba(31,94,60,.9)", size: 26 }); if (sceneRef.current === "sauna") a.name.scale.multiplyScalar(.6); a.name.position.y = a.pose === "sit" ? 1.85 : 2.05; a.g.add(a.name); }, [me]);
  /* ---- 액션 이모지 (건배·토닥·수고) ---- */
  useEffect(() => { if (!actPulse) return; const S = st.current; const a = S.me; if (!a || !S.sc) return; const sp = textSprite(actPulse.a, { bg: "rgba(0,0,0,0)", size: 44, pad: 4 }); sp.position.set(a.g.position.x + .4, 2.2, a.g.position.z); S.sc.add(sp); S.emo.push({ sp, t: 0 }); }, [actPulse]);

  const [lying, setLying] = useState(false);
  const lie = () => { const S = st.current; const a = S.me; if (!a) return; if (a.pose === "lie") { a.pose = "stand"; a.tz -= .3; setLying(false); emitMove("stand"); return; }
    const beds = BEDS[scene] ?? []; const taken = new Set([...peopleRef.current.filter(p => !p.me && p.scene === scene && p.pose === "lie").map(p => beds.findIndex(s => Math.hypot(s.x - p.x, s.z - p.z) < .3)), ...(S.npcs ?? []).filter(n => n.seat <= -10).map(n => -10 - n.seat)]);
    const free = beds.map((s, i) => ({ s, i, d: Math.hypot(s.x - a.g.position.x, s.z - a.g.position.z) })).filter(o => !taken.has(o.i)).sort((x, y) => x.d - y.d)[0];
    if (!free) { onToast("누울 자리가 다 찼어요 🙈"); return; }
    a.tx = free.s.x; a.tz = free.s.z; a.pose = "lie"; S.seat = -1; setSitting(false); setLying(true); emitMove("lie"); onToast("🛌 목침 베고 누웠어요… 스르르"); };
  const sit = () => { if (st.current.me?.pose === "lie") setLying(false); const S = st.current; const a = S.me; if (!a) return; if (a.pose === "sit") { a.pose = "stand"; a.tz += .6; S.seat = -1; setSitting(false); emitMove("stand"); return; }
    const taken = new Set([...peopleRef.current.filter(p => !p.me && p.scene === scene && p.pose === "sit").map(p => SEATS[scene].findIndex(s => Math.hypot(s.x - p.x, s.z - p.z) < .3)), ...(S.npcs ?? []).filter(n => n.seat >= 0).map(n => n.seat)]);
    const free = SEATS[scene].map((s, i) => ({ s, i, d: Math.hypot(s.x - a.g.position.x, s.z - a.g.position.z) })).filter(o => !taken.has(o.i)).sort((x, y) => x.d - y.d)[0];
    if (!free) { onToast("자리가 다 찼어요 🙈"); return; }
    a.tx = free.s.x; a.tz = free.s.z; a.pose = "sit"; S.seat = free.i; setSitting(true); emitMove("sit"); };
  const sendSay = async () => { const t = say.trim(); if (!t || busy) return; setBusy(true); const r = await restSay(t); setBusy(false); if (r?.error) { onToast(r.error); return; } const a = st.current.me; if (a) setBubble(a, t); setSay(""); setTimeout(() => { if (a && a.bubbleText === t) setBubble(a, null); }, 10000); };
  const doBurn = async () => { const S = st.current; const a = S.me; const txt = (burn ?? "").trim(); if (!a || !S.sc || !txt) return; const sp = textSprite("📝", { bg: "rgba(0,0,0,0)", size: 40, pad: 2 }); sp.position.set(a.g.position.x, 1.6, a.g.position.z); S.sc.add(sp); S.paper = { sp, t: 0, from: sp.position.clone() }; S.flare = 6; setBurn(null); setBurning(txt); if (sndRef.current !== "on" && sndRef.current !== "off") soundOn(); navigator.vibrate?.(20); const xp = await restBurn(txt.length).catch(() => 0); onXp(xp ? `🔥 걱정 한 장 태웠어요 · 내용은 저장되지 않아요 (+${xp} XP)` : "🔥 걱정 한 장 태웠어요 · 내용은 저장되지 않아요"); };
  const soundOn = async () => { unlockAudio(); try { if (!amb.current) amb.current = new Ambience(); await amb.current.start(sceneRef.current); amb.current.setVolume(vol); setSnd("on"); try { localStorage.setItem("mw-rest-snd", "1"); } catch {} } catch { setSnd("off"); } };
  const strikeBowl = () => { const S = st.current; const r = S.sc?.getObjectByName("bowlring") as THREE.Mesh | undefined; if (r) r.userData.t = 1; if (snd !== "on") soundOn().then(() => amb.current?.bowl()); else amb.current?.bowl(); try { navigator.vibrate?.(15); } catch {} };
  const fire = async (type: number) => { const now = Date.now(); if (now - fwCd.current < 1200) return; fwCd.current = now; if (sndRef.current !== "on" && sndRef.current !== "off") { soundOn().then(() => { sndRef.current = "on"; }).catch(() => {}); } const mp = st.current.me?.g.position; launchFw(type, Math.round((Math.random() * 4 - 2) * 10) / 10, true, mp ? { x: mp.x, z: mp.z } : undefined); };
  const soundOff = () => { amb.current?.stop(); amb.current?.setVolume(0); setSnd("off"); try { localStorage.setItem("mw-rest-snd", "0"); } catch {} };
  useEffect(() => { if (snd === "on") amb.current?.start(scene).then(() => amb.current?.setVolume(vol)); }, [scene]); // eslint-disable-line
  useEffect(() => { amb.current?.setVolume(snd === "on" ? vol : 0); try { localStorage.setItem("mw-rest-vol", String(vol)); } catch {} }, [vol]); // eslint-disable-line
  useEffect(() => () => { amb.current?.dispose(); }, []);
  // 첫 터치에 자동으로 소리 켜기 (브라우저 정책상 제스처 필요) — 전에 껐던 사람은 안 켬
  useEffect(() => { const el = box.current; if (!el) return; const first = () => { let pref = "1"; try { pref = localStorage.getItem("mw-rest-snd") ?? "1"; } catch {} if (pref !== "0") soundOn(); else setSnd("off"); }; el.addEventListener("pointerdown", first, { once: true }); return () => el.removeEventListener("pointerdown", first); }, []); // eslint-disable-line
  const here = people.filter(p => p.scene === scene).length;
  /* ---- 🧖 찜질방: 고구마·달걀·식혜·땀 게이지 ---- */
  const [pot, setPot] = useState(-1), [egg, setEgg] = useState(0), [sip, setSip] = useState(0), [heat, setHeat] = useState(15), [, setTk] = useState(0);
  const jj = useRef({ at: 0, done: false, hot: false, sweat: 0 });
  const potPct = pot < 0 ? 0 : Math.floor((Date.now() - pot) / 400);
  useEffect(() => { if (scene !== "sauna") return; jj.current.at = Date.now(); const id = setInterval(() => { setTk(t => t + 1); const a = st.current.me; if (!a) return; const p = a.g.position;
    const dDome = Math.hypot(p.x - SAUNA_SPOTS.dome.x, p.z - SAUNA_SPOTS.dome.z), dIce = Math.hypot(p.x - SAUNA_SPOTS.ice.x, p.z - SAUNA_SPOTS.ice.z);
    setHeat(h => { const n = Math.max(0, Math.min(100, h + (dIce < 2.4 ? -8 : dDome < 4.5 ? 3 : .7))); if (n >= 95 && !jj.current.hot) { jj.current.hot = true; onToast("🥵 너무 뜨거워요! 얼음방에서 땀 식혀요"); } if (n < 60) jj.current.hot = false;
      if (n > 65 && Date.now() - jj.current.sweat > 5000) { jj.current.sweat = Date.now(); emo("💦"); } return n; }); }, 1000); return () => clearInterval(id); }, [scene]); // eslint-disable-line
  const emo = (t: string) => { const S = st.current; const a = S.me; if (!a || !S.sc) return; const sp = textSprite(t, { bg: "rgba(0,0,0,0)", size: 44, pad: 4 }); sp.position.set(a.g.position.x + .4, 2.2, a.g.position.z); S.sc.add(sp); S.emo.push({ sp, t: 0 }); };
  const goTo = (k: keyof typeof SAUNA_SPOTS) => { const S = st.current; const a = S.me; if (!a) return; const sp = SAUNA_SPOTS[k]; a.tx = sp.x + (Math.random() - .5) * .6; a.tz = sp.z + (Math.random() - .5) * .4; a.pose = "stand"; S.seat = -1; setSitting(false); setLying(false); emitMove("stand"); };
  const announce = (t: string) => { restSay(t).catch(() => {}); const a = st.current.me; if (a) { setBubble(a, t); setTimeout(() => { if (a.bubbleText === t) setBubble(a, null); }, 8000); } };
  const reward = async () => { const J = jj.current; if (J.done || Date.now() - J.at < 60000) return; J.done = true; const x = await restDone("sauna").catch(() => 0); onXp(x ? `🧖 오늘 찜질 완료 +${x} XP` : "🧖 오늘 찜질 완료"); };
  const sfx = async () => { if (sndRef.current !== "on" && sndRef.current !== "off") { await soundOn(); sndRef.current = "on"; } return sndRef.current === "on" ? amb.current : null; };
  /** 앞에 놓는 작은 숯불 화로 + 고구마 */
  const [eat, setEat] = useState<{ kind: "potato" | "egg" | "cup"; step: number; key: number; last: boolean } | null>(null);
  const grill = useRef<{ g: THREE.Group; pot: THREE.Mesh; stop?: () => void } | null>(null);
  const dropGrill = () => { const G = grill.current; if (!G) return; G.stop?.(); st.current.sc?.remove(G.g); grill.current = null; };
  const placeGrill = async () => { const S = st.current; const a = S.me; if (!a || !S.sc) return; dropGrill(); const g = new THREE.Group();
    g.add(boxMesh(.7, .16, .5, M(0x2c2c30, .5), 0, .08, 0)); const coal = M(0x2a1a14, .9, 0xff4a10, 1.1); for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(.07, 0), coal); c.position.set(-.24 + (i % 4) * .16, .2, -.08 + Math.floor(i / 4) * .16); g.add(c); }
    const pot = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .26, 4, 10), M(0x7a3352, .8)); pot.rotation.z = Math.PI / 2; pot.position.set(0, .3, 0); g.add(pot);
    const ry = a.g.rotation.y; g.position.set(a.g.position.x + Math.cos(ry) * .9 + Math.sin(ry) * .3, 0, a.g.position.z - Math.sin(ry) * .9 + Math.cos(ry) * .3); S.sc.add(g); grill.current = { g, pot }; const au = await sfx(); if (au && grill.current?.g === g) grill.current.stop = au.sizzle(); };
  useEffect(() => { if (pot < 0 || !grill.current) return; const k = Math.min(1, potPct / 100), m = grill.current.pot.material as THREE.MeshStandardMaterial; m.color.setHex(potPct >= 170 ? 0x1a1414 : 0x7a3352).lerp(new THREE.Color(potPct >= 170 ? 0x1a1414 : 0xa0522d), potPct >= 170 ? 0 : k); if (potPct % 6 === 0) { const S = st.current; const G = grill.current; if (S.sc && G) { const sp = textSprite(potPct >= 100 ? "♨️" : "💨", { bg: "rgba(0,0,0,0)", size: 30, pad: 2 }); sp.position.set(G.g.position.x, .6, G.g.position.z); S.sc.add(sp); S.emo.push({ sp, t: 0 }); } } }); // eslint-disable-line
  useEffect(() => { if (scene !== "sauna") { dropGrill(); setPot(-1); } }, [scene]); // eslint-disable-line
  /** 먹는 모션: 손에 든 음식이 입으로 왔다 갔다 + 냠 */
  const eatItem = async (kind: "potato" | "egg" | "cup", sec = 2.4) => { const S = st.current; const a = S.me; if (!a) return;
    startHold(a, kind, sec); const au = await sfx();
    const key = Date.now(); setEat({ kind, step: 0, key, last: kind === "cup" && sip + 1 >= 3 }); for (let i = 1; i <= 3; i++) setTimeout(() => setEat(e => e && e.key === key ? { ...e, step: i } : e), i * sec * 1000 / 4); setTimeout(() => setEat(e => e && e.key === key ? null : e), sec * 1000 + 500);
    if (kind === "cup") { au?.slurp(); setTimeout(() => au?.slurp(), 650); } else au?.chew(Math.round(sec * 1.6)); };
  /** 🧊 얼음방: 이동 없이 시원한 소리 + ❄️ + 땀 게이지 0 */
  const iceCool = async () => { (await sfx())?.chill(); emo("❄️"); setTimeout(() => emo("❄️"), 400); setHeat(0); jj.current.hot = false; onToast("🧊 4℃ 얼음방 바람 한 번! 땀이 싹 식었어요"); };
  const potato = async () => { const potPct = pot < 0 ? 0 : Math.floor((Date.now() - pot) / 400);
    if (pot < 0) { setPot(Date.now()); placeGrill(); onToast("🍠 내 앞 숯불에 고구마를 올렸어요 · 치지직… 40초면 익어요"); return; }
    if (potPct < 100) { onToast(`🍠 아직 익는 중이에요 (${potPct}%) · 치지직`); return; }
    setPot(-1); dropGrill(); if (potPct >= 170) { emo("⚫"); onToast("🥲 숯이 됐어요… 다음엔 일찍 꺼내요"); return; }
    eatItem("potato", 2.6); onToast("😋 후후 불어서 한 입… 꿀고구마!"); setTimeout(() => announce("🍠 군고구마 꿀맛~ 호호"), 1800); reward(); };
  const eggTap = async () => {
    if (egg === 0) { setEgg(1); onToast("🥚 맥반석 달걀 하나 받았어요 · 한 번 더 누르면 이마로 톡!"); return; }
    if (egg === 1) { st.current.bump = performance.now(); emo("💥"); try { navigator.vibrate?.(35); } catch {} (await sfx())?.crack(); setEgg(2); onToast("🐑 양머리 이마에 톡! 쩍 갈라졌어요 · 까서 먹어요"); return; }
    setEgg(0); eatItem("egg", 2); onToast("😋 소금 콕 찍어서 한 입에 꿀꺽"); setTimeout(() => announce("🥚 맥반석 달걀 이마로 깨먹기 성공!"), 1500); reward(); };
  const sikhye = async () => { const n = sip + 1; eatItem("cup", 1.3); if (n >= 3) { setSip(0); setTimeout(async () => { (await sfx())?.iceClink(); emo("😮‍💨"); }, 1200); onToast("🥤 캬~ 살얼음 식혜 원샷!"); setTimeout(() => announce("🥤 캬~ 살얼음 식혜 원샷!"), 1300); reward(); } else { setSip(n); onToast("🥤 후루룩… 살얼음이 사각사각"); } };

  return (
    <div className={"r3" + (mode === "zen" ? " zen" : "") + (full ? " full" : "")}>
      <div ref={box} className="r3-canvas" />
      <div className="r3-top">
        <button type="button" className="r3-exit" onClick={() => { if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) history.back(); else location.href = "/home"; }}>← 나가기</button><div className="r3-tabs"><button type="button" aria-pressed={scene === "sauna"} onClick={() => setScene("sauna")}>🧖 찜질방</button><button type="button" aria-pressed={scene === "zen"} onClick={() => setScene("zen")}>🧘 명상</button><button type="button" aria-pressed={scene === "roof"} onClick={() => setScene("roof")}>🌙 옥상</button></div>
        <span className="r3-right"><button type="button" className={"r3-snd" + (snd === "on" ? " on" : "")} onClick={() => snd === "on" ? soundOff() : soundOn()} aria-label="소리">{snd === "on" ? "🔊" : "🔇"}</button><span className="r3-count">👥 {here}명</span></span>
      </div>
      {mode === "zen" ? <><button type="button" className="r3-zen-exit" onClick={() => setMode("normal")}>{scene === "zen" ? "명상 끝내기" : "불멍 끝내기"}</button>{scene === "zen" && <div className="r3-breath" aria-hidden><div className="r3-breath-c" /><div className="r3-breath-t"><span>들이쉬기 4</span><span>멈추기 7</span><span>내쉬기 8</span></div></div>}</> : <>
        {scene === "sauna" && eat && <div className={"r3-eat " + eat.kind} key={eat.key}>
          <div className="r3-eat-food"><span>{eat.kind === "potato" ? "🍠" : eat.kind === "egg" ? "🥚" : "🥤"}</span>{eat.kind !== "cup" ? [0, 1, 2].filter(i => i < eat.step).map(i => <i key={i} className={"bite b" + i} />) : <em className="lvl" style={{ height: `${Math.max(0, 70 - eat.step * 22)}%` }} />}{eat.kind === "potato" && <b className="steam">♨️</b>}</div>
          <div className="r3-eat-say" key={eat.step}>{(eat.kind === "potato" ? ["후후~", "냠", "냠냠", "꿀맛!"] : eat.kind === "egg" ? ["톡", "냠", "냠냠", "꿀꺽"] : ["후루룩", "쭈욱", "사각사각", eat.last ? "캬~!" : "시원해"])[eat.step]}</div></div>}
        {scene === "sauna" && <div className="r3-heat"><span>🌡️ 땀</span><i><em style={{ width: `${heat}%` }} /></i><b>{heat > 85 ? "얼음방 가요!" : heat > 50 ? "개운해요" : "데워지는 중"}</b></div>}<div className="r3-hint">{snd === "wait" ? "🔊 화면을 한 번 탭하면 소리가 켜져요" : "바닥을 탭하면 걸어가요 · 좌우로 끌면 둘러보기"}</div>
        {snd === "on" && <input type="range" className="r3-vol" min={0} max={1} step={.05} value={vol} onChange={e => setVol(Number(e.target.value))} aria-label="볼륨" />}
        <div className="r3-acts">
          {scene === "sauna" && <>            <button type="button" className={"r3-jj" + (potPct >= 100 && potPct < 170 ? " ready" : "")} onClick={potato}><span>{potPct >= 170 ? "⚫" : "🍠"}</span>{pot < 0 ? "고구마 굽기" : potPct < 100 ? `굽는 중 ${potPct}%` : potPct < 170 ? "꺼내 먹기!" : "타버렸어요"}</button>
            <button type="button" className="r3-jj" onClick={eggTap}><span>{egg === 2 ? "🍳" : "🥚"}</span>{egg === 0 ? "맥반석 달걀" : egg === 1 ? "이마로 톡!" : "까서 먹기"}</button>
            <button type="button" className="r3-jj" onClick={sikhye}><span>🥤</span>{sip === 0 ? "살얼음 식혜" : `후루룩 ${sip}/3`}</button>
            <button type="button" className="r3-jj ice" onClick={iceCool}><span>🧊</span>얼음방</button></>}
          {scene === "sauna" && <button type="button" className="r3-jj" onClick={lie}><span>{lying ? "🧍" : "🛌"}</span>{lying ? "일어나기" : "눕기"}</button>}<button type="button" onClick={sit}><span>{sitting ? "🧍" : "🪑"}</span>{sitting ? "일어나기" : "앉기"}</button>
          <button type="button" onClick={() => setBurn(b => b === null ? "" : null)}><span>🔥</span>걱정 태우기</button>
          {scene === "sauna" ? <button type="button" onClick={() => setMode("zen")}><span>🫧</span>불가마 멍</button> : scene === "zen" ? <><button type="button" onClick={strikeBowl}><span>🔔</span>싱잉볼</button><button type="button" onClick={() => setMode("zen")}><span>🧘</span>명상 모드</button></> : <button type="button" onClick={() => setMode("zen")}><span>🫧</span>불멍 모드</button>}{scene === "roof" && <button type="button" className={fwOpen ? "on" : ""} onClick={() => setFwOpen(o => !o)}><span>🎆</span>불꽃놀이</button>}{extra}
        </div>
        {burning && <BurnPaper text={burning} onDone={() => setBurning(null)} onSound={k => { if (sndRef.current === "on") k === "ignite" ? amb.current?.ignite() : amb.current?.crackle(); }} />}
        {scene === "roof" && fwOpen && <div className="r3-fw">{FW_TYPES.map((f, i) => <button key={i} type="button" onClick={() => fire(i)}><span>{f.icon}</span>{f.name}</button>)}<small>같은 옥상에 있는 사람들도 같이 봐요</small></div>}
        <form className="r3-say" onSubmit={e => { e.preventDefault(); sendSay(); }}><input value={say} onChange={e => setSay(e.target.value)} maxLength={60} placeholder="한마디 (10초 말풍선 · 익명)" /><button className="btn" disabled={busy || !say.trim()}>말하기</button></form>
        {burn !== null && <div className="r3-burn"><b>🔥 오늘 태워버릴 걱정 한 장</b><textarea value={burn} onChange={e => setBurn(e.target.value)} maxLength={120} rows={2} placeholder="여기 적은 건 어디에도 저장되지 않아요. 불에 넣고 잊어버려요." autoFocus /><div className="row" style={{ gap: 6, justifyContent: "flex-end" }}><button type="button" className="link" onClick={() => setBurn(null)}>닫기</button><button type="button" className="btn" disabled={!burn.trim()} onClick={doBurn}>불에 넣기</button></div></div>}
      </>}
    </div>
  );
}
