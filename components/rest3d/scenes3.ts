/** 당직실 3D 찜질방: 황토벽 · 불가마 돔 · 숯불 고구마 · 매점(식혜·맥반석 달걀) · 얼음방 문 · 매트+목침 */
import * as THREE from "three";
type Seat = { x: number; z: number; ry: number };
type Fire = { pts: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>; light: THREE.PointLight; update: (dt: number) => void };
type Helpers = { M: (c: number, r?: number, e?: number, ei?: number) => THREE.MeshStandardMaterial; box: (w: number, h: number, d: number, m: THREE.Material, x?: number, y?: number, z?: number) => THREE.Mesh; makeFire: (pos: THREE.Vector3, scale?: number) => Fire; textSprite: (t: string, o?: any) => THREE.Sprite };

const face = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);
/** 앉는 방석: 불가마 앞 · TV 앞 · 매점 옆 */
export const SAUNA_SEATS: Seat[] = [
  ...[[-2.6, -1.3], [-.9, -.9], [.9, -.9], [2.6, -1.3]].map(([x, z]) => ({ x, z, ry: face(x, z, 0, -6.4) })),
  ...[[5.2, -6.5], [5.2, -4.3], [6.5, -5.4], [4.2, -5.4]].map(([x, z]) => ({ x, z, ry: face(x, z, 8.8, -5.4) })),
  { x: -5.4, z: 1.4, ry: face(-5.4, 1.4, -8, -1) }];
/** 눕는 매트(머리는 앞쪽 -z, 목침 있음): 앞쪽 왼편 · 오른편 */
export const SAUNA_BEDS: Seat[] = [...[3.4, 5, 6.6, 8.2].map(z => ({ x: -6.2, z, ry: Math.PI / 2 })), ...[3.8, 5.4, 7, 8.6].map(z => ({ x: 6.2, z, ry: -Math.PI / 2 }))];
/** 돌아다니는 사람이 들르는 곳 */
export const SAUNA_ROUTE = [{ x: -6.5, z: -.4 }, { x: 7.2, z: 1 }, { x: 0, z: -2.4 }, { x: 3.6, z: -3 }, { x: 0, z: 2.6 }, { x: -3.2, z: -3.4 }, { x: -2.4, z: 5 }, { x: 2.6, z: 5.5 }];
/** 걸어가는 곳: 숯불(고구마) · 매점(달걀·식혜) · 얼음방 */
export const SAUNA_SPOTS = { coal: { x: -3.2, z: -3.2 }, shop: { x: -6.4, z: -1 }, ice: { x: 11, z: 1 }, dome: { x: 0, z: -3 } };
export const SAUNA_FIRE = new THREE.Vector3(0, .5, -4);

const tex = (draw: (x: CanvasRenderingContext2D, s: number) => void, s = 512, rx = 1, ry = 1) => { const c = document.createElement("canvas"); c.width = c.height = s; draw(c.getContext("2d")!, s); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; return t; };

const puff = () => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d")!; const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); };
/** 바닥 안내 글자: 절반 크기 + 반투명 (풍경을 가리지 않게) */
const soft = (sp: THREE.Sprite) => { sp.scale.multiplyScalar(.5); const m = sp.material as THREE.SpriteMaterial; m.transparent = true; m.opacity = .6; return sp; };
export function buildSauna(scene: THREE.Scene, h: Helpers) {
  const { M, box, makeFire, textSprite } = h;
  scene.background = new THREE.Color(0x2a1a10); scene.fog = new THREE.Fog(0x3a2414, 22, 48);
  scene.add(new THREE.HemisphereLight(0xffd8b0, 0x3a2010, .7));
  const key = new THREE.DirectionalLight(0xffd6a8, .35); key.position.set(-5, 11, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); scene.add(key);

  // 바닥: 밝은 편백 마루
  const floorTex = tex((x, s) => { x.fillStyle = "#c99a68"; x.fillRect(0, 0, s, s); for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(90,50,20,${.04 + (i % 3) * .035})`; x.fillRect(0, i * 32, s, 32); x.fillStyle = "rgba(80,45,20,.35)"; x.fillRect(0, i * 32, s, 1.5); for (let k = 0; k < 14; k++) { x.strokeStyle = `rgba(120,70,30,${Math.random() * .12})`; x.beginPath(); const y = i * 32 + Math.random() * 32; x.moveTo(0, y); x.bezierCurveTo(170, y + 3, 340, y - 3, s, y); x.stroke(); } } }, 512, 5, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 20), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .7 })); floor.rotation.x = -Math.PI / 2; floor.position.z = 1; floor.receiveShadow = true; floor.name = "ground"; scene.add(floor);

  // 황토벽 + 나무 기둥
  const clayTex = tex((x, s) => { x.fillStyle = "#c58a56"; x.fillRect(0, 0, s, s); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? "255,220,170" : "110,60,30"},${Math.random() * .12})`; x.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 5, 2 + Math.random() * 4); } }, 256, 4, 2);
  const wallM = new THREE.MeshStandardMaterial({ map: clayTex, roughness: 1 }), woodM = M(0x6b3f22, .7);
  scene.add(box(18, 9, .3, wallM, 0, 4.5, -9), box(.3, 9, 20, wallM, -9, 4.5, 1));
  // 오른쪽 벽: 얼음방 문(z -0.2 ~ 2.2) 자리만 비워 둠
  scene.add(box(.3, 9, 8.8, wallM, 9, 4.5, -4.6), box(.3, 9, 8.8, wallM, 9, 4.5, 6.6), box(.3, 6, 2.4, wallM, 9, 6, 1));
  for (const sx of [-8.7, 8.7]) for (const sz of [-8.7, -3, 3, 8.7]) scene.add(box(.35, 5, .35, woodM, sx, 2.5, sz));
  for (const sz of [-8.7]) scene.add(box(18, .35, .35, woodM, 0, 4.9, sz)); for (const sx of [-8.7, 8.7]) scene.add(box(.35, .35, 20, woodM, sx, 4.9, 1));

  // 🔥 불가마: 황토 돔 + 돌 + 아치 입구 + 안쪽 불빛
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.8, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8e5532, 1)); dome.position.set(0, 0, -6.4); dome.castShadow = true; dome.receiveShadow = true; scene.add(dome);
  const stoneM = [M(0x7a4a2c, 1), M(0x9a6a44, 1), M(0xa87a50, 1)];
  for (let i = 0; i < 60; i++) { const th = Math.random() * Math.PI * 2, ph = Math.random() * 1.35; if (Math.abs(th - Math.PI / 2) < .5 && ph < .55) continue; const r = 2.8, st = new THREE.Mesh(new THREE.DodecahedronGeometry(.12 + Math.random() * .14, 0), stoneM[i % 3]); st.position.set(Math.cos(ph) * Math.cos(th) * r, Math.sin(ph) * r, -6.4 + Math.cos(ph) * Math.sin(th) * r); st.rotation.set(i, i * .7, 0); scene.add(st); }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1.05, 24, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a0600, emissive: 0xff5a14, emissiveIntensity: .55 })); hole.position.set(0, 0, -3.52); scene.add(hole);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.08, .16, 8, 24, Math.PI), M(0x4a2a18, .9)); arch.position.set(0, 0, -3.5); arch.castShadow = true; scene.add(arch);
  scene.add(box(2.5, .12, .5, M(0x4a2a18, .9), 0, .06, -3.4));
  const flame = makeFire(SAUNA_FIRE.clone(), .85); flame.light.intensity = 3.4; flame.light.distance = 16; scene.add(flame.pts, flame.light);
  const glow = new THREE.PointLight(0xff8a3a, 2.4, 12, 1.4); glow.position.set(0, 1.4, -2.6); scene.add(glow);
  const sign = textSprite("🔥 불가마 78℃", { bg: "rgba(170,52,18,.92)", size: 30 }); sign.position.set(0, 3.6, -6.4); scene.add(sign);

  // 숯불 화로 + 고구마
  scene.add(box(1.8, .5, 1.1, M(0x3a3a3e, .6), -3.4, .25, -4.6), box(1.9, .06, 1.2, M(0x222226, .5), -3.4, .52, -4.6));
  const coalM = M(0x2a1a14, .9, 0xff4a10, .9); for (let i = 0; i < 18; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(.11, 0), coalM); c.position.set(-4.1 + (i % 6) * .28, .6, -4.95 + Math.floor(i / 6) * .32); c.rotation.set(i, i * 2, 0); scene.add(c); }
  const potM = M(0x7a3352, .8); for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .22, 4, 8), potM); p.rotation.z = Math.PI / 2; p.rotation.y = i * .4; p.position.set(-3.9 + i * .34, .68, -4.55); scene.add(p); }
  const coalLight = { intensity: 0 };
  const potSign = soft(textSprite("🍠 고구마 굽는 곳", { bg: "rgba(90,40,70,.9)", size: 24 })); potSign.position.set(-3.4, 1.7, -4.6); scene.add(potSign);

  // 매점: 식혜 · 맥반석 달걀
  scene.add(box(1.3, 1.05, 4.6, woodM, -8.1, .52, -1), box(1.5, .08, 4.8, M(0xd9b07a, .6), -8.05, 1.08, -1));
  const cooler = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.2, 1), new THREE.MeshStandardMaterial({ color: 0xe8f6ff, roughness: .1, transparent: true, opacity: .55 })); cooler.position.set(-8.2, 1.72, -2.6); scene.add(cooler);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .3, 10), M(0xf3e1b8, .4)); b.position.set(-8.35 + (i % 3) * .16, 1.38 + Math.floor(i / 3) * .4, -2.6); scene.add(b); }
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(.42, .32, .22, 18), M(0xa8743c, .9)); basket.position.set(-8.05, 1.23, -.6); scene.add(basket);
  const eggM = M(0xb98a5e, .6); for (let i = 0; i < 9; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 8), eggM); e.scale.set(1, 1.25, 1); const a = i / 9 * Math.PI * 2; e.position.set(-8.05 + Math.cos(a) * .22 * (i % 2 ? 1 : .4), 1.38, -.6 + Math.sin(a) * .22 * (i % 2 ? 1 : .4)); scene.add(e); }
  for (let i = 0; i < 4; i++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(.08, .065, .16, 10), M(0xf5e6c8, .5)); cup.position.set(-7.75, 1.2, .5 + i * .25); scene.add(cup); }
  const shopSign = soft(textSprite("🥤 식혜 · 🥚 맥반석 달걀", { bg: "rgba(60,110,70,.92)", size: 24 })); shopSign.position.set(-7.6, 2.75, -1); scene.add(shopSign);

  // 🧊 얼음방 문 (오른쪽 벽)
  const iceTex = tex((x, s) => { const g = x.createLinearGradient(0, 0, 0, s); g.addColorStop(0, "#dff6ff"); g.addColorStop(1, "#8fd3f4"); x.fillStyle = g; x.fillRect(0, 0, s, s); x.strokeStyle = "rgba(255,255,255,.8)"; x.lineWidth = 4; for (let i = 0; i < 14; i++) { const cx = Math.random() * s, cy = Math.random() * s, r = 10 + Math.random() * 18; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.stroke(); } } }, 256);
  // 🧊 실제로 들어가는 얼음방 (x 8.8 ~ 13.5, z -1.2 ~ 3.2)
  const iceFloor = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 4.4), new THREE.MeshStandardMaterial({ map: iceTex, color: 0xcfefff, roughness: .15, metalness: .1 })); iceFloor.rotation.x = -Math.PI / 2; iceFloor.position.set(11.15, .01, 1); scene.add(iceFloor);
  const iceWallM = new THREE.MeshStandardMaterial({ map: iceTex, color: 0xbfe8ff, emissive: 0x6fb8e8, emissiveIntensity: .35, roughness: .1, transparent: true, opacity: .55 });
  scene.add(box(.25, 3.2, 4.4, iceWallM, 13.5, 1.6, 1), box(4.7, 3.2, .25, iceWallM, 11.15, 1.6, -1.2), box(4.7, 3.2, .25, iceWallM, 11.15, 1.6, 3.2));
  const iceRoof = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 4.4), new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: .25, side: THREE.DoubleSide })); iceRoof.rotation.x = Math.PI / 2; iceRoof.position.set(11.15, 3.2, 1); scene.add(iceRoof);
  const benchM = new THREE.MeshStandardMaterial({ color: 0xe8f8ff, emissive: 0x9fdcff, emissiveIntensity: .3, roughness: .1, transparent: true, opacity: .85 });
  scene.add(box(.7, .45, 2.8, benchM, 12.8, .22, 1));
  for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.06, .3 + (i % 3) * .12, 6), benchM); c.rotation.x = Math.PI; c.position.set(9.4 + i * .6, 3.05, i % 2 ? -1 : 3); scene.add(c); }
  for (const [x, z] of [[9.6, -.8], [13.1, 2.8], [13.1, -.8]]) { const b = box(.5, .5, .5, benchM, x, .25, z); b.rotation.y = x; scene.add(b); }
  const iceLight = new THREE.PointLight(0x9fdcff, 2.2, 7, 1.5); iceLight.position.set(11.2, 2.6, 1); scene.add(iceLight);
  scene.add(box(.2, .2, 2.6, woodM, 8.8, 2.95, 1)); for (const dz of [-1.2, 1.2]) scene.add(box(.2, 3, .2, woodM, 8.8, 1.5, 1 + dz));
  
  const iceSign = soft(textSprite("🧊 얼음방 4℃", { bg: "rgba(40,120,180,.92)", size: 26 })); iceSign.position.set(8.2, 3.5, 1); scene.add(iceSign);

  // TV (오른쪽 앞 벽)
  // 📺 TV: 채널이 8초마다 바뀌어요 (가끔 광고)
  const tvC = document.createElement("canvas"); tvC.width = 640; tvC.height = 384; const tx = tvC.getContext("2d")!; const tvTex = new THREE.CanvasTexture(tvC); tvTex.colorSpace = THREE.SRGBColorSpace;
  const CH: { bg: [string, string]; t: string; s: string; e: string; ad?: boolean }[] = [
    { bg: ["#3a6ea5", "#f2a65a"], t: "주말 드라마 재방송", s: "CH 7 · 오후 3시", e: "📺" },
    { bg: ["#c2412d", "#f5b042"], t: "나이트 끝나고 보는 먹방", s: "CH 11 · 국밥 한 그릇", e: "🍲" },
    { bg: ["#1f5e3c", "#8fd3a8"], t: "칼퇴의 정석", s: "CH 3 · 오늘은 6시 땡", e: "🏃" },
    { bg: ["#ffffff", "#e8f3fb"], t: "동탄 대방튼튼재활의학과", s: "메디화이트웹 제휴 광고", e: "🏥", ad: true },
    { bg: ["#4b3b8f", "#e58bb0"], t: "오늘의 운세 · 당직 편", s: "CH 9 · 조용한 밤이 될 거예요", e: "🔮" },
  ];
  const drawTv = (k: number) => { const c = CH[k % CH.length], W = 640, Hh = 384; 
    const g = tx.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, c.bg[0]); g.addColorStop(1, c.bg[1]); tx.fillStyle = g; tx.fillRect(0, 0, W, Hh);
    const ink = c.ad ? "#1E2A26" : "#fff"; tx.fillStyle = ink; tx.textBaseline = "alphabetic"; tx.font = "120px sans-serif"; tx.fillText(c.e, 40, 170);
    tx.font = `800 ${c.t.length > 11 ? 40 : 48}px sans-serif`; tx.fillText(c.t, 40, 250, 560); tx.font = "500 30px sans-serif"; tx.globalAlpha = .85; tx.fillText(c.s, 40, 300, 560); tx.globalAlpha = 1;
    if (c.ad) { tx.fillStyle = "#E2712B"; tx.beginPath(); (tx as any).roundRect ? (tx as any).roundRect(W - 120, 28, 88, 44, 10) : tx.rect(W - 120, 28, 88, 44); tx.fill(); tx.fillStyle = "#fff"; tx.font = "800 28px sans-serif"; tx.fillText("AD", W - 96, 61); }
    else { tx.fillStyle = "rgba(0,0,0,.35)"; tx.fillRect(W - 140, 28, 108, 40); tx.fillStyle = "#fff"; tx.font = "700 24px sans-serif"; tx.fillText("● LIVE", W - 130, 56); }
    tvTex.needsUpdate = true; };
  let tvK = 0, tvT = 0; drawTv(0);
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.56), new THREE.MeshStandardMaterial({ map: tvTex, emissive: 0xffffff, emissiveMap: tvTex, emissiveIntensity: .55 }));
  tv.position.set(8.82, 2.6, -5.4); tv.rotation.y = -Math.PI / 2; scene.add(tv, box(.12, 1.7, 2.8, M(0x1a1a1a, .4), 8.88, 2.6, -5.4));
  const tvLight = new THREE.PointLight(0x9fc8ff, .8, 5, 2); tvLight.position.set(7.8, 2.4, -5.4); scene.add(tvLight);
  const tvTick = (dt: number) => { tvT += dt; if (tvT > 16) { tvT = 0; tvK = (tvK + 1) % CH.length; drawTv(tvK); tvLight.color.set(CH[tvK].ad ? 0xffffff : 0x9fc8ff); } }; // 16초마다 바로 다음 채널

  // 🍽 동료들 옆 소반: 살얼음 식혜 · 맥반석 달걀 바구니 · 군고구마
  const sobanM = M(0x9a6236, .7), legM = M(0x6b3f22, .8);
  for (const [x, z] of [[-1.75, -1.9], [1.75, -1.9], [5.4, -5.4]]) {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .05, 20), sobanM); top.position.set(x, .2, z); scene.add(top);
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .7; scene.add(box(.05, .18, .05, legM, x + Math.cos(a) * .24, .09, z + Math.sin(a) * .24)); }
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(.07, .055, .14, 12), M(0xf5e6c8, .4)); cup.position.set(x - .14, .29, z - .06); scene.add(cup);
    const bsk = new THREE.Mesh(new THREE.CylinderGeometry(.11, .08, .07, 12), M(0xa8743c, .9)); bsk.position.set(x + .1, .26, z - .1); scene.add(bsk);
    for (let e = 0; e < 3; e++) { const egg = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), M(0xb98a5e, .6)); egg.scale.set(1, 1.25, 1); egg.position.set(x + .07 + e * .04, .31, z - .1 + (e % 2) * .04); scene.add(egg); }
    const pot = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .14, 4, 8), M(0x7a3352, .8)); pot.rotation.z = Math.PI / 2; pot.position.set(x + .02, .26, z + .14); scene.add(pot);
  }
  // 방석(앉는 곳) + 매트·목침(눕는 곳)
  const matCols = [0xe9b44c, 0xe58b4e, 0xd8a25a, 0xef9f6a], pillow = M(0x8a5a32, .8), cush = [M(0xc0563a, .95), M(0xd88a3a, .95)];
  SAUNA_SEATS.forEach((st, i) => { const c = box(.85, .1, .85, cush[i % 2], st.x, .05, st.z); c.rotation.y = st.ry; c.castShadow = false; scene.add(c); });
  SAUNA_BEDS.forEach((st, i) => { const hx = -Math.sin(st.ry), hz = -Math.cos(st.ry); const mt = box(1.15, .05, 2.3, M(matCols[i % matCols.length], .95), st.x + hx * .95, .025, st.z + hz * .95); mt.rotation.y = st.ry; mt.castShadow = false; const pl = box(.5, .16, .24, pillow, st.x + hx * 1.85, .08, st.z + hz * 1.85); pl.rotation.y = st.ry; scene.add(mt, pl); });
  const lieSign = soft(textSprite("🛌 누워서 쉬는 곳", { bg: "rgba(120,70,30,.85)", size: 22 })); lieSign.position.set(-6.4, 1.5, 5.8); const lieSign2 = soft(textSprite("🛌 누워서 쉬는 곳", { bg: "rgba(120,70,30,.85)", size: 22 })); lieSign2.position.set(6.4, 1.5, 6.2); scene.add(lieSign2); scene.add(lieSign);
  const tvSign = soft(textSprite("📺 TV 보는 곳", { bg: "rgba(40,60,110,.85)", size: 22 })); tvSign.position.set(5.4, 1.5, -5.4); scene.add(tvSign);

  // 천장 등 + 김(수증기)
  { const l = new THREE.PointLight(0xffc888, 1.2, 16, 1.4); l.position.set(0, 4, 3); scene.add(l); } // 천장 등은 하나만 (폰 성능)
  const N = 160, sg = new THREE.BufferGeometry(), sp = new Float32Array(N * 3), sv = new Float32Array(N);
  const reset = (i: number, y0 = Math.random() * 3) => { const a = Math.random() * Math.PI * 2, r = Math.random() * 3.2; sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = y0; sp[i * 3 + 2] = -5 + Math.sin(a) * r * .8; sv[i] = .25 + Math.random() * .4; };
  for (let i = 0; i < N; i++) reset(i); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: .7, map: puff(), transparent: true, opacity: .16, depthWrite: false })));

  const fire: Fire = { pts: flame.pts, light: flame.light, update: (dt: number) => { flame.update(dt); tvTick(dt); for (let i = 0; i < N; i++) { sp[i * 3 + 1] += sv[i] * dt; sp[i * 3] += Math.sin(sp[i * 3 + 1] * 2 + i) * dt * .1; if (sp[i * 3 + 1] > 4.2) reset(i, 0); } sg.attributes.position.needsUpdate = true; coalLight.intensity = 1 + Math.sin(performance.now() / 180) * .25; } };
  return { fire, camBase: new THREE.Vector3(0, 0, 1) };
}
