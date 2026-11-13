import * as THREE from 'three';

/** Deterministic hash so duplicated seam vertices get identical jitter. */
const hash3 = (x, y, z) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Faceted glass envelope, built like the Power2U logo: a low-poly lathe whose
 * vertices are nudged so every facet catches light differently.
 */
export function buildGlass() {
  const profile = [
    [0.36, -1.08],
    [0.4, -0.92],
    [0.55, -0.66],
    [0.84, -0.3],
    [1.04, 0.08],
    [1.13, 0.48],
    [1.08, 0.9],
    [0.9, 1.26],
    [0.6, 1.53],
    [0.25, 1.68],
    [0.0, 1.72]
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const geo = new THREE.LatheGeometry(profile, 9);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y < -1.0 || v.y > 1.7) continue; // keep neck ring + tip clean
    const kx = Math.round(v.x * 1000);
    const ky = Math.round(v.y * 1000);
    const kz = Math.round(v.z * 1000);
    const radial = 1 + (hash3(kx, ky, kz) - 0.5) * 0.13;
    v.x *= radial;
    v.z *= radial;
    v.y += (hash3(ky, kz, kx) - 0.5) * 0.07;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Unique vertices of the glass, pulled slightly inward: the arcs strike these. */
export function glassAnchors(glass) {
  const pos = glass.attributes.position;
  const seen = new Set();
  const out = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const key = `${x.toFixed(3)}|${y.toFixed(3)}|${z.toFixed(3)}`;
    if (seen.has(key) || y < -0.55 || y > 1.66) continue;
    seen.add(key);
    out.push(new THREE.Vector3(x * 0.95, y * 0.97, z * 0.95));
  }
  return out;
}

/** Screw base: threads + shoulder, ordered bottom → top for outward normals. */
export function buildBase() {
  const pts = [];
  pts.push(new THREE.Vector2(0.001, -1.95));
  pts.push(new THREE.Vector2(0.3, -1.95));
  pts.push(new THREE.Vector2(0.39, -1.9));
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = -1.86 + t * 0.72;
    const r = 0.442 + 0.034 * Math.sin(t * Math.PI * 2 * 5 + Math.PI / 2);
    pts.push(new THREE.Vector2(r, y));
  }
  pts.push(new THREE.Vector2(0.43, -1.11));
  pts.push(new THREE.Vector2(0.37, -1.06));
  pts.push(new THREE.Vector2(0.001, -1.06));
  return new THREE.LatheGeometry(pts, 72);
}

/** A classic coiled filament between two supports. */
export class Coil extends THREE.Curve {
  constructor(length = 0.56, radius = 0.055, turns = 8, y = 0.5) {
    super();
    this.length = length;
    this.radius = radius;
    this.turns = turns;
    this.y = y;
  }

  getPoint(t, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2 * this.turns;
    const sag = Math.sin(t * Math.PI) * 0.06;
    return target.set(-this.length / 2 + t * this.length, this.y + Math.sin(a) * this.radius - sag, Math.cos(a) * this.radius);
  }
}

export function buildFilament() {
  const coil = new Coil();
  const coilGeo = new THREE.TubeGeometry(coil, 260, 0.011, 6, false);
  const left = coil.getPoint(0);
  const right = coil.getPoint(1);
  const stem = new THREE.Vector3(0, -0.62, 0);
  const support = (end, bend) =>
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([stem.clone().add(new THREE.Vector3(bend * 0.05, 0, 0)), new THREE.Vector3(end.x * 0.55, -0.05, 0), end]),
      24,
      0.007,
      5,
      false
    );
  return { coil, coilGeo, supports: [support(left, -1), support(right, 1)] };
}

/** Soft round sprite for dust motes. */
export function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Giant backdrop word rendered into canvas textures using the site's own font:
 * a filled version (lit by the bulb) and an outline (faint neon).
 */
export async function wordTextures(text) {
  try {
    await document.fonts.load('300 120px "Jost Variable"');
  } catch {
    /* font loading API unavailable: canvas falls back to the CSS stack */
  }
  const W = 2400;
  const H = 620;
  const make = draw => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    draw(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  };
  let size = H * 0.9;
  const setFont = ctx => {
    ctx.font = `300 ${size}px "Jost Variable", "Jost", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
  };
  const probe = document.createElement('canvas').getContext('2d');
  setFont(probe);
  const measured = probe.measureText(text).width;
  if (measured > W * 0.97) size *= (W * 0.97) / measured;
  const baseline = H / 2 + size * 0.36;

  const fill = make(ctx => {
    setFont(ctx);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, W / 2, baseline);
  });
  const outline = make(ctx => {
    setFont(ctx);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.2;
    ctx.strokeText(text, W / 2, baseline);
  });
  return { fill, outline, aspect: W / H };
}
