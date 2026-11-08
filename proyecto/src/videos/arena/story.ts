// "El que echaba agua en la arena" (38.2 s), timed to public/voz/voz.wav (palabras.json, herramientas/alinear.py).
// Camera grammar of the reference: it never stops (slow push-ins on holds), glides are smootherstep, a change of
// place is a 6-frame crossfade; everything else cuts.
export const FPS = 30;
export const TOTAL = 1146;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };

// words (frames): Ciento 0 · toneladas 94 · desierto 120 · y él 139 · agua 171 · arena 186 · El capataz 206 · grita 226 ·
// ¿Vas 241 · desierto 264 · Él 286 · voltea 302 · Mójala 324 · más 341 · Pero 354 · atora 375 · Los hombres 393 ·
// rodillas 419 · y el capataz 440 · levanta 460 · látigo 475 · Así 496 · vacían 509 · cántaro 526 · trineo 552 ·
// Fíjate 569 · seca 605 · castillo 640 · desmorona 668 · Pero 690 · mojada 711 · sí 728 · El agua 743 · granos 771 ·
// firme 815 · trineo 836 · hundirse 856 · jalarlo 877 · mitad 906 · Hay 923 · pintura 936 · egipcia 949 · años 995 ·
// hombre 1032 · esto 1074 · Y 1091 · látigo 1099 · aire 1132

/** places: the desert procession sits at the origin, the beach and the tomb far away */
export const BEACH: V3 = [2000, 0, 0];
export const TOMB: V3 = [-2000, 0, 0];

type Key = { f: number; pos: V3; look: V3; fov: number; glide?: boolean };
/** rel: camera keys move with the procession (z offset procZ) */
export type ShotDef = { id: number; a: number; b: number; keys: Key[]; place: "desert" | "beach" | "tomb"; rel?: boolean; light: "day" | "golden" };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 139, place: "desert", rel: true, light: "day", keys: [ // low among the haulers, then up: the statue
    { f: 0, pos: [3.4, 1.25, 15], look: [0.4, 1.5, 8], fov: 44 },
    { f: 40, pos: [3.3, 1.3, 14.2], look: [0.3, 1.6, 7], fov: 44 },
    { f: 112, pos: [7.5, 4.6, 13.5], look: [0, 3.6, -0.3], fov: 46, glide: true },
    { f: 139, pos: [7.4, 4.75, 13], look: [0, 3.6, -0.3], fov: 45 },
  ] },
  { id: 2, a: 139, b: 206, place: "desert", rel: true, light: "day", keys: [
    { f: 139, pos: [1.0, 1.95, 7.2], look: [0.0, 1.55, 3.95], fov: 34 },
    { f: 206, pos: [0.85, 1.92, 6.6], look: [0.0, 1.55, 3.95], fov: 33 },
  ] },
  { id: 3, a: 206, b: 286, place: "desert", rel: true, light: "day", keys: [
    { f: 206, pos: [4.6, 1.5, 6.3], look: [2.3, 1.45, 3.6], fov: 34 },
    { f: 286, pos: [4.35, 1.5, 5.8], look: [2.3, 1.47, 3.6], fov: 33 },
  ] },
  { id: 4, a: 286, b: 354, place: "desert", rel: true, light: "day", keys: [
    { f: 286, pos: [-1.5, 1.6, 6.6], look: [-0.15, 1.45, 3.95], fov: 30 },
    { f: 354, pos: [-1.35, 1.58, 6.1], look: [-0.15, 1.44, 3.95], fov: 29 },
  ] },
  { id: 5, a: 354, b: 440, place: "desert", rel: true, light: "day", keys: [ // runner digs in, then the men drop
    { f: 354, pos: [-2.9, 0.5, 5.8], look: [-1.0, 0.4, 3.3], fov: 42 },
    { f: 382, pos: [-2.8, 0.52, 5.5], look: [-1.0, 0.4, 3.3], fov: 41 },
    { f: 412, pos: [5.5, 2.0, 13.5], look: [0, 1.0, 7.5], fov: 46, glide: true },
    { f: 440, pos: [5.4, 2.05, 13.0], look: [0, 1.0, 7.5], fov: 45 },
  ] },
  { id: 6, a: 440, b: 496, place: "desert", rel: true, light: "day", keys: [
    { f: 440, pos: [4.6, 0.7, 6.8], look: [2.4, 1.75, 3.6], fov: 42 },
    { f: 496, pos: [4.35, 0.75, 6.3], look: [2.4, 1.8, 3.6], fov: 40 },
  ] },
  { id: 7, a: 496, b: 569, place: "desert", rel: true, light: "day", keys: [
    { f: 496, pos: [-0.75, 0.8, 5.6], look: [0.25, 0.2, 4.05], fov: 40 },
    { f: 569, pos: [-0.65, 0.75, 5.2], look: [0.25, 0.2, 4.05], fov: 38 },
  ] },
  { id: 8, a: 569, b: 743, place: "beach", light: "day", keys: [
    { f: 569, pos: [BEACH[0], 1.0, 3.6], look: [BEACH[0], 0.3, 0], fov: 38 },
    { f: 690, pos: [BEACH[0] - 0.05, 0.95, 3.2], look: [BEACH[0], 0.3, 0], fov: 37 },
    { f: 718, pos: [BEACH[0] + 0.4, 0.75, 2.1], look: [BEACH[0] + 0.38, 0.32, 0], fov: 36, glide: true },
    { f: 743, pos: [BEACH[0] + 0.4, 0.73, 1.9], look: [BEACH[0] + 0.38, 0.32, 0], fov: 35 },
  ] },
  { id: 9, a: 743, b: 923, place: "desert", rel: true, light: "day", keys: [
    { f: 743, pos: [3.8, 1.1, 8.6], look: [0.0, 0.6, 3.2], fov: 42 },
    { f: 830, pos: [3.6, 1.15, 8.2], look: [0.0, 0.6, 3.2], fov: 41 },
    { f: 872, pos: [8.0, 3.2, 16], look: [0, 1.8, 6], fov: 46, glide: true },
    { f: 923, pos: [7.8, 3.3, 15.4], look: [0, 1.8, 6], fov: 45 },
  ] },
  { id: 10, a: 923, b: 1091, place: "tomb", light: "golden", keys: [
    { f: 923, pos: [TOMB[0] - 5.5, 1.9, 2.6], look: [TOMB[0] - 5.5, 1.8, -3], fov: 42 },
    { f: 940, pos: [TOMB[0] - 5.2, 1.9, 2.6], look: [TOMB[0] - 5.2, 1.8, -3], fov: 42 },
    { f: 1050, pos: [TOMB[0] + 3.6, 1.7, 1.2], look: [TOMB[0] + 3.6, 1.6, -3], fov: 40, glide: true },
    { f: 1091, pos: [TOMB[0] + 3.6, 1.7, 0.9], look: [TOMB[0] + 3.6, 1.6, -3], fov: 39 },
  ] },
  { id: 11, a: 1091, b: TOTAL, place: "desert", rel: true, light: "day", keys: [
    { f: 1091, pos: [4.4, 1.3, 7.0], look: [2.3, 1.7, 3.6], fov: 38 },
    { f: TOTAL, pos: [4.1, 1.32, 6.3], look: [2.3, 1.72, 3.6], fov: 36 },
  ] },
];
/** crossfades at changes of place: shot id -> frames */
export const XFADE: Record<number, number> = { 8: 6, 9: 6, 10: 6, 11: 6 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const camAt = (id: number, f: number) => {
  const s = SHOTS[id - 1], k = s.keys;
  let c = { pos: k[0].pos, look: k[0].look, fov: k[0].fov };
  if (f > k[0].f) {
    c = { pos: k[k.length - 1].pos, look: k[k.length - 1].look, fov: k[k.length - 1].fov };
    for (let i = 1; i < k.length; i++) if (f <= k[i].f) {
      const u = (f - k[i - 1].f) / (k[i].f - k[i - 1].f), t = k[i].glide ? smoother(u) : u;
      c = { pos: lerp3(k[i - 1].pos, k[i].pos, t), look: lerp3(k[i - 1].look, k[i].look, t), fov: lerp(k[i - 1].fov, k[i].fov, t) };
      break;
    }
  }
  if (!s.rel) return c;
  const z = procZ(worldF(f));
  return { pos: [c.pos[0], c.pos[1], c.pos[2] + z] as V3, look: [c.look[0], c.look[1], c.look[2] + z] as V3, fov: c.fov };
};

/** one or two layers: the next shot fades in over the previous one at a change of place, otherwise a cut */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (let i = SHOTS.length - 1; i >= 0; i--) {
    const s = SHOTS[i];
    if (f < s.a) continue;
    const x = XFADE[s.id];
    if (x && f < s.a + x && i > 0) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - s.a + 1) / (x + 1) }];
    return [{ id: s.id, alpha: 1 }];
  }
  return [{ id: 1, alpha: 1 }];
};

// ---- slow motion while the whip goes up: the world clock runs at 25 % ----
const SLOW = { in0: 448, in1: 456, out0: 486, out1: 496, rate: 0.25 };
const rateAt = (f: number) => 1 - (1 - SLOW.rate) * (smooth((f - SLOW.in0) / (SLOW.in1 - SLOW.in0)) - smooth((f - SLOW.out0) / (SLOW.out1 - SLOW.out0)));
const WF = (() => { const a = [0]; for (let f = 1; f <= TOTAL + 2; f++) a.push(a[f - 1] + rateAt(f - 0.5)); return a; })();
export const worldF = (f: number) => { const i = Math.max(0, Math.min(TOTAL + 1, Math.floor(f))); return WF[i] + (WF[i + 1] - WF[i]) * (f - i); };

// ---- story physics (all in world frames wf) ----
/** procession z: slow haul, stuck from "atora", easy glide on the wet sand */
export const procZ = (wf: number) => {
  const v1 = 0.35 / FPS, v2 = 0.75 / FPS, s0 = 372, s1 = 760;
  if (wf < s0) return v1 * wf;
  if (wf < s1) return v1 * s0;
  return v1 * s0 + v2 * (wf - s1) * smooth((wf - s1) / 30);
};
export const stuck = (wf: number) => smooth((wf - 362) / 14) - smooth((wf - 752) / 12); // 0..1 runner dug in
/** knees: each hauler drops between 393 and 425 and stands again from 520 */
export const kneel = (wf: number, i: number) => { const d = (i * 37) % 32; return wf > 393 + d && wf < 525 + (i % 9) * 3; };
/** whip: 1 = down, 0 = raised; up from "levanta" and it stays up */
export const whipK = (wf: number) => 1 - smooth((wf - 455) / 18);
/** wet patch growth in front of the sledge 0..1 */
export const wetK = (wf: number) => 0.25 + 0.75 * smooth((wf - 512) / 45);
/** dry castle collapse 0..1 */
export const crumble = (f: number) => smooth((f - 664) / 26);

/** thin-lens depth of field per shot */
export const dofAt = (id: number, f: number): { cInf: number; focus?: V3 } => {
  const z = procZ(worldF(f));
  switch (id) {
    case 1: return { cInf: f < 60 ? 12 : 12 * (1 - smooth((f - 60) / 40)) };
    case 2: case 4: return { cInf: 14, focus: [-0.15, 1.5, 3.95 + z] };
    case 3: case 6: case 11: return { cInf: 13, focus: [2.35, 1.5, 3.6 + z] };
    case 5: return { cInf: f < 390 ? 10 : 4 };
    case 7: return { cInf: 10, focus: [0.25, 0.2, 4.05 + z] };
    case 8: return { cInf: 9 };
    case 9: return { cInf: f < 840 ? 10 : 3 };
    case 10: return { cInf: 6 };
  }
  return { cInf: 0 };
};

/** the one number on screen (discreet, top of frame) */
export const MARKS = [{ a: 96, b: 139, label: "58 toneladas", sub: "", col: "#ffffff" }];
