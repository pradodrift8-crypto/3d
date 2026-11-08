// "El que echaba agua en la arena": one three.js world posed per frame (pure function of shot id + frame).
// Three places far apart: the desert procession at the origin (colossus on a sledge, 172 haulers on four ropes,
// the water pourer on the sledge front, the overseer with the whip), a beach with two sandcastles, and a tomb wall
// with the painting. Built with the template's pieces: painted sky by elevation, two-tone world materials, lit
// character cards with contact blobs, world ink, drifting motes.
import * as THREE from "three";
import { Pen, bodyFront, Outfit, Expr, SKINS, fxContact, ellPts, INK } from "./toon";
import { Pool, Actor, Fx, Stage, tier, light2D } from "./troop";
import { NOINK } from "./ink";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "./lights";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { cloudHD, rep, ctex, rng } from "./paint";
import { FPS, SHOTS, BEACH, TOMB, V3, camAt, smooth, worldF, procZ, stuck, kneel, whipK, wetK, crumble } from "./story";

// ---------------- light: warm desert afternoon, warm torch light in the tomb ----------------
const DESERT: LightPreset = { ...LIGHTS.day, el: 34, lit: [1.62, 1.42, 1.12], shade: [0.52, 0.42, 0.38], charTint: [1.0, 0.93, 0.84],
  fog: "#efd7aa", fogNear: 60, fogFar: 900, sunCol: "#ffe2b8", sky: "#f2dcb4", ground: "#c7a06a" };
const DLOOK: WorldLook = { ...LOOK.day, sky: { c: ["#f3dcae", "#e6d6b6", "#a9c3e0", "#6f9fdb", "#3f7fd2"], e: [0, 3, 9, 18, 40] }, sat: 1.0 };
const TOMBL: LightPreset = { ...LIGHTS.golden, el: 18, lit: [1.45, 1.05, 0.66], shade: [0.3, 0.2, 0.2], charTint: [1, 0.85, 0.65],
  fog: "#2a1a14", fogNear: 8, fogFar: 40 };
const TLOOK: WorldLook = { ...LOOK.golden, sky: { c: ["#2a1a14", "#2a1a14", "#2a1a14", "#2a1a14", "#2a1a14"], e: [0, 4, 10, 20, 40] }, sat: 1.0 };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lam = (p: THREE.MeshLambertMaterialParameters) => twoTone(new THREE.MeshLambertMaterial(p));
const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, parent: THREE.Object3D) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};

// ---------------- cast ----------------
const BROWN = ["#c98a5a", "#b97a4c", "#a86c42", "#d39a6a"];
const worker = (v: number): Outfit => ({ jacket: BROWN[v % 4], pants: "#f1ead8", boots: INK, skin: BROWN[v % 4], hat: "hair", hair: "#1c1512",
  bare: true, kilt: v % 5 === 3 ? "#e8dcc0" : "#f4efe2" });
const POURER: Outfit = { ...worker(1), kilt: "#f7f3ea" };
const OVERSEER: Outfit = { ...worker(2), build: "stout", kilt: "#f2e8cf", collar: "#2f6fae", sash: "#b8322f" };
const ROPES = [-1.65, -0.55, 0.55, 1.65], PER = 43, GAP = 0.85, Z0 = 6.2;
const HAULERS = ROPES.flatMap((x, r) => Array.from({ length: PER }, (_, j) => {
  const i = r * PER + j;
  return { i, x: x + (j % 2 ? 0.16 : -0.16) + (hh(i, 1) - 0.5) * 0.08, z: Z0 + j * GAP + (r % 2) * 0.4 + (hh(i, 2) - 0.5) * 0.12, v: (i * 7 + (i >> 3)) % 12 };
}));
const POUR_AT = { x: -0.15, z: 3.95 }, BOSS_AT = { x: 2.35, z: 3.6 };

// ---------------- painted bits ----------------
const sandTex = () => ctex("sandHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#e2bd82"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 26; i++) { // broad soft tone patches
    const x = r() * 1024, y = r() * 1024, rad = 100 + r() * 220, gr = g.createRadialGradient(x, y, 0, x, y, rad), c = r() < 0.5 ? "240,210,150" : "196,150,96";
    gr.addColorStop(0, `rgba(${c},0.35)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr;
    for (const ox of [-1024, 0, 1024]) for (const oy of [-1024, 0, 1024]) { g.save(); g.translate(ox, oy); g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad); g.restore(); }
  }
  g.lineCap = "round";
  for (let i = 0; i < 70; i++) { // wind ripples: soft wavy lines, light lip over a darker trough
    const y0 = r() * 1024, x0 = r() * 1024, len = 160 + r() * 320, amp = 6 + r() * 8;
    for (const [dy, col] of [[0, "rgba(160,112,62,0.30)"], [-3, "rgba(255,236,196,0.45)"]] as const) {
      g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath();
      for (let k = 0; k <= 20; k++) { const x = x0 + (len * k) / 20, y = y0 + dy + amp * Math.sin(k * 0.6 + x0); if (k) g.lineTo(x % 1024, y); else g.moveTo(x % 1024, y); }
      g.stroke();
    }
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.6 ? "rgba(150,104,60,0.45)" : "rgba(255,240,210,0.6)"; g.beginPath(); g.arc(r() * 1024, r() * 1024, 1 + r() * 2, 0, 6.3); g.fill(); }
});
const wetDraw = (p: Pen) => { // wet sand as a MULTIPLY blob (white = no change), 256 x 256, soft edged
  const g = p.g; g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 256);
  for (const [x, y, rr, a] of [[128, 128, 118, 1], [100, 140, 70, 0.5], [160, 112, 80, 0.5]] as const) {
    const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(176,128,96,${a})`); gr.addColorStop(0.75, `rgba(176,128,96,${a * 0.85})`); gr.addColorStop(1, "rgba(176,128,96,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
};
const streamDraw = (k: number) => (p: Pen) => { // falling water, 64 x 512, wobble phase k
  const g = p.g, pts: [number, number][] = [];
  for (let i = 0; i <= 20; i++) { const y = (i / 20) * 500; pts.push([32 + 5 * Math.sin(i * 0.9 + k * 6.3) * (i / 20), y]); }
  p.stroke(pts, 20, "#2f6fae"); p.stroke(pts, 13, "#6fb7ea"); p.stroke(pts.map(([x, y]) => [x - 3, y] as [number, number]), 4, "#e4f6ff");
  g.fillStyle = "#9fd6f5"; for (let j = 0; j < 6; j++) { g.beginPath(); g.arc(32 + Math.sin(j * 2.1 + k * 9) * 22, 470 + Math.cos(j * 1.7) * 18, 6, 0, 6.3); g.fill(); }
};
const puffDraw = (p: Pen) => { for (const [x, y, r] of [[128, 160, 70], [80, 150, 46], [176, 148, 52], [120, 108, 50], [160, 112, 38]] as const) p.ell(x, y, r, r * 0.86, "#efd6a6", 5); for (const [x, y, r] of [[118, 100, 18], [168, 110, 14]] as const) p.ell(x, y, r, r * 0.8, "#fff1d4", 0); };
const flameDraw = (v: number) => (p: Pen) => {
  const j = [0, 1, 2].map((k) => Math.sin(v * 2.1 + k * 1.7) * 0.18), cx = 64, by = 240;
  p.poly([[cx - 26, by], [cx - 30, by - 50], [cx - 8, by - (110 + 30 * j[0])], [cx + 6, by - 60], [cx + 18, by - (95 + 30 * j[1])], [cx + 30, by - 40], [cx + 26, by]], "#ff8a1a", 0);
  p.poly([[cx - 14, by], [cx - 14, by - 40], [cx, by - (75 + 25 * j[2])], [cx + 14, by - 38], [cx + 14, by]], "#ffe07a", 0);
};
/** stone face of the colossus, drawn on a transparent card glued to the front of the head */
const statueFace = () => ctex("statueFace", 256, 256, (g) => {
  const p = new Pen(g), c = "#5a4430";
  for (const s of [-1, 1]) { p.poly(ellPts(128 + s * 42, 112, 22, 9), "#f2e6cc", 4); p.dot(128 + s * 42, 112, 7, c); p.stroke([[128 + s * 20, 88], [128 + s * 66, 86]], 7, c); }
  p.stroke([[128, 112], [120, 160], [136, 162]], 5, c);
  p.stroke([[100, 186], [128, 192], [156, 186]], 6, c);
  p.poly([[116, 208], [140, 208], [136, 254], [120, 254]], "#c9ad7a", 4); // false beard
});

// ---------------- the tomb painting (Middle Kingdom style: flat colour, dark outline, registers) ----------------
const PW = 4096, PH = 1024, WALL_W = 24, WALL_H = 6; // canvas px for 24 x 6 m
const px = (wx: number) => ((wx + WALL_W / 2) / WALL_W) * PW, py = (wy: number) => PH - (wy / WALL_H) * PH;
const egyptFig = (g: CanvasRenderingContext2D, x: number, foot: number, s: number, opts: { pour?: boolean; skin?: string }) => {
  // profile figure facing left: legs striding, white kilt, bare torso, black wig, arms forward
  const skin = opts.skin ?? "#a85a32", ink = "#2a1a12";
  const L = (pts: number[][], fill: string | null, w = 3) => { g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(x + a * s, foot + b * s) : g.moveTo(x + a * s, foot + b * s))); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } g.lineWidth = w; g.strokeStyle = ink; g.stroke(); };
  L([[-14, 0], [-30, -2], [-10, -60], [-2, -60]], skin); L([[16, 0], [30, -2], [8, -60], [0, -60]], skin); // legs
  L([[-16, -56], [18, -56], [10, -96], [-12, -96]], "#f4efe2"); // kilt
  L([[-12, -96], [10, -96], [12, -150], [-14, -150]], skin); // torso
  if (opts.pour) { L([[-12, -140], [-40, -128], [-46, -138], [-14, -152]], skin); L([[-60, -150], [-36, -154], [-34, -126], [-58, -120]], "#c46a3c"); // jar tipped
    g.strokeStyle = "#3f86c8"; g.lineWidth = 7 * s; g.beginPath(); g.moveTo(x - 58 * s, foot - 128 * s); g.quadraticCurveTo(x - 72 * s, foot - 60 * s, x - 70 * s, foot + 30 * s); g.stroke(); }
  else { L([[-12, -142], [-48, -126], [-48, -118], [-12, -132]], skin); L([[-10, -136], [-44, -112], [-44, -104], [-8, -126]], skin); }
  g.beginPath(); g.ellipse(x - 2 * s, foot - 172 * s, 17 * s, 21 * s, 0, 0, 6.3); g.fillStyle = skin; g.fill(); g.lineWidth = 3; g.strokeStyle = ink; g.stroke();
  g.beginPath(); g.ellipse(x + 4 * s, foot - 178 * s, 17 * s, 19 * s, 0, 0, 6.3); g.fillStyle = "#1c1410"; g.fill(); // wig
  g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x - 12 * s, foot - 174 * s, 5 * s, 3 * s, 0, 0, 6.3); g.fill(); g.fillStyle = ink; g.beginPath(); g.arc(x - 13 * s, foot - 174 * s, 2 * s, 0, 6.3); g.fill();
};
const paintingTex = () => ctex("tombPainting", PW, PH, (g, r) => {
  g.fillStyle = "#e9d6ae"; g.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 160; i++) { const x = r() * PW, y = r() * PH, rr = 30 + r() * 120, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(150,110,60,0.12)"); gr.addColorStop(1, "rgba(150,110,60,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
  // border bands
  for (const [y0, h, c] of [[py(0.45), 22, "#2f6fae"], [py(0.45) - 22, 14, "#b8322f"], [py(5.1), 22, "#2f6fae"], [py(5.1) + 22, 14, "#e8c45a"]] as const) { g.fillStyle = c; g.fillRect(0, y0, PW, h); }
  // hieroglyph columns in the top register
  g.strokeStyle = "#2a1a12"; g.lineWidth = 3;
  for (let x = 40; x < PW; x += 70) { g.beginPath(); g.moveTo(x, py(5.05)); g.lineTo(x, py(4.15)); g.stroke();
    for (let k = 0; k < 4; k++) { const y = py(5.0) + k * 52, t = Math.floor(r() * 4); g.fillStyle = ["#2a1a12", "#2f6fae", "#b8322f", "#3f8a5a"][t];
      if (t === 0) { g.beginPath(); g.ellipse(x + 35, y + 22, 16, 10, 0, 0, 6.3); g.fill(); } else if (t === 1) g.fillRect(x + 20, y + 10, 30, 22);
      else { g.beginPath(); g.moveTo(x + 18, y + 36); g.lineTo(x + 35, y + 6); g.lineTo(x + 52, y + 36); g.closePath(); g.fill(); } } }
  // the colossus on its sledge (facing left), the pourer on the sledge front, the haulers on four ropes
  const foot = py(0.75), sx0 = px(2.6), sx1 = px(7.6);
  g.fillStyle = "#8a5a34"; g.fillRect(sx0, foot - 26, sx1 - sx0, 26); g.strokeStyle = "#2a1a12"; g.lineWidth = 4; g.strokeRect(sx0, foot - 26, sx1 - sx0, 26);
  g.beginPath(); g.moveTo(sx0, foot - 26); g.quadraticCurveTo(sx0 - 50, foot - 30, sx0 - 40, foot - 70); g.stroke();
  const st = (pts: number[][], fill: string) => { g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fillStyle = fill; g.fill(); g.lineWidth = 4; g.strokeStyle = "#2a1a12"; g.stroke(); };
  const S = "#d7bf8e", X = px(5.6);
  st([[X + 140, foot - 26], [X + 260, foot - 26], [X + 260, foot - 420], [X + 140, foot - 420]], "#b8322f"); // throne back
  st([[X - 120, foot - 26], [X + 150, foot - 26], [X + 150, foot - 200], [X - 120, foot - 200]], S); // lap + shins
  st([[X - 120, foot - 26], [X - 70, foot - 26], [X - 70, foot - 200], [X - 120, foot - 200]], S);
  st([[X + 20, foot - 200], [X + 150, foot - 200], [X + 140, foot - 470], [X + 30, foot - 470]], S); // torso
  st([[X - 20, foot - 300], [X + 60, foot - 260], [X + 50, foot - 220], [X - 30, foot - 240]], S); // arm
  g.beginPath(); g.ellipse(X + 80, foot - 530, 62, 72, 0, 0, 6.3); g.fillStyle = S; g.fill(); g.stroke();
  st([[X + 40, foot - 590], [X + 170, foot - 600], [X + 190, foot - 430], [X + 120, foot - 460]], "#2f6fae"); // headcloth
  g.fillStyle = "#2a1a12"; g.beginPath(); g.ellipse(X + 50, foot - 540, 10, 6, 0, 0, 6.3); g.fill();
  egyptFig(g, px(3.4) + 30, foot - 26, 1.6, { pour: true }); // the water pourer, where the camera stops
  for (let rr = 0; rr < 4; rr++) {
    const y = foot - 26 + rr * 0, ry = foot - 150 * 1.1 - rr * 40;
    g.strokeStyle = "#8a6a3a"; g.lineWidth = 6; g.beginPath(); g.moveTo(sx0 - 40, foot - 60 - rr * 14); g.lineTo(px(-11.5), ry + 40); g.stroke();
    for (let k = 0; k < 18; k++) egyptFig(g, px(1.6) - k * 108 - rr * 26, y - rr * 40, 1.1 - rr * 0.04, { skin: ["#a85a32", "#9a4e2a", "#b2643a"][(k + rr) % 3] });
  }
  // the overseer behind them, stick raised
  egyptFig(g, px(-9.5), foot - 26, 1.3, { skin: "#8f4a28" });
  g.strokeStyle = "#2a1a12"; g.lineWidth = 6; g.beginPath(); g.moveTo(px(-9.5) - 40, foot - 26 - 200); g.lineTo(px(-9.5) - 90, foot - 26 - 330); g.stroke();
  // age: cracks and flaked patches
  g.strokeStyle = "rgba(90,60,30,0.5)"; g.lineWidth = 2;
  for (let i = 0; i < 40; i++) { let x = r() * PW, y = r() * PH; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += r() * 40; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 18; i++) { g.fillStyle = "rgba(205,180,140,0.85)"; g.beginPath(); g.ellipse(r() * PW, r() * PH, 20 + r() * 60, 10 + r() * 30, r() * 3, 0, 6.3); g.fill(); }
});

// ---------------- motes: dust drifting in the light (the embers system of the battle, recoloured) ----------------
const MOTE = { n: 4500, b: 30, h: 7 };
const MOTE_VS = `
attribute vec4 aSeed; uniform float uT; uniform vec3 uCam; uniform float uPx; varying float vA;
void main() {
  float B = ${MOTE.b.toFixed(1)}, H = ${MOTE.h.toFixed(1)};
  vec3 p = position;
  p.y = mod(p.y + uT * (0.08 + 0.2 * aSeed.x), H);
  p.x += sin(uT * (0.4 + aSeed.y) + aSeed.z * 30.0) * 0.5 + uT * 0.6;
  p.z += cos(uT * (0.3 + aSeed.z) + aSeed.w * 30.0) * 0.4;
  p.xz = uCam.xz + mod(p.xz - uCam.xz + 0.5 * B, B) - 0.5 * B;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = clamp(mix(0.02, 0.045, aSeed.y) * uPx / max(0.1, -mv.z), 1.5, 40.0);
  float life = p.y / H;
  vA = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.7, 1.0, life)) * smoothstep(0.4, 1.2, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const MOTE_FS = `
uniform float uFade; varying float vA;
void main() { vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; if (r > 1.0) discard;
  gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * exp(-r * r * 3.0) * vA * uFade * 0.9, 1.0); }`;

// ---------------- world ----------------
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#efd7aa", 60, 900);
  private clouds: THREE.Mesh[] = [];
  private proc = new THREE.Group(); private sledge = new THREE.Group();
  private mounds: THREE.Mesh[] = [];
  private dry = new THREE.Group(); private dryMound: THREE.Mesh;
  private motes = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uPx: { value: 1000 }, uFade: { value: 1 } };
  private sunCache = new Map<number, THREE.Vector3>();
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v = new THREE.Vector3();

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k));
    for (const [cx, cz] of [[0, 0], [BEACH[0], 0]]) for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + hh(i, 20), d = 700 + hh(i, 21) * 500, w = 140 + hh(i, 23) * 120;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[i % 4], transparent: true, depthWrite: false, fog: false }));
      m.position.set(cx + Math.cos(a) * d, 90 + hh(i, 22) * 160, cz + Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }

    // ---- desert floor, dunes, far pyramids ----
    const sandM = lam({ map: rep(sandTex(), 1500, 1500) });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), sandM); ground.receiveShadow = true; R.add(ground);
    const duneM = lam({ map: rep(sandTex(), 40, 12), color: "#f4dcb0" });
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2 + hh(k, 7) * 0.2, d = 260 + hh(k, 8) * 260;
      const h = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), duneM);
      h.position.set(Math.cos(a) * d, -1, Math.sin(a) * d); h.scale.set(90 + hh(k, 9) * 90, 10 + hh(k, 10) * 16, 50 + hh(k, 11) * 40); h.receiveShadow = true; R.add(h);
    }
    const pyrM = lam({ color: "#e6c891" });
    for (const [x, z, s] of [[-380, -900, 140], [-150, -1050, 110], [120, -980, 80]]) {
      const g = new THREE.ConeGeometry(s * 0.78, s, 4); g.rotateY(Math.PI / 4);
      const m = new THREE.Mesh(g, pyrM); m.position.set(x, s / 2 - 2, z); R.add(m);
    }

    // ---- the procession: sledge + colossus + ropes (moves along +z) ----
    const nemesM = lam({ map: ctex("nemes", 64, 256, (g) => { for (let k = 0; k < 16; k++) { g.fillStyle = k % 2 ? "#e8c45a" : "#2f5fae"; g.fillRect(0, k * 16, 64, 16); } }) });
    const wood = lam({ color: "#8a5a34" }), woodD = lam({ color: "#6e4426" }), stone = lam({ color: "#dcb47c" }), stoneD = lam({ color: "#c99d66" }), blue = lam({ color: "#3b6fa8" });
    R.add(this.proc); this.proc.add(this.sledge);
    const S = this.sledge;
    for (const x of [-1.15, 1.15]) {
      box(0.34, 0.32, 6.2, x, 0.16, 0, wood, S);
      const tip = box(0.34, 0.32, 0.9, x, 0.42, 3.25, wood, S); tip.rotation.x = -0.75; // curled front
    }
    for (let k = 0; k < 6; k++) box(2.9, 0.18, 0.32, 0, 0.41, -2.6 + k * 1.05, woodD, S);
    box(2.8, 0.12, 5.6, 0, 0.56, -0.2, wood, S); // deck
    box(2.6, 0.5, 4.0, 0, 0.87, -0.8, stoneD, S); // plinth
    box(2.4, 3.4, 1.3, 0, 2.82, -2.1, stone, S); // throne back
    box(2.2, 1.0, 2.9, 0, 1.62, -0.75, stone, S); // seat block + thighs
    box(1.7, 1.4, 0.9, 0, 1.82, 0.85, stone, S); // shins
    for (const x of [-0.45, 0.45]) box(0.62, 0.22, 0.95, x, 1.23, 1.35, stoneD, S); // feet
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 2.0, 20), stone); torso.scale.set(1, 1, 0.62); torso.position.set(0, 3.12, -1.0); torso.castShadow = true; S.add(torso);
    for (const x of [-0.82, 0.82]) { box(0.36, 1.5, 0.42, x, 2.85, -0.95, stone, S); box(0.36, 0.28, 1.25, x, 2.25, -0.25, stone, S); } // arms on the knees
    const kilt = box(1.9, 0.08, 1.7, 0, 2.16, -0.55, stoneD, S); kilt.castShadow = false;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), stone); head.scale.set(1, 1.12, 1); head.position.set(0, 4.75, -0.95); head.castShadow = true; S.add(head);
    const nemes = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 1.05, 1.35, 4, 1), nemesM); nemes.rotation.y = Math.PI / 4; nemes.scale.set(1, 1, 0.7); nemes.position.set(0, 4.9, -1.2); nemes.castShadow = true; S.add(nemes);
    for (const x of [-0.68, 0.68]) box(0.36, 1.15, 0.2, x, 4.1, -0.72, nemesM, S); // lappets
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: statueFace(), transparent: true, alphaTest: 0.3, color: "#c9b089" }));
    face.position.set(0, 4.72, -0.34); face.scale.setScalar(1.15); face.layers.set(NOINK); S.add(face);
    // ropes: from the sledge front to past the last hauler, at hand height
    const ropeM = lam({ color: "#b8925a" });
    for (const x of ROPES) {
      const pts = [V(x * 0.55, 0.62, 3.3), V(x, 1.15, Z0 - 0.4), V(x, 1.18, Z0 + PER * GAP + 1)];
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 6), ropeM); tube.castShadow = true; this.proc.add(tube);
    }
    const moundM = lam({ map: rep(sandTex(), 1, 1), color: "#f0d7a8" });
    for (const x of [-1.15, 1.15]) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), moundM); m.position.set(x, 0, 3.55); m.receiveShadow = true; this.mounds.push(m); this.proc.add(m); }

    // ---- beach: sea, two sandcastles (left dry and pale, right wet and dark) ----
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1200, 800).rotateX(-Math.PI / 2), lam({ color: "#2f8fc8" })); sea.position.set(BEACH[0], 0.03, BEACH[2] - 403.5); R.add(sea);
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(1200, 0.6).rotateX(-Math.PI / 2), lam({ color: "#f4fbff" })); foam.position.set(BEACH[0], 0.035, BEACH[2] - 3.7); R.add(foam);
    const wetBeach = new THREE.Mesh(new THREE.PlaneGeometry(1200, 2.5).rotateX(-Math.PI / 2), lam({ map: rep(sandTex(), 300, 1), color: "#b48a58" })); wetBeach.position.set(BEACH[0], 0.02, BEACH[2] - 2.3); R.add(wetBeach);
    const castle = (col: string, parent: THREE.Group) => {
      const m = lam({ map: rep(sandTex(), 1, 1), color: col });
      const add = (g: THREE.BufferGeometry, x: number, y: number, z: number) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); };
      add(new THREE.BoxGeometry(0.62, 0.22, 0.5), 0, 0.11, 0);
      for (const [x, z] of [[-0.27, -0.2], [0.27, -0.2], [-0.27, 0.2], [0.27, 0.2]]) { add(new THREE.CylinderGeometry(0.1, 0.12, 0.38, 14), x, 0.19, z); add(new THREE.ConeGeometry(0.11, 0.14, 14), x, 0.45, z); }
      add(new THREE.CylinderGeometry(0.14, 0.17, 0.5, 16), 0, 0.47, 0); add(new THREE.ConeGeometry(0.16, 0.2, 16), 0, 0.82, 0);
    };
    castle("#fff1cf", this.dry); this.dry.position.set(BEACH[0] - 0.38, 0, BEACH[2]); R.add(this.dry);
    const wet = new THREE.Group(); castle("#a7835a", wet); wet.position.set(BEACH[0] + 0.38, 0, BEACH[2]); R.add(wet);
    this.dryMound = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam({ map: rep(sandTex(), 1, 1), color: "#fff1cf" }));
    this.dryMound.position.set(BEACH[0] - 0.38, 0, BEACH[2]); this.dryMound.receiveShadow = true; R.add(this.dryMound);
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.2, 16), lam({ color: "#e2453c" })); bucket.position.set(BEACH[0] + 0.95, 0.1, BEACH[2] + 0.35); bucket.castShadow = true; R.add(bucket);

    // ---- tomb: painted wall, stone floor, side pillars ----
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, WALL_H), lam({ map: paintingTex() }));
    wall.position.set(TOMB[0], WALL_H / 2, TOMB[2] - 3); wall.receiveShadow = true; R.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 12).rotateX(-Math.PI / 2), lam({ color: "#8a6a4a" })); floor.position.set(TOMB[0], 0.01, TOMB[2] + 2); floor.receiveShadow = true; R.add(floor);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial({ color: "#1a100c" })); back.position.set(TOMB[0], 7, TOMB[2] - 3.05); R.add(back);

    // ---- dust motes ----
    {
      const N = MOTE.n, pos = new Float32Array(N * 3), sd = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) { pos.set([hh(i, 90) * MOTE.b, hh(i, 91) * MOTE.h, hh(i, 92) * MOTE.b], i * 3); sd.set([hh(i, 93), hh(i, 94), hh(i, 95), hh(i, 96)], i * 4); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("aSeed", new THREE.BufferAttribute(sd, 4));
      const mat = new THREE.ShaderMaterial({ uniforms: this.motes, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: MOTE_VS, fragmentShader: MOTE_FS });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.layers.set(NOINK); pts.renderOrder = 5;
      const u = this.motes.uPx;
      pts.onBeforeRender = (r, _s, c) => { const rt = r.getRenderTarget(), h = rt ? rt.height : r.domElement.height; u.value = h / (2 * Math.tan(THREE.MathUtils.degToRad((c as THREE.PerspectiveCamera).fov) / 2)); };
      R.add(pts);
    }
  }

  /** camera-relative sun frozen per shot */
  private shotSun(id: number, el: number) {
    let v = this.sunCache.get(id);
    if (v) return v;
    const s = SHOTS[id - 1];
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) { const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.place === "tomb" ? 160 : id === 8 ? 120 : 70), e = THREE.MathUtils.degToRad(el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(e), Math.sin(e), hz * Math.cos(e)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const S = SHOTS[id - 1], tomb = S.place === "tomb", L = tomb ? TOMBL : DESERT, K = tomb ? TLOOK : DLOOK;
    const wf = worldF(f), t = wf / FPS, pz = procZ(wf), sk = stuck(wf);
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 5000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus), sunDir = this.shotSun(id, L.el);
    // light rig
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.3 + 8, 10, 60);
    this.sun.position.copy(focus).addScaledVector(sunDir, 200); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 500; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = 0.95;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) m.quaternion.copy(cam.quaternion);
    this.motes.uT.value = t; this.motes.uCam.value.copy(cam.position); this.motes.uFade.value = tomb ? 0.5 : 1;

    // procession pose: moves along +z, sinks a little and piles sand at the runners while stuck
    this.proc.position.z = pz;
    this.sledge.position.y = -0.1 * sk;
    this.mounds.forEach((m) => m.scale.set(0.38 * sk + 0.001, 0.22 * sk + 0.001, 0.3 * sk + 0.001));
    // the dry castle slumps into a mound
    const cr = crumble(f);
    this.dry.scale.set(1 + 0.25 * cr, Math.max(0.02, 1 - cr), 1 + 0.25 * cr); this.dry.rotation.z = 0.15 * cr; this.dry.visible = cr < 0.98;
    this.dryMound.scale.set(0.05 + 0.42 * cr, 0.02 + 0.18 * cr, 0.05 + 0.35 * cr);

    // ---- cast ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0), light = light2D(sunDir, right);
    const st: Stage = { places: [], fx: [] };
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const visible = (x: number, y: number, z: number, r: number) => this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y, z), r));
    const lidAt = (i: number) => { let s = Math.round(-60 * hh(i, 9)); for (let n = 0; s <= f && n < 80; n++) { const k = f - s; if (k >= 0 && k < 4) return [0.5, 1, 1, 0.5][k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); } return 0; };
    const blob = (x: number, y: number, z: number, sc2 = 1) => {
      const cc = "#5a4436";
      st.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x, y: y + 0.02, z, w: 0.6 * sc2, h: 0.45 * sc2, flat: true, rot: 0 });
    };
    const person = (who: string, o: Outfit, x: number, y: number, z: number, opts: Parameters<typeof bodyFront>[2], i: number, contact = true) => {
      if (!visible(x, y + 1.1, z, 2.2)) return;
      const d = cam.position.distanceTo(this.v.set(x, y + 1.2, z)), [w, h, k] = tier(d), near = d < 14;
      const o2 = { ...opts, light, seed: (i * 5 + 3) % 7 + 1, blink: near ? lidAt(i) : 0 };
      if (!near && o2.expr !== "shout") o2.expr = "neutral";
      st.places.push({ key: `${who}|${JSON.stringify(o2)}`, x, y, z, size: [w, h, k], draw: (p) => bodyFront(p, o, o2) });
      if (contact && d < 50) blob(x, y, z);
    };
    if (S.place === "desert") {
      const moving = sk < 0.5, wetGlide = wf > 760;
      for (const hm of HAULERS) {
        const kn = kneel(wf, hm.i);
        const ph = moving ? Math.round((((t * (wetGlide ? 0.95 : 0.45) + hh(hm.i, 4) * 0.2) % 1) * 8)) / 8 % 1 : 0;
        const ex: Expr = kn ? "nervous" : wetGlide ? (hm.i % 3 ? "grin" : "stern") : sk > 0.5 ? "nervous" : hm.i % 4 ? "stern" : "neutral";
        person(`w${hm.v}`, worker(hm.v), hm.x, 0, hm.z + pz, { mode: kn ? "sit" : moving ? "march" : "stand", phase: ph, lift: 30, pull: true, expr: ex, facing: 0 }, hm.i + 10);
      }
      // the water pourer on the sledge front, tipping his jar; the stream lands just in front of the runners
      const pour = 0.7 + 0.06 * Math.sin(t * 2.3), py0 = 0;
      const pex: Expr = id === 11 ? "smile_closed" : "neutral";
      person("pourer", POURER, POUR_AT.x, py0, POUR_AT.z + pz, { mode: "stand", expr: pex, prop: ["jar", pour], facing: 1, look: 0 }, 3, false);
      // wet sand: a patch under the stream that grows with "otro cántaro"; on the glide a wet strip ahead of the runners
      const wk = wetK(wf), patchZ = POUR_AT.z + 0.15 + procZ(372);
      st.fx.push({ key: "blob|wet", cw: 256, ch: 256, draw: wetDraw, x: POUR_AT.x + 0.35, y: 0.03, z: patchZ, w: 1.4 + 1.8 * wk, h: 1.1 + 1.4 * wk, flat: true, rot: 0 });
      if (wetGlide) for (let k = 1; k < 30; k++) st.fx.push({ key: "blob|wet", cw: 256, ch: 256, draw: wetDraw, x: (hh(k, 3) - 0.5) * 0.6, y: 0.03, z: patchZ + k * 0.9, w: 3.4, h: 1.7, flat: true, rot: hh(k, 4) });
      // the overseer: shouts, raises the whip (it stays up)
      const bex: Expr = id === 11 ? "shock" : id === 3 || id === 6 ? "shout" : "stern";
      person("boss", OVERSEER, BOSS_AT.x, 0, BOSS_AT.z + pz, { mode: "stand", expr: bex, prop: ["whip", Math.round(whipK(wf) * 30) / 30], facing: -1, look: -1 }, 4);
      // sand puffs where the runners dig in
      if (sk > 0.05 && sk < 0.95) for (const x of [-1.15, 1.15]) st.fx.push({ key: "puff", cw: 256, ch: 256, draw: puffDraw, x, y: 0.4, z: 3.8 + pz, w: 1.2 * sk, h: 1.2 * sk });
    } else if (S.place === "beach") {
      const cr2 = crumble(f);
      if (cr2 > 0.02 && cr2 < 0.99) st.fx.push({ key: "puff", cw: 256, ch: 256, draw: puffDraw, x: BEACH[0] - 0.38, y: 0.25, z: BEACH[2] + 0.1, w: 0.3 + 0.7 * Math.sin(Math.PI * cr2), h: 0.3 + 0.7 * Math.sin(Math.PI * cr2) });
    } else {
      for (let k = 0; k < 5; k++) { const v = (Math.floor(f / 2) + k) % 5; st.fx.push({ key: `flame|${v}`, cw: 128, ch: 256, draw: flameDraw(v), x: TOMB[0] - 10 + k * 5, y: 3.0, z: TOMB[2] - 2.85, w: 0.32, h: 0.64 }); }
    }

    let ai = 0;
    for (const p of st.places) {
      const a = this.actor(ai++), [w, h, k] = p.size, s = p.scale ?? 1;
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      a.mesh.scale.set(p.mirror ? -s : s, s, s);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    for (const p of st.fx) {
      if (!visible(p.x, p.y, p.z, Math.max(p.w, p.h))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft); e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.rotation.order = "YXZ"; e.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0); if (p.soft) e.mesh.quaternion.copy(cam.quaternion); }
      e.mesh.scale.set(p.w, p.h, 1);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (let i = 0; i < ai; i++) this.actors[i].bind();
    for (let i = 0; i < fi; i++) this.fxs[i].bind();
    return focus;
  }
}
export const SKIN_TONES = SKINS;
export const RNG = rng;
