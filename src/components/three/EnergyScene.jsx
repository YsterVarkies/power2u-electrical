import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { pointer } from '../../lib/pointer';

/* ───────────────────────── helpers ───────────────────────── */

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

/** Everything the story shows, as a pure function of scroll progress p ∈ [0, 1]. */
export function storyState(p) {
  const sunT = smooth(0.0, 0.6, p);
  const angle = Math.PI * (0.96 - 0.92 * sunT);
  const sunHeight = Math.sin(angle);
  const day = p < 0.6 ? clamp01(sunHeight * 1.5) : 0;
  const outage = p > 0.455 && p < 0.885;
  let battery;
  if (p < 0.16) battery = 0.32;
  else if (p < 0.42) battery = lerp(0.32, 1, smooth(0.16, 0.42, p));
  else if (p < 0.47) battery = 1;
  else if (p < 0.88) battery = lerp(1, 0.64, smooth(0.47, 0.88, p));
  else battery = lerp(0.64, 0.7, smooth(0.88, 1, p));
  const houseLights = 1 - smooth(0.12, 0.42, day);
  const charging = p > 0.17 && p < 0.44 ? 1 : 0;
  return {
    angle,
    sunHeight,
    day,
    outage,
    grid: outage ? 0 : 1,
    battery,
    houseLights,
    solar: day,
    charge: charging,
    discharge: outage ? 1 : 0,
    home: Math.max(0.35, houseLights),
    gridFlow: outage ? 0 : clamp01(1 - day * 0.85)
  };
}

const CAM_POS = [
  [10.5, 6.2, 12.5],
  [7.4, 4.8, 9.6],
  [6.4, 2.7, 6.6],
  [12.8, 8.6, 15.8],
  [9.8, 5.8, 11.8],
  [9.2, 5.2, 11]
].map(v => new THREE.Vector3(...v));

const CAM_TARGET = [
  [0, 1.0, 0],
  [0.4, 1.7, 0],
  [2.0, 0.9, 0.3],
  [-0.6, 0.6, -1.6],
  [0, 1.0, 0],
  [0, 1.1, 0]
].map(v => new THREE.Vector3(...v));

const camCurve = new THREE.CatmullRomCurve3(CAM_POS, false, 'centripetal');
const targetCurve = new THREE.CatmullRomCurve3(CAM_TARGET, false, 'centripetal');

/* ───────────────────────── textures ───────────────────────── */

function panelTextures() {
  const make = (bg, line) => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 192;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 192);
    ctx.strokeStyle = line;
    ctx.lineWidth = 3;
    for (let x = 0; x <= 256; x += 256 / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 192);
      ctx.stroke();
    }
    for (let y = 0; y <= 192; y += 192 / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  };
  const map = make('#0c1520', '#41546a');
  map.colorSpace = THREE.SRGBColorSpace;
  const glow = make('#000000', '#ffffff');
  return { map, glow };
}

/* ───────────────────────── world builder ───────────────────────── */

function buildWorld() {
  const root = new THREE.Group();
  const disposables = [];
  const keep = obj => {
    disposables.push(obj);
    return obj;
  };

  const wallMat = keep(new THREE.MeshStandardMaterial({ color: '#39443b', roughness: 0.92 }));
  const roofMat = keep(new THREE.MeshStandardMaterial({ color: '#232b25', roughness: 0.75, metalness: 0.1 }));
  const edgeMat = keep(new THREE.LineBasicMaterial({ color: '#4a5d4d', transparent: true, opacity: 0.55 }));
  const darkMat = keep(new THREE.MeshStandardMaterial({ color: '#0d110e', roughness: 0.6 }));
  const cableMat = keep(new THREE.MeshStandardMaterial({ color: '#2b352d', roughness: 0.5 }));

  const outline = (mesh, parent = root) => {
    const lines = new THREE.LineSegments(keep(new THREE.EdgesGeometry(mesh.geometry, 20)), edgeMat);
    lines.position.copy(mesh.position);
    lines.rotation.copy(mesh.rotation);
    lines.scale.copy(mesh.scale);
    parent.add(lines);
  };

  const roofGeometry = (width, depth, rise) => {
    const shape = new THREE.Shape();
    shape.moveTo(-depth / 2, 0);
    shape.lineTo(depth / 2, 0);
    shape.lineTo(0, rise);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    geo.translate(0, 0, -width / 2);
    geo.rotateY(Math.PI / 2);
    return keep(geo);
  };

  /* ── our house ── */
  const house = new THREE.Group();
  root.add(house);
  const walls = new THREE.Mesh(keep(new THREE.BoxGeometry(4.2, 1.5, 3)), wallMat);
  walls.position.y = 0.75;
  house.add(walls);
  outline(walls, house);
  const roof = new THREE.Mesh(roofGeometry(4.6, 3.5, 1.15), roofMat);
  roof.position.y = 1.5;
  house.add(roof);
  outline(roof, house);

  const windowMat = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }));
  const pane = keep(new THREE.PlaneGeometry(1, 1));
  const addPane = (parent, mat, w, h, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(pane, mat);
    m.scale.set(w, h, 1);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    parent.add(m);
    return m;
  };
  addPane(house, windowMat, 0.8, 0.55, -1.25, 0.9, 1.505);
  addPane(house, windowMat, 0.8, 0.55, 1.25, 0.9, 1.505);
  addPane(house, windowMat, 0.48, 0.92, 0.1, 0.46, 1.505);
  addPane(house, windowMat, 0.7, 0.5, 2.105, 0.95, -0.85, Math.PI / 2);
  addPane(house, windowMat, 0.7, 0.5, -2.105, 0.95, 0, -Math.PI / 2);

  /* ── solar panels on the front slope ── */
  const tex = panelTextures();
  disposables.push(tex.map, tex.glow);
  const panelMat = keep(
    new THREE.MeshStandardMaterial({
      map: tex.map,
      emissiveMap: tex.glow,
      emissive: new THREE.Color('#9fe0ff'),
      emissiveIntensity: 0,
      roughness: 0.32,
      metalness: 0.35
    })
  );
  const slope = Math.atan2(1.15, 1.75);
  const panels = new THREE.Group();
  panels.position.set(0, 2.075 + Math.cos(slope) * 0.06, 0.875 + Math.sin(slope) * 0.06);
  panels.rotation.x = slope;
  house.add(panels);
  const panelGeo = keep(new THREE.BoxGeometry(0.78, 0.035, 0.58));
  [-0.36, 0.32].forEach(z =>
    [-1.66, -0.83, 0, 0.83, 1.66].forEach(x => {
      const m = new THREE.Mesh(panelGeo, panelMat);
      m.position.set(x, 0, z);
      panels.add(m);
    })
  );

  /* ── inverter + battery on the right wall ── */
  const inverter = new THREE.Mesh(keep(new THREE.BoxGeometry(0.14, 0.62, 0.46)), keep(new THREE.MeshStandardMaterial({ color: '#d5dbd2', roughness: 0.45 })));
  inverter.position.set(2.175, 1.0, 0.55);
  house.add(inverter);
  const screenMat = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.6, 0.3), toneMapped: false }));
  addPane(house, screenMat, 0.18, 0.08, 2.247, 1.13, 0.55, Math.PI / 2);

  const batteryMat = keep(new THREE.MeshStandardMaterial({ color: '#1e2621', roughness: 0.5, metalness: 0.2 }));
  const ledMats = [];
  for (let i = 0; i < 3; i++) {
    const module = new THREE.Mesh(keep(new THREE.BoxGeometry(0.32, 0.22, 0.5)), batteryMat);
    module.position.set(2.33, 0.13 + i * 0.24, -0.2);
    house.add(module);
    outline(module, house);
    const led = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }));
    ledMats.push(led);
    addPane(house, led, 0.3, 0.035, 2.492, 0.13 + i * 0.24, -0.2, Math.PI / 2);
  }

  /* ── neighbourhood ── */
  const neighbours = [];
  const spots = [
    [-7.6, -4.6, 0.92, 0.2],
    [-3.4, -8.2, 0.82, -0.1],
    [3.9, -7.6, 0.86, 0.12],
    [8.6, -3.6, 0.9, -0.3],
    [-9.8, 2.4, 0.76, 0.5],
    [8.2, 4.8, 0.74, -0.55],
    [-1.2, -12.5, 0.8, 0.05]
  ];
  spots.forEach(([x, z, s, ry], index) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    g.scale.setScalar(s);
    const body = new THREE.Mesh(walls.geometry, wallMat);
    body.position.y = 0.75;
    g.add(body);
    outline(body, g);
    const top = new THREE.Mesh(roof.geometry, roofMat);
    top.position.y = 1.5;
    g.add(top);
    const mat = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }));
    addPane(g, mat, 0.8, 0.55, -1.25, 0.9, 1.505);
    addPane(g, mat, 0.8, 0.55, 1.25, 0.9, 1.505);
    neighbours.push({ mat, delay: index * 0.0045, seed: Math.random() * 10 });
    root.add(g);
  });

  /* ── street + street lights ── */
  const road = new THREE.Mesh(keep(new THREE.PlaneGeometry(40, 2.4)), keep(new THREE.MeshStandardMaterial({ color: '#0a0d0b', roughness: 0.95 })));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, 4.6);
  root.add(road);
  const lampMats = [];
  [-9, -3.5, 4.5, 10].forEach(x => {
    const pole = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.035, 0.045, 2.4, 8)), darkMat);
    pole.position.set(x, 1.2, 6.05);
    root.add(pole);
    const mat = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.08, 0.08, 0.08), toneMapped: false }));
    const head = new THREE.Mesh(keep(new THREE.SphereGeometry(0.09, 12, 8)), mat);
    head.position.set(x, 2.42, 5.9);
    root.add(head);
    lampMats.push(mat);
  });

  /* ── utility pole + overhead line ── */
  const pole = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 10)), darkMat);
  pole.position.set(-4.4, 2.1, 3.2);
  root.add(pole);
  const arm = new THREE.Mesh(keep(new THREE.BoxGeometry(1.1, 0.07, 0.07)), darkMat);
  arm.position.set(-4.4, 3.95, 3.2);
  root.add(arm);

  /* ── cables + energy paths ── */
  const paths = {
    solar: new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.95, 1.62, 1.62),
      new THREE.Vector3(2.2, 1.55, 1.45),
      new THREE.Vector3(2.21, 1.36, 0.95),
      new THREE.Vector3(2.2, 1.31, 0.6)
    ]),
    battery: new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.2, 0.69, 0.48),
      new THREE.Vector3(2.3, 0.6, 0.2),
      new THREE.Vector3(2.33, 0.73, -0.06)
    ]),
    home: new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.17, 0.75, 0.8),
      new THREE.Vector3(2.14, 0.28, 1.48),
      new THREE.Vector3(1.1, 0.24, 1.54),
      new THREE.Vector3(0.36, 0.24, 1.54)
    ]),
    grid: new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.4, 3.92, 3.2), new THREE.Vector3(-3.1, 2.1, 2.15), new THREE.Vector3(-2.12, 1.42, 1.05))
  };
  Object.values(paths).forEach(curve => {
    root.add(new THREE.Mesh(keep(new THREE.TubeGeometry(curve, 40, 0.014, 6, false)), cableMat));
  });
  const feed = new THREE.Mesh(
    keep(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.4, 3.92, 3.2), new THREE.Vector3(-9, 3.2, 3.2), new THREE.Vector3(-14, 3.92, 3.2)), 30, 0.014, 6, false)),
    cableMat
  );
  root.add(feed);

  return { root, disposables, windowMat, panelMat, screenMat, ledMats, neighbours, lampMats, paths };
}

/* ───────────────────────── sky / ground / stars ───────────────────────── */

const skyShader = {
  uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() } },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uTop;
    uniform vec3 uHorizon;
    varying vec3 vDir;
    void main() {
      float h = clamp(vDir.y * 1.4 + 0.08, 0.0, 1.0);
      gl_FragColor = vec4(mix(uHorizon, uTop, pow(h, 0.7)), 1.0);
    }
  `
};

const groundShader = {
  uniforms: {
    uBase: { value: new THREE.Color('#0d1210') },
    uLine: { value: new THREE.Color('#8ef04c') },
    uFog: { value: new THREE.Color('#050706') },
    uDay: { value: 0 },
    uGlow: { value: 0 }
  },
  vertexShader: /* glsl */ `
    varying vec3 vWorld;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uBase;
    uniform vec3 uLine;
    uniform vec3 uFog;
    uniform float uDay;
    uniform float uGlow;
    varying vec3 vWorld;
    void main() {
      vec2 p = vWorld.xz;
      vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
      float line = 1.0 - min(min(g.x, g.y), 1.0);
      float d = length(p);
      float fade = 1.0 - smoothstep(7.0, 24.0, d);
      vec3 col = uBase * (0.5 + 1.7 * uDay);
      col += uLine * line * 0.09 * fade;
      float pool = 1.0 - smoothstep(0.0, 4.2, length(p - vec2(0.0, 2.2)));
      col += vec3(1.0, 0.68, 0.36) * uGlow * 0.16 * pool;
      gl_FragColor = vec4(mix(uFog, col, fade), 1.0);
    }
  `
};

const NIGHT_TOP = new THREE.Color('#03050a');
const NIGHT_HORIZON = new THREE.Color('#0a1013');
const DAY_TOP = new THREE.Color('#123346');
const DAY_HORIZON = new THREE.Color('#3f6d74');
const DUSK_HORIZON = new THREE.Color('#5a2a1c');

/* ───────────────────────── scene ───────────────────────── */

const FLOW_COLORS = {
  solar: new THREE.Color(2.8, 1.6, 0.45),
  battery: new THREE.Color(1.1, 2.7, 0.6),
  home: new THREE.Color(2.5, 2.1, 1.5),
  grid: new THREE.Color(1.0, 1.7, 2.8)
};
const PER_PATH = 9;

function World({ progressRef, hudRef, small }) {
  const world = useMemo(() => buildWorld(), []);
  const { scene, camera, size } = useThree();
  const sky = useRef(null);
  const ground = useRef(null);
  const stars = useRef(null);
  const sun = useRef(null);
  const sunLight = useRef(null);
  const hemi = useRef(null);
  const pulses = useRef(null);
  const smoothP = useRef(progressRef.current ?? 0);
  const lastHud = useRef(0);
  const look = useMemo(() => new THREE.Vector3(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpTarget = useMemo(() => new THREE.Vector3(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const fogColor = useMemo(() => new THREE.Color(), []);

  const starGeo = useMemo(() => {
    const count = small ? 260 : 520;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42;
      const r = 48;
      arr[i * 3] = Math.cos(theta) * Math.sin(phi) * r;
      arr[i * 3 + 1] = Math.cos(phi) * r * 0.9 + 2;
      arr[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return geo;
  }, [small]);

  const pulseGeo = useMemo(() => new THREE.SphereGeometry(0.05, 10, 8), []);
  const pulseMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), []);
  const pathKeys = useMemo(() => Object.keys(world.paths), [world]);

  useEffect(() => {
    scene.fog = new THREE.Fog('#050706', 20, 46);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useEffect(
    () => () => {
      world.disposables.forEach(item => item.dispose?.());
      starGeo.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
    },
    [world, starGeo, pulseGeo, pulseMat]
  );

  useEffect(() => {
    const mesh = pulses.current;
    if (!mesh) return;
    pathKeys.forEach((key, k) => {
      for (let i = 0; i < PER_PATH; i++) mesh.setColorAt(k * PER_PATH + i, FLOW_COLORS[key]);
    });
    mesh.instanceColor.needsUpdate = true;
  }, [pathKeys]);

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const t = frame.clock.elapsedTime;
    smoothP.current = THREE.MathUtils.damp(smoothP.current, progressRef.current ?? 0, 4, dt);
    const p = smoothP.current;
    const s = storyState(p);

    /* camera */
    const aspect = size.width / Math.max(1, size.height);
    const reach = aspect < 0.8 ? 1.4 : aspect < 1.2 ? 1.2 : 1;
    camCurve.getPoint(p, tmpPos);
    targetCurve.getPoint(p, tmpTarget);
    tmpPos.sub(tmpTarget).multiplyScalar(reach).add(tmpTarget);
    // on tall screens aim below the house so it sits in the open space above the copy
    if (aspect < 0.8) {
      tmpPos.y -= 1.6;
      tmpTarget.y -= 1.6;
    }
    if (pointer.active) {
      tmpPos.x += ((pointer.x / window.innerWidth) * 2 - 1) * 0.35;
      tmpPos.y += -((pointer.y / window.innerHeight) * 2 - 1) * 0.2;
    }
    camera.position.lerp(tmpPos, 1 - Math.exp(-dt * 5));
    look.lerp(tmpTarget, 1 - Math.exp(-dt * 5));
    camera.lookAt(look);

    /* sky + light */
    const dusk = smooth(0.38, 0.55, p) * (1 - smooth(0.6, 0.7, p));
    color.copy(NIGHT_HORIZON).lerp(DAY_HORIZON, s.day).lerp(DUSK_HORIZON, dusk * 0.8);
    fogColor.copy(color).multiplyScalar(0.85);
    if (sky.current) {
      sky.current.material.uniforms.uTop.value.copy(NIGHT_TOP).lerp(DAY_TOP, s.day);
      sky.current.material.uniforms.uHorizon.value.copy(color);
    }
    scene.fog?.color.copy(fogColor);
    if (ground.current) {
      const u = ground.current.material.uniforms;
      u.uFog.value.copy(fogColor);
      u.uDay.value = s.day;
      u.uGlow.value = s.houseLights;
    }
    if (stars.current) stars.current.material.opacity = (1 - smooth(0.0, 0.3, s.day)) * smooth(0.5, 0.66, p) * 0.9;
    if (sun.current) {
      sun.current.position.set(Math.cos(s.angle) * 26, Math.sin(s.angle) * 17 - 1, -24);
      sun.current.visible = s.sunHeight > -0.05 && p < 0.62;
      const k = 2.2 + s.day * 3;
      const high = clamp01(s.sunHeight * 1.6);
      sun.current.material.color.setRGB(1.0 * k, (0.42 + 0.4 * high) * k, (0.14 + 0.42 * high) * k);
    }
    if (sunLight.current) {
      sunLight.current.position.set(Math.cos(s.angle) * 12, Math.max(0.5, Math.sin(s.angle) * 12), 6);
      sunLight.current.intensity = 0.2 + s.day * 3.4;
      sunLight.current.color.setRGB(1, 0.7 + s.day * 0.26, 0.45 + s.day * 0.45);
    }
    if (hemi.current) hemi.current.intensity = 0.16 + s.day * 1.05;

    /* our house */
    const hl = s.houseLights * (s.outage ? 0.92 + Math.sin(t * 2.1) * 0.02 : 1);
    world.windowMat.color.setRGB(2.1 * hl + 0.015, 1.45 * hl + 0.012, 0.72 * hl + 0.01);
    world.panelMat.emissiveIntensity = s.day * 0.32 + Math.sin(t * 1.4) * 0.03 * s.day;
    const screen = s.outage ? 0.6 + Math.sin(t * 6) * 0.25 : 1;
    world.screenMat.color.setRGB(0.35 * screen, 1.6 * screen, 0.3 * screen);
    world.ledMats.forEach((mat, i) => {
      const lit = clamp01((s.battery - i / 3) * 3);
      const blink = (s.charge && i === Math.min(2, Math.floor(s.battery * 3))) ? 0.55 + Math.sin(t * 5) * 0.45 : 1;
      mat.color.setRGB(0.5 * lit * blink, 2.4 * lit * blink, 0.4 * lit * blink);
    });

    /* neighbours + street lamps black out during load shedding */
    world.neighbours.forEach(n => {
      const q = storyState(Math.max(0, p - n.delay));
      let lvl = q.houseLights * q.grid;
      const edge = Math.abs(p - n.delay - 0.455) < 0.012 || Math.abs(p - n.delay - 0.885) < 0.012;
      if (edge) lvl *= Math.random() > 0.5 ? 1 : 0.15;
      n.mat.color.setRGB(1.6 * lvl + 0.01, 1.1 * lvl + 0.008, 0.55 * lvl + 0.006);
    });
    const lamp = s.grid * (1 - smooth(0.2, 0.45, s.day));
    world.lampMats.forEach(mat => mat.color.setRGB(2.4 * lamp + 0.08, 2.0 * lamp + 0.08, 1.3 * lamp + 0.08));

    /* energy pulses */
    const mesh = pulses.current;
    if (mesh) {
      const strength = { solar: s.solar, battery: Math.max(s.charge, s.discharge), home: s.home, grid: s.gridFlow };
      pathKeys.forEach((key, k) => {
        const curve = world.paths[key];
        const amount = strength[key];
        const dir = key === 'battery' && s.discharge ? -1 : 1;
        const speed = key === 'grid' ? 0.22 : 0.42;
        for (let i = 0; i < PER_PATH; i++) {
          let u = (t * speed + i / PER_PATH) % 1;
          if (dir < 0) u = 1 - u;
          curve.getPointAt(u, tmpPos);
          const scale = amount > 0.03 ? (0.45 + amount * 0.75) * (0.7 + 0.3 * Math.sin(u * Math.PI)) : 0;
          matrix.makeScale(scale, scale, scale).setPosition(tmpPos);
          mesh.setMatrixAt(k * PER_PATH + i, matrix);
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    /* HUD (throttled DOM writes) */
    const hud = hudRef.current;
    if (hud && t - lastHud.current > 0.08) {
      lastHud.current = t;
      hud.solar && (hud.solar.textContent = (s.solar * 5.2).toFixed(1));
      hud.solarBar && (hud.solarBar.style.transform = `scaleX(${s.solar.toFixed(3)})`);
      hud.battery && (hud.battery.textContent = String(Math.round(s.battery * 100)));
      hud.batteryBar && (hud.batteryBar.style.transform = `scaleX(${s.battery.toFixed(3)})`);
      hud.root && hud.root.setAttribute('data-grid', s.outage ? 'off' : 'on');
      hud.root && hud.root.setAttribute('data-mode', s.discharge ? 'battery' : s.charge ? 'charging' : s.solar > 0.2 ? 'solar' : 'grid');
    }
  });

  return (
    <>
      <primitive object={world.root} />
      <mesh ref={sky} scale={60}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial args={[{ ...skyShader, uniforms: THREE.UniformsUtils.clone(skyShader.uniforms) }]} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={ground} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[34, 72]} />
        <shaderMaterial args={[{ ...groundShader, uniforms: THREE.UniformsUtils.clone(groundShader.uniforms) }]} />
      </mesh>
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial size={0.16} color="#dfe9ff" transparent opacity={0} depthWrite={false} fog={false} sizeAttenuation />
      </points>
      <mesh ref={sun}>
        <sphereGeometry args={[1.1, 24, 16]} />
        <meshBasicMaterial toneMapped={false} fog={false} />
      </mesh>
      <directionalLight ref={sunLight} position={[6, 10, 6]} intensity={1} />
      <hemisphereLight ref={hemi} args={['#9fc5d6', '#0b0f0c', 0.3]} />
      <instancedMesh ref={pulses} args={[pulseGeo, pulseMat, pathKeys.length * PER_PATH]} frustumCulled={false} />
    </>
  );
}

export default function EnergyScene({ progressRef, hudRef, active, small }) {
  return (
    <Canvas
      className="story__canvas-el"
      dpr={[1, small ? 1.4 : 1.6]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      camera={{ fov: 32, position: [10.5, 6.2, 12.5], near: 0.1, far: 140 }}
      onCreated={({ gl }) => gl.setClearColor('#050706', 1)}
    >
      <World progressRef={progressRef} hudRef={hudRef} small={small} />
      <EffectComposer multisampling={small ? 0 : 4}>
        <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.62} luminanceSmoothing={0.2} radius={0.72} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
