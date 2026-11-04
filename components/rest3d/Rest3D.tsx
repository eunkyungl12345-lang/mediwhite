"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { RestPerson, RestPos } from "@/lib/rest.actions";
import { restSay, restBurn } from "@/lib/rest.actions";
import { Ambience, unlockAudio } from "./ambience";
import { Fireworks, FW_TYPES } from "./fireworks";
import BurnPaper from "./BurnPaper";
import { buildZenHall, buildMarsBase, ZEN_SEATS, MARS_SEATS } from "./scenes2";

/* ========================================================================
   🛋️ 당직실 3D — 병원 옥상 야경 / 병원 앞 포장마차
   - 로우폴리 three.js, 바닥 탭 → 이동, 앉기, 한마디 말풍선, 걱정 태우기, 불멍 모드
   - 위치·포즈는 RestRoom이 restBeat로 서버에 보내고, 다른 사람 위치는 people로 받아요
   ======================================================================== */
export type Scene = "roof" | "pocha" | "zen" | "mars";
type Seat = { x: number; z: number; ry: number };
type Props = { extra?: React.ReactNode; full?: boolean; people: RestPerson[]; me: string; myDept: string; breathK: number; onMove: (p: RestPos) => void; onToast: (m: string) => void; onXp: (m: string) => void; onFirework?: (code: string) => void; actPulse: { k: number; a: string } | null };

const DCOL: Record<string, number> = { 간호사: 0xf48fb1, 간호조무사: 0xf8bbd0, 의사: 0x5fa8e8, 한의사: 0x8fbf9f, 방사선: 0x9f8be8, 물리치료: 0x4fb59a, 작업치료사: 0x6fcf97, 임상병리: 0x7ed69b, 응급구조: 0xf2a900, 원무: 0x3d5a80, 총괄: 0x2b3a67, 병원컨설팅: 0x5b7db1, 치과위생사: 0x7fd1e0, 치과기공사: 0x9bb0c9, 취준생: 0xc9a227, 대학생: 0xe0b84a, 타직장인: 0x8e95ae, 업체: 0x7a8aa0 };
const SEATS: Record<Scene, Seat[]> = {
  roof: [{ x: -3.2, z: 1.6, ry: Math.PI / 2 }, { x: -3.2, z: 0.4, ry: Math.PI / 2 }, { x: 3.2, z: 1.6, ry: -Math.PI / 2 }, { x: 3.2, z: 0.4, ry: -Math.PI / 2 }, { x: -1.2, z: 3.4, ry: Math.PI }, { x: 1.2, z: 3.4, ry: Math.PI }, { x: -5.5, z: -3, ry: 0.6 }, { x: 5.5, z: -3, ry: -0.6 }],
  pocha: [{ x: -3, z: 1.2, ry: Math.PI / 2 }, { x: -1.4, z: 1.2, ry: -Math.PI / 2 }, { x: -3, z: 3, ry: Math.PI / 2 }, { x: -1.4, z: 3, ry: -Math.PI / 2 }, { x: 1.4, z: 1.2, ry: Math.PI / 2 }, { x: 3, z: 1.2, ry: -Math.PI / 2 }, { x: 1.4, z: 3, ry: Math.PI / 2 }, { x: 3, z: 3, ry: -Math.PI / 2 }, { x: -2.2, z: -0.4, ry: 0 }, { x: 2.2, z: -0.4, ry: 0 }],
  zen: ZEN_SEATS,
  mars: MARS_SEATS,
};
const FIRE: Record<Scene, THREE.Vector3> = { roof: new THREE.Vector3(0, 0, 0), pocha: new THREE.Vector3(0, 0.9, -2.4), zen: new THREE.Vector3(0, .8, -6.6), mars: new THREE.Vector3(0, .3, 0) };

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
type Avatar = { g: THREE.Group; body: THREE.Mesh; legs: THREE.Group; arms: THREE.Group; head: THREE.Group; name: THREE.Sprite; bubble: THREE.Sprite | null; bubbleText: string; tx: number; tz: number; pose: string; ry: number; walkT: number };
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
  head.position.y = 1.42;
  g.add(legs, body, collar, arms, head);
  const name = textSprite(me ? (nick === "나" ? "나" : "나 · " + nick) : nick, { bg: me ? "rgba(31,94,60,.9)" : "rgba(20,24,34,.72)", size: 26 }); name.position.y = 2.05; g.add(name);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.36, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28 })); sh.rotation.x = -Math.PI / 2; sh.position.y = .012; g.add(sh);
  g.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; } });
  return { g, body, legs, arms, head, name, bubble: null, bubbleText: "", tx: 0, tz: 0, pose: "stand", ry: 0, walkT: 0 };
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
function buildPocha(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x0d1020); scene.fog = new THREE.Fog(0x0d1020, 30, 90);
  scene.add(new THREE.HemisphereLight(0x6a70a8, 0x2a2218, .9));
  const street = new THREE.DirectionalLight(0xbfc8ff, .35); street.position.set(10, 20, 6); street.castShadow = true; street.shadow.mapSize.set(1024, 1024); street.shadow.camera.left = -14; street.shadow.camera.right = 14; street.shadow.camera.top = 14; street.shadow.camera.bottom = -14; scene.add(street);
  scene.add(stars(250)); skyline(scene, 38, 34);
  // 보도 + 차도
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), M(0x6b6f76, 1)); walk.rotation.x = -Math.PI / 2; walk.receiveShadow = true; walk.name = "ground"; scene.add(walk);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), M(0x2e3138, 1)); road.rotation.x = -Math.PI / 2; road.position.set(0, -.01, 11); scene.add(road);
  const curb = box(18, .18, .3, M(0xaeb3bb), 0, .09, 6.1); scene.add(curb);
  for (let i = 0; i < 6; i++) scene.add(box(1.2, .02, .25, M(0xe9e9e9), -7 + i * 2.8, .005, 11));
  // 병원 건물 정면(뒤)
  const hosp = box(18, 9, 4, M(0xdfe6ee, 1), 0, 4.5, -8.2); scene.add(hosp);
  const winTex = windowsTexture(18, 7, .5, false); const win = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), new THREE.MeshStandardMaterial({ map: winTex, emissiveMap: winTex, emissive: 0xffffff, emissiveIntensity: .8 })); win.position.set(0, 5.4, -6.18); scene.add(win);
  const cross = new THREE.Group(); cross.add(box(.5, 1.6, .1, M(0xe2574c, .5, 0xe2574c, 1.2)), box(1.6, .5, .1, M(0xe2574c, .5, 0xe2574c, 1.2))); cross.position.set(-6, 8, -6.1); scene.add(cross);
  const er = textSprite("응급의료센터", { bg: "rgba(226,87,76,.95)", size: 34 }); er.position.set(0, 2.3, -6.0); er.scale.multiplyScalar(1.4); scene.add(er);
  scene.add(box(4, 2.2, .1, M(0x9fd3f5, .2, 0x9fd3f5, .25), 0, 1.1, -6.15));
  // 포장마차 천막
  const tent = new THREE.Group();
  const roofM = new THREE.MeshStandardMaterial({ color: 0xf29a3c, roughness: .9, side: THREE.DoubleSide, transparent: true, opacity: .96 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.3, 4), roofM); roof.rotation.y = Math.PI / 4; roof.position.y = 3.7; roof.castShadow = true; tent.add(roof);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, .5, 4, 1, true), roofM); skirt.rotation.y = Math.PI / 4; skirt.position.y = 2.85; tent.add(skirt);
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) tent.add(box(.1, 3.1, .1, M(0x8a8f99, .5), x, 1.55, z));
  const sideM = new THREE.MeshStandardMaterial({ color: 0xffe6c7, transparent: true, opacity: .35, side: THREE.DoubleSide }); const side = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.3), sideM); side.position.set(0, 1.5, -3); tent.add(side);
  tent.position.set(0, 0, 1.2); scene.add(tent);
  // 조리대(카트) + 솥 + 김
  scene.add(box(3, .9, 1, M(0xc9ced6, .6), 0, .45, -1.4)); scene.add(box(3, .06, 1.05, M(0x3a3a3a, .3), 0, .93, -1.4));
  for (const dx of [-.9, 0, .9]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.32, .3, .3, 14), M(0xa9adb5, .35, 0x000, 0)); pot.position.set(dx, 1.1, -1.4); scene.add(pot); const soup = new THREE.Mesh(new THREE.CircleGeometry(.29, 14), M(dx === 0 ? 0xd9532b : 0xf2c66b, .4, dx === 0 ? 0xd9532b : 0xf2c66b, .35)); soup.rotation.x = -Math.PI / 2; soup.position.set(dx, 1.26, -1.4); scene.add(soup); }
  const steam = makeFire(new THREE.Vector3(0, 1.3, -1.4), .7); (steam.pts.material as THREE.PointsMaterial).color.set(0xffffff); (steam.pts.material as THREE.PointsMaterial).opacity = .35; steam.light.color.set(0xffd9a8); steam.light.intensity = 1; scene.add(steam.pts, steam.light);
  // 테이블·플라스틱 의자
  const tbl = (x: number, z: number) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .05, 16), M(0xffffff, .5)); t.position.set(x, .7, z); t.castShadow = true; scene.add(t); scene.add(box(.08, .7, .08, M(0x777), x, .35, z)); const can = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .18, 10), M(0x2e8b57, .3)); can.position.set(x + .2, .82, z - .1); scene.add(can); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.07, .05, .12, 10), M(0xf2f2f2, .4)); cup.position.set(x - .2, .78, z + .15); scene.add(cup); };
  tbl(-2.2, 2.1); tbl(2.2, 2.1); tbl(-2.2, -.4 + 1.4); tbl(2.2, -.4 + 1.4);
  const stool = (x: number, z: number) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(.22, .2, .08, 12), M(0xd9463c, .6)); s.position.set(x, .42, z); s.castShadow = true; scene.add(s); for (const [dx, dz] of [[-.13, -.13], [.13, -.13], [-.13, .13], [.13, .13]]) scene.add(box(.04, .42, .04, M(0xd9463c), x + dx, .21, z + dz)); };
  for (const s of SEATS.pocha) stool(s.x, s.z);
  // 줄전구 + 간판
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xffe08a }); for (let i = 0; i < 16; i++) { const t = i / 15; const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 6), bulbM); b.position.set(-3 + t * 6, 2.45 - Math.sin(t * Math.PI) * .25, 4.2); scene.add(b); const b2 = b.clone(); b2.position.set(-3 + t * 6, 2.45 - Math.sin(t * Math.PI) * .25, -1.8); scene.add(b2); }
  const warm = new THREE.PointLight(0xffc987, 2.2, 14); warm.position.set(0, 2.9, 1.2); scene.add(warm);
  const sign = textSprite("🍢 야간 포차 · 24시", { bg: "rgba(242,154,60,.96)", fg: "#2b1a08", size: 30 }); sign.position.set(0, 4.5, 1.2); sign.scale.multiplyScalar(1.1); scene.add(sign);
  // 편의점(오른쪽) · 가로등 · 자전거
  const cvs = box(5, 3.2, 3, M(0xe6ebf2, 1), 7.5, 1.6, -4.5); scene.add(cvs); scene.add(box(4.2, 1.6, .05, M(0xbfe9ff, .2, 0xbfe9ff, .8), 7.5, 1.3, -2.97)); scene.add(box(5, .6, .1, M(0x2f8f5b, .5, 0x2f8f5b, .7), 7.5, 2.9, -2.95));
  const csign = textSprite("24h 편의점", { bg: "rgba(47,143,91,.95)", size: 28 }); csign.position.set(7.5, 2.9, -2.8); scene.add(csign);
  const lampPost = box(.12, 4.5, .12, M(0x555), -7, 2.25, 5); scene.add(lampPost); const lampHead = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff1c9 })); lampHead.position.set(-7, 4.6, 5); scene.add(lampHead); const lampL = new THREE.PointLight(0xfff1c9, 1.2, 12); lampL.position.set(-7, 4.4, 5); scene.add(lampL);
  for (const [x, z] of [[-6.5, -4.5], [-5.6, -4.5]]) { const w1 = new THREE.Mesh(new THREE.TorusGeometry(.32, .03, 6, 18), M(0x222)); w1.position.set(x, .32, z); scene.add(w1); }
  // 구급차(멀리)
  const amb = new THREE.Group(); amb.add(box(2.6, 1.3, 1.3, M(0xffffff, .5), 0, .95, 0), box(.9, 1, 1.25, M(0xffffff, .5), 1.7, .8, 0), box(2.6, .25, 1.32, M(0xe2574c), 0, 1.0, 0)); const beacon = new THREE.Mesh(new THREE.BoxGeometry(.5, .18, .5), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); beacon.position.set(.2, 1.7, 0); amb.add(beacon); amb.position.set(5, 0, 11); scene.add(amb);
  return { fire: steam, camBase: new THREE.Vector3(0, 0, 1.2) };
}

const boxMesh = box;
/* ---------- 함께 있는 동료들 (분위기용 · 이름표 없음 · 인원수에는 안 들어가요) ---------- */
const NPC_DEPTS = ["간호사", "의사", "방사선", "물리치료", "임상병리", "응급구조", "원무", "간호조무사"];
function suit(a: Avatar) { const helmet = new THREE.Mesh(new THREE.SphereGeometry(.38, 16, 12), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: .3, roughness: .05 })); a.head.add(helmet); (a.body.material as THREE.MeshStandardMaterial).color.set(0xeef1f5); }
function spawnNPCs(scene: Scene, sc: THREE.Scene) {
  const seats = SEATS[scene], rate = scene === "zen" ? .72 : scene === "mars" ? .5 : .55, out: { a: Avatar; seat: number; stand?: boolean }[] = [];
  const rnd = (i: number) => { const v = Math.sin(i * 12.9898 + seats.length * 78.233) * 43758.5453; return v - Math.floor(v); };
  seats.forEach((st, i) => { if (rnd(i) > rate || (scene === "zen" && (i === 20 || i === 21))) return; const a = makeAvatar("", NPC_DEPTS[i % NPC_DEPTS.length], false); a.g.remove(a.name); if (scene === "mars") suit(a); a.g.position.set(st.x, 0, st.z); a.tx = st.x; a.tz = st.z; a.pose = "sit"; a.g.rotation.y = st.ry; sc.add(a.g); out.push({ a, seat: i }); });
  const extra: [number, number, number][] = scene === "roof" ? [[-6.5, -6, .4], [6.6, 5.8, -2.4], [4.8, -6.4, 0]] : scene === "pocha" ? [[6.4, -1.6, -1.2], [-5.6, 3.8, 1.6]] : scene === "mars" ? [[-6, -8, .4], [5, -9, -.3], [8, -2, -1.2]] : [];
  extra.forEach(([x, z, ry], i) => { const a = makeAvatar("", NPC_DEPTS[(i + 3) % NPC_DEPTS.length], false); a.g.remove(a.name); if (scene === "mars") suit(a); a.g.position.set(x, 0, z); a.tx = x; a.tz = z; a.pose = "stand"; a.g.rotation.y = ry; sc.add(a.g); out.push({ a, seat: -1, stand: true }); });
  return out;
}
export default function Rest3D({ people, me, myDept, breathK, onMove, onToast, onXp, actPulse, extra, full, onFirework }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<Scene>(() => { try { return (localStorage.getItem("mw-rest-scene") as Scene) || "roof"; } catch { return "roof"; } });
  const [snd, setSnd] = useState<"off" | "on" | "wait">("wait"), [vol, setVol] = useState(() => { try { return Number(localStorage.getItem("mw-rest-vol") ?? .7); } catch { return .7; } });
  const amb = useRef<Ambience | null>(null); const sndRef = useRef(snd); sndRef.current = snd;
  const [fwOpen, setFwOpen] = useState(false); const [burning, setBurning] = useState<string | null>(null); const fwCd = useRef(0);
  const [mode, setMode] = useState<"normal" | "zen">("normal"), [say, setSay] = useState(""), [burn, setBurn] = useState<string | null>(null), [busy, setBusy] = useState(false), [sitting, setSitting] = useState(false);
  const st = useRef<{ flare?: number; fw?: Fireworks; fwSeen?: Record<string, number>; lookCur?: THREE.Vector3; fwAt?: number; npcs?: { a: Avatar; seat: number; stand?: boolean }[]; renderer?: THREE.WebGLRenderer; cam?: THREE.PerspectiveCamera; sc?: THREE.Scene; ground?: THREE.Object3D; me?: Avatar; others: Map<string, Avatar>; fire?: ReturnType<typeof makeFire>; raf: number; yaw: number; last: number; emo: { sp: THREE.Sprite; t: number }[]; paper?: { sp: THREE.Sprite; t: number; from: THREE.Vector3 }; camBase: THREE.Vector3; seat: number }>({ others: new Map(), raf: 0, yaw: 0, last: 0, emo: [], camBase: new THREE.Vector3(), seat: -1 });
  const peopleRef = useRef(people), breathRef = useRef(breathK), sceneRef = useRef(scene), modeRef = useRef(mode);
  peopleRef.current = people; breathRef.current = breathK; sceneRef.current = scene; modeRef.current = mode;
  const moveTimer = useRef<any>(null);
  const emitMove = (pose: string) => { const a = st.current.me; if (!a) return; clearTimeout(moveTimer.current); moveTimer.current = setTimeout(() => onMove({ scene: sceneRef.current, x: a.tx, z: a.tz, pose }), 350); };

  /** 불꽃 발사 (mine=true면 서버로 알려 다른 사람도 보게) */
  const launchFw = (type: number, ox: number, mine: boolean) => { const S = st.current; if (!S.fw) return; const from = new THREE.Vector3(3.2 + ox * .3, .5, -5.8), to = new THREE.Vector3(ox * 3 + (Math.random() - .5) * 4, 13 + Math.random() * 5, -24 - Math.random() * 8); S.fw.launch(type, from, to, 1.1);
    if (amb.current && sndRef.current === "on") amb.current.firework(1.1, mine ? 1 : .7); if (mine) { try { navigator.vibrate?.([10, 1050, 40]); } catch {} onFirework?.(`fw:${type}:${ox.toFixed(1)}:0`); } };
  /* ---- 초기화 / 씬 전환 ---- */
  useEffect(() => {
    const el = box.current; if (!el) return;
    const S = st.current;
    if (!S.renderer) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" }); r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.35;
      el.appendChild(r.domElement); S.renderer = r;
      S.cam = new THREE.PerspectiveCamera(50, 1, .1, 300);
    }
    // 씬 구성
    const sc = new THREE.Scene(); S.sc = sc; S.others.forEach(a => setBubble(a, null)); S.others.clear(); S.emo = []; S.paper = undefined; S.seat = -1; setSitting(false);
    const H = { M, box: boxMesh, makeFire, textSprite }; const built = scene === "roof" ? buildRoof(sc) : scene === "pocha" ? buildPocha(sc) : scene === "zen" ? buildZenHall(sc, H) : buildMarsBase(sc, H); S.npcs = spawnNPCs(scene, sc); S.fw?.dispose(); S.fw = undefined; S.fwSeen = S.fwSeen ?? {};
    if (scene === "roof") { S.fw = new Fireworks(sc); const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .08, 24), M(0x2a2f3a, .7)); pad.position.set(3.2, .04, -5.8); pad.receiveShadow = true; sc.add(pad); const stripe = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.28, 32), new THREE.MeshBasicMaterial({ color: 0xffd36e, side: THREE.DoubleSide })); stripe.rotation.x = -Math.PI / 2; stripe.position.set(3.2, .09, -5.8); sc.add(stripe); for (let i = 0; i < 5; i++) { const tube = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .5, 10), M([0xe2574c, 0xf2a900, 0x5fa8e8, 0x7ed69b, 0xf48fb1][i], .5)); tube.position.set(2.6 + i * .3, .3, -5.8 + (i % 2) * .3); tube.rotation.x = -.2; tube.castShadow = true; sc.add(tube); } const fsign = textSprite("🎆 불꽃놀이 존", { bg: "rgba(242,169,0,.95)", fg: "#2b1a08", size: 28 }); fsign.position.set(3.2, 2.2, -5.8); sc.add(fsign); } S.fire = built.fire; S.camBase = built.camBase; S.ground = sc.getObjectByName("ground")!;
    const meAv = makeAvatar(me, myDept, true); const spawn = scene === "roof" ? { x: 0, z: 5.5 } : scene === "pocha" ? { x: 0, z: 5 } : scene === "zen" ? { x: 0, z: 7 } : { x: 0, z: 5 }; meAv.g.position.set(spawn.x, 0, spawn.z); meAv.tx = spawn.x; meAv.tz = spawn.z; meAv.ry = Math.PI; meAv.g.rotation.y = Math.PI; sc.add(meAv.g); S.me = meAv;
    try { localStorage.setItem("mw-rest-scene", scene); } catch {}
    onMove({ scene, x: spawn.x, z: spawn.z, pose: "stand" });

    const resize = () => { const w = el.clientWidth, h = el.clientHeight > 200 ? el.clientHeight : Math.round(Math.min(560, Math.max(380, w * 1.15))); S.renderer!.setSize(w, h, false); S.renderer!.domElement.style.width = "100%"; S.renderer!.domElement.style.height = h + "px"; S.cam!.aspect = w / h; S.cam!.updateProjectionMatrix(); };
    resize(); addEventListener("resize", resize); const ro = new ResizeObserver(resize); ro.observe(el);

    // 입력: 탭 → 이동, 드래그 → 카메라 회전
    let down: { x: number; y: number; t: number; yaw: number } | null = null;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), yaw: S.yaw }; };
    const onMoveP = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 6) S.yaw = down.yaw - dx * .006; };
    const onUp = (e: PointerEvent) => {
      if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y, dt = performance.now() - down.t; down = null;
      if (Math.hypot(dx, dy) > 8 || dt > 400 || modeRef.current === "zen") return;
      const rc = S.renderer!.domElement.getBoundingClientRect(); ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
      ray.setFromCamera(ndc, S.cam!); const hit = ray.intersectObject(S.ground!, false)[0]; if (!hit) return;
      const a = S.me!; const sN = sceneRef.current; a.tx = Math.max(sN === "mars" ? -12 : -7.4, Math.min(sN === "mars" ? 12 : 7.4, hit.point.x)); a.tz = Math.max(sN === "zen" ? -5.4 : sN === "mars" ? -10 : -7.4, Math.min(sN === "roof" ? 7.4 : sN === "zen" ? 9 : sN === "mars" ? 9 : 5.6, hit.point.z)); a.pose = "stand"; S.seat = -1; setSitting(false); emitMove("stand");
    };
    const dom = S.renderer!.domElement; dom.addEventListener("pointerdown", onDown); addEventListener("pointermove", onMoveP); addEventListener("pointerup", onUp);

    // 루프
    const camPos = new THREE.Vector3(), look = new THREE.Vector3(); S.last = performance.now();
    const tick = () => {
      S.raf = requestAnimationFrame(tick); const now = performance.now(), dt = Math.min(.05, (now - S.last) / 1000); S.last = now; const t = now / 1000;
      S.fire?.update(dt); S.fw?.update(dt); if (S.flare && S.flare > 0 && S.fire) { S.flare -= dt; const k = Math.sin(Math.min(1, S.flare / 6) * Math.PI); S.fire.light.intensity += k * 4; S.fire.pts.scale.setScalar(1 + k * .9); } else if (S.fire) S.fire.pts.scale.setScalar(1);
      if (S.fw) for (const p of peopleRef.current) { if (p.me || p.scene !== "roof" || !p.act?.startsWith("fw:") || p.actAge > 6) continue; const key = p.nick + p.act; if (S.fwSeen![key]) continue; S.fwSeen![key] = Date.now(); const [, ty, ox] = p.act.split(":"); launchFw(+ty || 0, +ox || 0, false); }
      // 다른 사람 동기화
      const ps = peopleRef.current.filter(p => !p.me && p.scene === sceneRef.current); const alive = new Set<string>();
      for (const p of ps) { alive.add(p.nick); let a = S.others.get(p.nick); if (!a) { a = makeAvatar(p.nick, p.dept, false); a.g.position.set(p.x, 0, p.z); a.tx = p.x; a.tz = p.z; sc.add(a.g); S.others.set(p.nick, a); } a.tx = p.x; a.tz = p.z; a.pose = p.pose; const txt = p.say && p.sayAge < 12 ? p.say : null; if ((txt ?? "") !== a.bubbleText) setBubble(a, txt); }
      for (const [k, a] of S.others) if (!alive.has(k)) { sc.remove(a.g); S.others.delete(k); }
      // 아바타 이동/애니메이션
      const anim = (a: Avatar, isMe: boolean) => {
        const dx = a.tx - a.g.position.x, dz = a.tz - a.g.position.z, d = Math.hypot(dx, dz);
        if (d > .04) { const sp = Math.min(d, 2.6 * dt); a.g.position.x += dx / d * sp; a.g.position.z += dz / d * sp; const ty = Math.atan2(dx, dz); let dr = ty - a.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); a.g.rotation.y += dr * Math.min(1, dt * 10); a.walkT += dt * 9; }
        else { a.walkT += (0 - (a.walkT % (Math.PI * 2))) * .2; if (a.pose === "sit") { const seat = SEATS[sceneRef.current].find(s => Math.hypot(s.x - a.tx, s.z - a.tz) < .3); if (seat) { let dr = seat.ry - a.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); a.g.rotation.y += dr * Math.min(1, dt * 8); } } }
        const walking = d > .04, swing = walking ? Math.sin(a.walkT) * .55 : 0;
        a.legs.children[0].rotation.x = swing; a.legs.children[1].rotation.x = swing; a.legs.children[2].rotation.x = -swing; a.legs.children[3].rotation.x = -swing;
        a.arms.children[0].rotation.x = -swing * .8; a.arms.children[1].rotation.x = -swing * .8; a.arms.children[2].rotation.x = swing * .8; a.arms.children[3].rotation.x = swing * .8;
        const sit = a.pose === "sit" && !walking; const k = isMe ? breathRef.current : 0;
        a.body.position.y = (sit ? .62 : .82) + (walking ? Math.abs(Math.sin(a.walkT)) * .05 : Math.sin(t * 2 + a.tx) * .012) + k * .03; a.head.position.y = (sit ? 1.22 : 1.42) + (walking ? Math.abs(Math.sin(a.walkT)) * .05 : 0) + k * .04; a.arms.position.y = sit ? -.2 : 0; a.name.position.y = sit ? 1.85 : 2.05; if (a.bubble) a.bubble.position.y = sit ? 2.3 : 2.5;
        a.legs.rotation.x = sit ? -Math.PI / 2 : 0; a.legs.position.y = sit ? .4 : 0; a.legs.position.z = sit ? .2 : 0;
        a.body.scale.setScalar(1 + k * .05);
      };
      if (S.me) anim(S.me, true); S.others.forEach(a => anim(a, false)); S.npcs?.forEach(n => anim(n.a, false));
      // 이모지·종이
      for (const e of S.emo) { e.t += dt; e.sp.position.y += dt * .9; (e.sp.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - e.t / 1.8); } S.emo = S.emo.filter(e => { if (e.t > 1.8) { sc.remove(e.sp); return false; } return true; });
      if (S.paper) { const p = S.paper; p.t += dt; const fp = FIRE[sceneRef.current].clone().add(new THREE.Vector3(0, .9, 0)); p.sp.position.lerpVectors(p.from, fp, Math.min(1, p.t / 1.4)); p.sp.position.y += Math.sin(Math.min(1, p.t / 1.4) * Math.PI) * 1.2; p.sp.material.rotation += dt * 4; if (p.t > 1.4) { p.sp.material.opacity -= dt * 2.5; if (p.sp.material.opacity <= 0) { sc.remove(p.sp); S.paper = undefined; } } }
      // 카메라
      const meP = S.me ? S.me.g.position : S.camBase;
      if (modeRef.current === "zen") { const f = FIRE[sceneRef.current]; const ang = t * .12; camPos.set(f.x + Math.cos(ang) * 4.2, f.y + 1.6 + Math.sin(t * .3) * .1, f.z + Math.sin(ang) * 4.2); look.set(f.x, f.y + .9, f.z); }
      else { const far = S.cam!.aspect < .8 ? 9.6 : 6.4; camPos.set(meP.x + Math.sin(S.yaw) * far, far * .66, meP.z + Math.cos(S.yaw) * far); look.set(meP.x, 1, meP.z - (sceneRef.current === "zen" ? 3 : 1.2)); }
      if (S.fw && S.fw.active > 0 && modeRef.current !== "zen") { const k = Math.min(1, S.fw.active / 1.2); const sky = new THREE.Vector3(S.fw.lastBurst.x * .5, 8, -12); look.lerp(sky, k * .8); }
      S.cam!.position.lerp(camPos, Math.min(1, dt * 4)); if (!S.lookCur) S.lookCur = look.clone(); S.lookCur.lerp(look, Math.min(1, dt * 3)); S.cam!.lookAt(S.lookCur);
      S.renderer!.render(sc, S.cam!);
    };
    cancelAnimationFrame(S.raf); tick();
    return () => { cancelAnimationFrame(S.raf); ro.disconnect(); removeEventListener("resize", resize); dom.removeEventListener("pointerdown", onDown); removeEventListener("pointermove", onMoveP); removeEventListener("pointerup", onUp); sc.traverse(o => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as any; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((x: any) => { x.map?.dispose?.(); x.dispose?.(); }); }); };
  }, [scene]); // eslint-disable-line
  useEffect(() => () => { st.current.renderer?.dispose(); st.current.renderer?.domElement.remove(); st.current.renderer = undefined; }, []);

  /* ---- 내 별명이 늦게 오면 이름표 갱신 ---- */
  useEffect(() => { const a = st.current.me; if (!a || !me || me === "나") return; a.g.remove(a.name); a.name.material.map?.dispose(); a.name.material.dispose(); a.name = textSprite("나 · " + me, { bg: "rgba(31,94,60,.9)", size: 26 }); a.name.position.y = a.pose === "sit" ? 1.85 : 2.05; a.g.add(a.name); }, [me]);
  /* ---- 액션 이모지 (건배·토닥·수고) ---- */
  useEffect(() => { if (!actPulse) return; const S = st.current; const a = S.me; if (!a || !S.sc) return; const sp = textSprite(actPulse.a, { bg: "rgba(0,0,0,0)", size: 44, pad: 4 }); sp.position.set(a.g.position.x + .4, 2.2, a.g.position.z); S.sc.add(sp); S.emo.push({ sp, t: 0 }); }, [actPulse]);

  const sit = () => { const S = st.current; const a = S.me; if (!a) return; if (a.pose === "sit") { a.pose = "stand"; a.tz += .6; S.seat = -1; setSitting(false); emitMove("stand"); return; }
    const taken = new Set([...peopleRef.current.filter(p => !p.me && p.scene === scene && p.pose === "sit").map(p => SEATS[scene].findIndex(s => Math.hypot(s.x - p.x, s.z - p.z) < .3)), ...(S.npcs ?? []).filter(n => n.seat >= 0).map(n => n.seat)]);
    const free = SEATS[scene].map((s, i) => ({ s, i, d: Math.hypot(s.x - a.g.position.x, s.z - a.g.position.z) })).filter(o => !taken.has(o.i)).sort((x, y) => x.d - y.d)[0];
    if (!free) { onToast("자리가 다 찼어요 🙈"); return; }
    a.tx = free.s.x; a.tz = free.s.z; a.pose = "sit"; S.seat = free.i; setSitting(true); emitMove("sit"); };
  const sendSay = async () => { const t = say.trim(); if (!t || busy) return; setBusy(true); const r = await restSay(t); setBusy(false); if (r?.error) { onToast(r.error); return; } const a = st.current.me; if (a) setBubble(a, t); setSay(""); setTimeout(() => { if (a && a.bubbleText === t) setBubble(a, null); }, 10000); };
  const doBurn = async () => { const S = st.current; const a = S.me; const txt = (burn ?? "").trim(); if (!a || !S.sc || !txt) return; const sp = textSprite("📝", { bg: "rgba(0,0,0,0)", size: 40, pad: 2 }); sp.position.set(a.g.position.x, 1.6, a.g.position.z); S.sc.add(sp); S.paper = { sp, t: 0, from: sp.position.clone() }; S.flare = 6; setBurn(null); setBurning(txt); if (sndRef.current !== "on" && sndRef.current !== "off") soundOn(); navigator.vibrate?.(20); const xp = await restBurn(txt.length).catch(() => 0); onXp(xp ? `🔥 걱정 한 장 태웠어요 · 내용은 저장되지 않아요 (+${xp} XP)` : "🔥 걱정 한 장 태웠어요 · 내용은 저장되지 않아요"); };
  const soundOn = async () => { unlockAudio(); try { if (!amb.current) amb.current = new Ambience(); await amb.current.start(sceneRef.current); amb.current.setVolume(vol); setSnd("on"); try { localStorage.setItem("mw-rest-snd", "1"); } catch {} } catch { setSnd("off"); } };
  const strikeBowl = () => { const S = st.current; const r = S.sc?.getObjectByName("bowlring") as THREE.Mesh | undefined; if (r) r.userData.t = 1; if (snd !== "on") soundOn().then(() => amb.current?.bowl()); else amb.current?.bowl(); try { navigator.vibrate?.(15); } catch {} };
  const fire = async (type: number) => { const now = Date.now(); if (now - fwCd.current < 1200) return; fwCd.current = now; if (sndRef.current !== "on" && sndRef.current !== "off") { await soundOn(); sndRef.current = "on"; } launchFw(type, Math.round((Math.random() * 4 - 2) * 10) / 10, true); };
  const soundOff = () => { amb.current?.stop(); amb.current?.setVolume(0); setSnd("off"); try { localStorage.setItem("mw-rest-snd", "0"); } catch {} };
  useEffect(() => { if (snd === "on") amb.current?.start(scene).then(() => amb.current?.setVolume(vol)); }, [scene]); // eslint-disable-line
  useEffect(() => { amb.current?.setVolume(snd === "on" ? vol : 0); try { localStorage.setItem("mw-rest-vol", String(vol)); } catch {} }, [vol]); // eslint-disable-line
  useEffect(() => () => { amb.current?.dispose(); }, []);
  // 첫 터치에 자동으로 소리 켜기 (브라우저 정책상 제스처 필요) — 전에 껐던 사람은 안 켬
  useEffect(() => { const el = box.current; if (!el) return; const first = () => { let pref = "1"; try { pref = localStorage.getItem("mw-rest-snd") ?? "1"; } catch {} if (pref !== "0") soundOn(); else setSnd("off"); }; el.addEventListener("pointerdown", first, { once: true }); return () => el.removeEventListener("pointerdown", first); }, []); // eslint-disable-line
  const here = people.filter(p => p.scene === scene).length;

  return (
    <div className={"r3" + (mode === "zen" ? " zen" : "") + (full ? " full" : "")}>
      <div ref={box} className="r3-canvas" />
      <div className="r3-top">
        {full && <a href="/games" className="r3-back" aria-label="나가기">‹</a>}<div className="r3-tabs"><button type="button" aria-pressed={scene === "roof"} onClick={() => setScene("roof")}>옥상</button><button type="button" aria-pressed={scene === "pocha"} onClick={() => setScene("pocha")}>포차</button><button type="button" aria-pressed={scene === "zen"} onClick={() => setScene("zen")}>명상</button><button type="button" aria-pressed={scene === "mars"} onClick={() => setScene("mars")}>🔴 화성</button></div>
        <span className="r3-right"><button type="button" className={"r3-snd" + (snd === "on" ? " on" : "")} onClick={() => snd === "on" ? soundOff() : soundOn()} aria-label="소리">{snd === "on" ? "🔊" : "🔇"}</button><span className="r3-count">👥 {here}명</span></span>
      </div>
      {mode === "zen" ? <><button type="button" className="r3-zen-exit" onClick={() => setMode("normal")}>{scene === "zen" ? "명상 끝내기" : "불멍 끝내기"}</button>{scene === "zen" && <div className="r3-breath" aria-hidden><div className="r3-breath-c" /><div className="r3-breath-t"><span>들이쉬기 4</span><span>멈추기 7</span><span>내쉬기 8</span></div></div>}</> : <>
        <div className="r3-hint">{snd === "wait" ? "🔊 화면을 한 번 탭하면 소리가 켜져요" : "바닥을 탭하면 걸어가요 · 좌우로 끌면 둘러보기"}</div>
        {snd === "on" && <input type="range" className="r3-vol" min={0} max={1} step={.05} value={vol} onChange={e => setVol(Number(e.target.value))} aria-label="볼륨" />}
        <div className="r3-acts">
          <button type="button" onClick={sit}><span>{sitting ? "🧍" : "🪑"}</span>{sitting ? "일어나기" : "앉기"}</button>
          <button type="button" onClick={() => setBurn(b => b === null ? "" : null)}><span>🔥</span>걱정 태우기</button>
          {scene === "zen" ? <><button type="button" onClick={strikeBowl}><span>🔔</span>싱잉볼</button><button type="button" onClick={() => setMode("zen")}><span>🧘</span>명상 모드</button></> : <button type="button" onClick={() => setMode("zen")}><span>🫧</span>불멍 모드</button>}{scene === "roof" && <button type="button" className={fwOpen ? "on" : ""} onClick={() => setFwOpen(o => !o)}><span>🎆</span>불꽃놀이</button>}{extra}
        </div>
        {burning && <BurnPaper text={burning} onDone={() => setBurning(null)} onSound={k => { if (sndRef.current === "on") k === "ignite" ? amb.current?.ignite() : amb.current?.crackle(); }} />}
        {scene === "roof" && fwOpen && <div className="r3-fw">{FW_TYPES.map((f, i) => <button key={i} type="button" onClick={() => fire(i)}><span>{f.icon}</span>{f.name}</button>)}<small>같은 옥상에 있는 사람들도 같이 봐요</small></div>}
        <form className="r3-say" onSubmit={e => { e.preventDefault(); sendSay(); }}><input value={say} onChange={e => setSay(e.target.value)} maxLength={60} placeholder="한마디 (10초 말풍선 · 익명)" /><button className="btn" disabled={busy || !say.trim()}>말하기</button></form>
        {burn !== null && <div className="r3-burn"><b>🔥 오늘 태워버릴 걱정 한 장</b><textarea value={burn} onChange={e => setBurn(e.target.value)} maxLength={120} rows={2} placeholder="여기 적은 건 어디에도 저장되지 않아요. 불에 넣고 잊어버려요." autoFocus /><div className="row" style={{ gap: 6, justifyContent: "flex-end" }}><button type="button" className="link" onClick={() => setBurn(null)}>닫기</button><button type="button" className="btn" disabled={!burn.trim()} onClick={doBurn}>불에 넣기</button></div></div>}
      </>}
    </div>
  );
}
