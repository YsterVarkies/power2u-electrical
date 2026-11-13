import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { gsap } from '../../lib/gsap';
import { pointer } from '../../lib/pointer';
import { prefersReducedMotion } from '../../lib/smooth';
import { heroVideo } from '../../data/site';
import { buildBase, buildFilament, buildGlass, dotTexture, glassAnchors, wordTextures } from './bulbGeometry';

const VOLT = new THREE.Color('#8ef04c');
const VIDEO_ASPECT = 1764 / 1172;

/* ───────────────────────── shaders ───────────────────────── */

const glassShader = {
  uniforms: {
    uPower: { value: 0 },
    uTint: { value: new THREE.Color('#bfffa0') },
    uWarm: { value: new THREE.Color('#ffd9a8') }
  },
  vertexShader: /* glsl */ `
    varying vec3 vView;
    varying float vY;
    void main() {
      vY = position.y;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uPower;
    uniform vec3 uTint;
    uniform vec3 uWarm;
    varying vec3 vView;
    varying float vY;
    void main() {
      vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
      vec3 v = normalize(-vView);
      float facing = abs(dot(n, v));
      float rim = pow(1.0 - facing, 2.4);
      // each facet gets its own faint sheen from its normal
      float sheen = pow(max(dot(n, normalize(vec3(-0.4, 0.7, 0.6))), 0.0), 18.0);
      float inner = uPower * (0.025 + 0.11 * (1.0 - facing)) * smoothstep(-1.1, 0.4, vY);
      vec3 col = uTint * (0.02 + rim * 0.42) + uWarm * inner + vec3(1.0) * sheen * 0.3;
      gl_FragColor = vec4(col, 1.0);
    }
  `
};

const edgeShader = {
  uniforms: {
    uPower: { value: 0 },
    uEdges: { value: 0 },
    uTime: { value: 0 },
    uColor: { value: VOLT.clone() }
  },
  vertexShader: /* glsl */ `
    varying float vY;
    void main() {
      vY = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uPower;
    uniform float uEdges;
    uniform float uTime;
    uniform vec3 uColor;
    varying float vY;
    void main() {
      float wave = fract(vY * 0.42 - uTime * 0.38);
      float pulse = smoothstep(0.82, 0.98, wave) * (1.0 - smoothstep(0.98, 1.0, wave));
      float base = 0.16 + 0.55 * uPower;
      vec3 col = uColor * (base + pulse * (0.5 + uPower * 2.4));
      gl_FragColor = vec4(col * uEdges, 1.0);
    }
  `
};

/* ───────────────────────── arcs ───────────────────────── */

class ArcField {
  constructor(count, segments, width) {
    this.group = new THREE.Group();
    this.items = [];
    this.materials = [];
    for (let i = 0; i < count; i++) {
      const points = new Float32Array(segments * 3);
      const geo = new LineGeometry();
      geo.setPositions(points);
      const mat = new LineMaterial({
        color: new THREE.Color(1.7, 2.9, 1.35),
        linewidth: width,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const line = new Line2(geo, mat);
      line.frustumCulled = false;
      this.group.add(line);
      this.materials.push(mat);
      this.items.push({ line, points, segments, age: 0, ttl: 0, gap: Math.random() * 0.3, gain: 0 });
    }
    this.walk = Array.from({ length: segments }, () => new THREE.Vector3());
  }

  setResolution(w, h) {
    this.materials.forEach(mat => mat.resolution.set(w, h));
  }

  shape(item, from, to, jag) {
    const { points, segments } = item;
    const walk = this.walk;
    const step = (from.distanceTo(to) * jag) / Math.sqrt(segments);
    walk[0].set(0, 0, 0);
    for (let s = 1; s < segments; s++) {
      walk[s].set(
        walk[s - 1].x + (Math.random() - 0.5) * step,
        walk[s - 1].y + (Math.random() - 0.5) * step,
        walk[s - 1].z + (Math.random() - 0.5) * step
      );
    }
    const end = walk[segments - 1];
    for (let s = 0; s < segments; s++) {
      const t = s / (segments - 1);
      points[s * 3] = from.x + (to.x - from.x) * t + walk[s].x - end.x * t;
      points[s * 3 + 1] = from.y + (to.y - from.y) * t + walk[s].y - end.y * t;
      points[s * 3 + 2] = from.z + (to.z - from.z) * t + walk[s].z - end.z * t;
    }
    // write segment pairs straight into the existing instance buffer (no reallocations)
    const buffer = item.line.geometry.attributes.instanceStart.data;
    const out = buffer.array;
    for (let s = 0; s < segments - 1; s++) {
      const o = s * 6;
      out[o] = points[s * 3];
      out[o + 1] = points[s * 3 + 1];
      out[o + 2] = points[s * 3 + 2];
      out[o + 3] = points[s * 3 + 3];
      out[o + 4] = points[s * 3 + 4];
      out[o + 5] = points[s * 3 + 5];
    }
    buffer.needsUpdate = true;
  }

  dispose() {
    this.items.forEach(({ line }) => {
      line.geometry.dispose();
      line.material.dispose();
    });
  }
}

/* ───────────────────────── scene parts ───────────────────────── */

function useLayout() {
  const { viewport, camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const portrait = aspect < 1.1;
  return { viewport, camera, aspect, portrait };
}

/** Small procedural studio (three light panels) baked into an env map for the metal base. */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const studio = new THREE.Scene();
    studio.background = new THREE.Color('#050706');
    const plane = new THREE.PlaneGeometry(1, 1);
    const panels = [
      ['#e9ffe0', 2.2, [0, 4, 2], [Math.PI / 2, 0, 0], [8, 2, 1]],
      ['#8ef04c', 1.4, [-5, 0.5, 1], [0, Math.PI / 2, 0], [1.2, 6, 1]],
      ['#ffd8a3', 1.6, [5, -0.5, 2], [0, -Math.PI / 2, 0], [1.2, 5, 1]]
    ].map(([color, intensity, position, rotation, scale]) => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false });
      const mesh = new THREE.Mesh(plane, mat);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.scale.set(...scale);
      studio.add(mesh);
      return mat;
    });
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(studio, 0, 0.1, 100).texture;
    scene.environment = env;
    plane.dispose();
    panels.forEach(mat => mat.dispose());
    pmrem.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Plays the Motion Sites AI background video into a texture (no extra loaders needed). */
function useVideoTexture(src, active) {
  const [texture, setTexture] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.src = src;
    videoRef.current = video;
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    const ready = () => setTexture(tex);
    video.addEventListener('loadeddata', ready, { once: true });
    video.play().catch(() => {});
    return () => {
      video.removeEventListener('loadeddata', ready);
      video.pause();
      video.removeAttribute('src');
      video.load();
      tex.dispose();
      setTexture(null);
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) video.play().catch(() => {});
    else video.pause();
  }, [active, texture]);

  return texture;
}

function Backdrop({ active, small }) {
  const src = useMemo(() => {
    const probe = document.createElement('video');
    const webm = probe.canPlayType('video/webm; codecs="vp9"') === 'probably';
    if (small) return webm ? heroVideo.webmMobile : heroVideo.mp4Mobile;
    return webm ? heroVideo.webm : heroVideo.mp4;
  }, [small]);

  const texture = useVideoTexture(src, active);
  const { camera, portrait, viewport } = useLayout();
  const z = -7;
  const vp = viewport.getCurrentViewport(camera, [0, 0, z]);
  let w = vp.width * 1.12;
  let h = w / VIDEO_ASPECT;
  if (h < vp.height * 1.12) {
    h = vp.height * 1.12;
    w = h * VIDEO_ASPECT;
  }
  // put the glowing horizon just under the bulb
  const horizonNdc = portrait ? 0.22 : -0.42;
  const y = (horizonNdc * vp.height) / 2 + 0.27 * h;

  if (!texture) return null;
  return (
    <mesh position={[0, y, z]} scale={[w, h, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} toneMapped={false} color={[0.82, 0.86, 0.82]} />
    </mesh>
  );
}

const wordShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = uv;
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D uFill;
    uniform sampler2D uLine;
    uniform vec3 uLight;
    uniform float uPower;
    uniform float uEdges;
    uniform vec3 uWarm;
    uniform vec3 uVolt;
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      float fill = texture2D(uFill, vUv).g;
      float line = texture2D(uLine, vUv).g;
      float d = distance(vWorld, uLight);
      float pool = uPower * 1.75 / (1.0 + d * d * 0.36);
      pool *= pool;
      vec3 col = uWarm * fill * pool + uVolt * line * (0.04 + 0.16 * uEdges) * (0.45 + pool);
      float alpha = clamp(max(fill * pool * 1.4, line * (0.18 + 0.4 * uEdges)), 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `
};

function Word({ state }) {
  const [maps, setMaps] = useState(null);
  const mesh = useRef(null);
  const { camera, portrait, viewport } = useLayout();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...wordShader,
        uniforms: {
          uFill: { value: null },
          uLine: { value: null },
          uLight: { value: new THREE.Vector3(0, 0.4, 0) },
          uPower: { value: 0 },
          uEdges: { value: 0 },
          uWarm: { value: new THREE.Color('#e9dcc3') },
          uVolt: { value: VOLT.clone() }
        },
        transparent: true,
        depthWrite: false
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    let alive = true;
    wordTextures('POWER').then(result => {
      if (alive) setMaps(result);
      else {
        result.fill.dispose();
        result.outline.dispose();
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(
    () => () => {
      maps?.fill.dispose();
      maps?.outline.dispose();
    },
    [maps]
  );

  const z = -1.9;
  const vp = viewport.getCurrentViewport(camera, [0, 0, z]);
  const width = vp.width * (portrait ? 1.02 : 0.97);
  const baseY = portrait ? vp.height * 0.25 : vp.height * 0.03;

  useFrame(() => {
    if (!mesh.current) return;
    const s = state.current;
    mesh.current.position.x = -s.scroll * vp.width * 0.18;
    mesh.current.position.y = baseY + s.scroll * vp.height * 0.1;
    const u = material.uniforms;
    u.uLight.value.copy(s.light);
    u.uPower.value = s.glow;
    u.uEdges.value = s.edges;
  });

  if (!maps) return null;
  material.uniforms.uFill.value = maps.fill;
  material.uniforms.uLine.value = maps.outline;
  return (
    <mesh ref={mesh} position={[0, baseY, z]} scale={[width, width / maps.aspect, 1]} material={material}>
      <planeGeometry />
    </mesh>
  );
}

function Dust({ count, state }) {
  const ref = useRef(null);
  const { positions, speeds } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 9;
      p[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      p[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;
      s[i] = 0.04 + Math.random() * 0.1;
    }
    return { positions: p, speeds: s };
  }, [count]);
  const sprite = useMemo(() => dotTexture(), []);
  useEffect(() => () => sprite.dispose(), [sprite]);

  useFrame((_, dt) => {
    const geo = ref.current?.geometry;
    if (!geo) return;
    const arr = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      arr[i * 3] += Math.sin(arr[i * 3 + 1] * 1.3 + i) * dt * 0.03;
      if (arr[i * 3 + 1] > 2.9) arr[i * 3 + 1] = -2.9;
    }
    geo.attributes.position.needsUpdate = true;
    ref.current.material.opacity = 0.18 + state.current.power * 0.5;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.05}
        sizeAttenuation
        color="#d4ffb0"
        transparent
        opacity={0.2}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Bulb({ state, small }) {
  const root = useRef(null);
  const spin = useRef(null);
  const light = useRef(null);
  const { portrait } = useLayout();

  const parts = useMemo(() => {
    const glass = buildGlass();
    const edges = new THREE.EdgesGeometry(glass, 1);
    const anchors = glassAnchors(glass);
    const filament = buildFilament();
    const base = buildBase();
    return { glass, edges, anchors, filament, base };
  }, []);

  const mats = useMemo(() => {
    const glass = new THREE.ShaderMaterial({
      ...glassShader,
      uniforms: THREE.UniformsUtils.clone(glassShader.uniforms),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const edges = new THREE.ShaderMaterial({
      ...edgeShader,
      uniforms: THREE.UniformsUtils.clone(edgeShader.uniforms),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const coil = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.03, 0.02), toneMapped: false });
    return { glass, edges, coil };
  }, []);

  const arcs = useMemo(() => new ArcField(small ? 4 : 6, small ? 14 : 20, small ? 1.6 : 2.2), [small]);
  const size = useThree(s => s.size);
  useEffect(() => arcs.setResolution(size.width, size.height), [arcs, size]);

  useEffect(
    () => () => {
      Object.values(parts).forEach(item => item?.dispose?.());
      parts.filament.coilGeo.dispose();
      parts.filament.supports.forEach(geo => geo.dispose());
      Object.values(mats).forEach(mat => mat.dispose());
    },
    [parts, mats]
  );
  useEffect(() => () => arcs.dispose(), [arcs]);

  // scratch objects
  const tmp = useMemo(
    () => ({
      ndc: new THREE.Vector2(),
      ray: new THREE.Raycaster(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      hit: new THREE.Vector3(),
      center: new THREE.Vector3(),
      local: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      from: new THREE.Vector3(),
      cand: new THREE.Vector3(),
      inv: new THREE.Matrix4(),
      tilt: { x: 0, z: 0 },
      touch: 0,
      kick: 0
    }),
    []
  );

  useFrame((frame, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 1 / 20);
    const t = frame.clock.elapsedTime;
    const group = root.current;
    const spinner = spin.current;
    if (!group || !spinner) return;

    // ── layout + scroll
    const scale = portrait ? 0.4 : 0.64;
    const baseY = portrait ? 1.22 : 0.16;
    group.scale.setScalar(scale * (1 - s.scroll * 0.12));
    group.position.y = baseY + Math.sin(t * 0.9) * 0.05 + s.scroll * 1.7;

    // ── pointer in world space (bulb plane z = 0)
    const rect = frame.gl.domElement.getBoundingClientRect();
    let hasPointer = false;
    if (pointer.active && pointer.y > rect.top && pointer.y < rect.bottom) {
      tmp.ndc.set(((pointer.x - rect.left) / rect.width) * 2 - 1, -((pointer.y - rect.top) / rect.height) * 2 + 1);
      tmp.ray.setFromCamera(tmp.ndc, frame.camera);
      hasPointer = !!tmp.ray.ray.intersectPlane(tmp.plane, tmp.hit);
    }

    // ── gentle tilt toward the cursor + slow spin
    const tx = hasPointer ? THREE.MathUtils.clamp(tmp.ndc.y, -1, 1) * 0.14 : 0;
    const tz = hasPointer ? -THREE.MathUtils.clamp(tmp.ndc.x, -1, 1) * 0.16 : 0;
    tmp.tilt.x = THREE.MathUtils.damp(tmp.tilt.x, tx, 3, dt);
    tmp.tilt.z = THREE.MathUtils.damp(tmp.tilt.z, tz, 3, dt);
    group.rotation.set(tmp.tilt.x, 0, tmp.tilt.z);
    if (!s.reduced) spinner.rotation.y += dt * (0.16 + tmp.touch * 0.5);

    // ── where is the cursor relative to the glass?
    group.getWorldPosition(tmp.center);
    tmp.center.y += 0.35 * scale;
    let touchTarget = 0;
    if (hasPointer) {
      const dist = tmp.hit.distanceTo(tmp.center);
      touchTarget = THREE.MathUtils.clamp(1.0 - (dist - 0.9 * scale * 1.4) / (1.6 * scale * 1.4), 0, 1);
      spinner.updateMatrixWorld();
      tmp.inv.copy(spinner.matrixWorld).invert();
      tmp.local.copy(tmp.hit).applyMatrix4(tmp.inv);
      tmp.dir.copy(tmp.local).sub(tmp.from.set(0, 0.45, 0)).normalize();
    }
    tmp.touch = THREE.MathUtils.damp(tmp.touch, touchTarget, 5, dt);
    tmp.kick = Math.max(0, tmp.kick - dt * 4);

    // ── arcs: short-lived bolts from the filament to the facets
    const power = s.power;
    const rate = power > 0.05 && !s.reduced ? 0.55 + tmp.touch * 0.45 : 0;
    for (const item of arcs.items) {
      item.age += dt;
      if (item.age >= item.ttl + item.gap) {
        item.age = 0;
        item.ttl = 0.05 + Math.random() * 0.11;
        item.gap = Math.random() * (0.24 - tmp.touch * 0.2);
        if (Math.random() < rate) {
          parts.filament.coil.getPoint(Math.random(), tmp.from);
          let best = parts.anchors[0];
          let bestScore = -Infinity;
          const bias = hasPointer ? 0.6 + tmp.touch * 7 : 0;
          for (let k = 0; k < 7; k++) {
            const candidate = parts.anchors[(Math.random() * parts.anchors.length) | 0];
            const score = Math.random() + (bias ? tmp.cand.copy(candidate).sub(tmp.from).normalize().dot(tmp.dir) * bias : 0);
            if (score > bestScore) {
              bestScore = score;
              best = candidate;
            }
          }
          arcs.shape(item, tmp.from, best, 0.34);
          item.gain = 0.55 + Math.random() * 0.45;
          tmp.kick = Math.min(1, tmp.kick + 0.25);
        } else {
          item.gain = 0;
        }
      }
      const visible = item.age < item.ttl ? item.gain : 0;
      const flick = 0.7 + Math.random() * 0.3;
      item.line.visible = visible > 0;
      item.line.material.opacity = Math.min(1, visible * power * flick * (0.75 + tmp.touch * 0.5));
    }

    // ── materials
    const hum = s.reduced ? 1 : 0.94 + Math.sin(t * 31) * 0.02 + Math.sin(t * 7.3) * 0.02 + tmp.kick * 0.18;
    const glow = power * hum * (1 + tmp.touch * 0.35);
    mats.glass.uniforms.uPower.value = glow;
    mats.edges.uniforms.uPower.value = glow;
    mats.edges.uniforms.uEdges.value = s.edges;
    mats.edges.uniforms.uTime.value = t;
    const k = 0.04 + glow * 7.5;
    mats.coil.color.setRGB(1.0 * k, 0.6 * k, 0.28 * k);
    if (light.current) {
      light.current.intensity = glow * 16;
      light.current.getWorldPosition(s.light);
    }
    s.glow = glow;
  });

  return (
    <group ref={root}>
      <group ref={spin}>
        <mesh geometry={parts.glass} material={mats.glass} renderOrder={2} />
        <lineSegments geometry={parts.edges} material={mats.edges} renderOrder={3} />
        <mesh geometry={parts.filament.coilGeo} material={mats.coil} />
        {parts.filament.supports.map((geo, index) => (
          <mesh key={index} geometry={geo}>
            <meshStandardMaterial color="#6b7468" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
        <primitive object={arcs.group} />
        <mesh geometry={parts.base}>
          <meshStandardMaterial color="#6f9a58" metalness={0.92} roughness={0.3} envMapIntensity={0.95} />
        </mesh>
        <mesh position={[0, -2.0, 0]}>
          <cylinderGeometry args={[0.3, 0.2, 0.1, 48]} />
          <meshStandardMaterial color="#0c0f0d" roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh position={[0, -2.08, 0]}>
          <cylinderGeometry args={[0.13, 0.09, 0.07, 32]} />
          <meshStandardMaterial color="#d9b77a" metalness={1} roughness={0.25} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 0.48, 0]} color="#ffdcb0" intensity={0} distance={0} decay={2} />
    </group>
  );
}

function Rig({ state }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const s = state.current;
    const targetX = pointer.active && !s.reduced ? ((pointer.x / window.innerWidth) * 2 - 1) * 0.25 : 0;
    const targetY = pointer.active && !s.reduced ? -((pointer.y / window.innerHeight) * 2 - 1) * 0.12 : 0;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.15 + targetY, 2, dt);
    camera.lookAt(0, 0.1, 0);
  });
  return null;
}

/* ───────────────────────── canvas (Power2U bulb hero) ───────────────────────── */

export default function HeroScene({ powered, active, scrollRef, small }) {
  const state = useRef({
    power: 0,
    glow: 0,
    edges: 0,
    scroll: 0,
    light: new THREE.Vector3(0, 0.4, 0),
    reduced: prefersReducedMotion()
  });

  // keep scroll progress in the shared state object
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      state.current.scroll = scrollRef.current?.p ?? 0;
      raf = requestAnimationFrame(loop);
    };
    if (active) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, scrollRef]);

  // ignition: wireframe draws in, then the filament stutters to life
  useEffect(() => {
    const s = state.current;
    if (!powered) {
      const tween = gsap.to(s, { edges: 0.35, duration: 1.4, delay: 0.3, ease: 'power2.out' });
      return () => tween.kill();
    }
    if (s.reduced) {
      s.edges = 1;
      s.power = 1;
      return undefined;
    }
    const tl = gsap.timeline({ delay: 0.2 });
    tl.to(s, { edges: 1, duration: 0.8, ease: 'power2.out' }, 0)
      .to(s, { power: 0.5, duration: 0.05, ease: 'none' }, 0.15)
      .to(s, { power: 0.04, duration: 0.07, ease: 'none' })
      .to(s, { power: 0.8, duration: 0.05, ease: 'none' })
      .to(s, { power: 0.12, duration: 0.1, ease: 'none' })
      .to(s, { power: 1, duration: 0.6, ease: 'power2.out' });
    return () => tl.kill();
  }, [powered]);

  return (
    <Canvas
      className="hero__canvas"
      dpr={[1, small ? 1.5 : 1.75]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      camera={{ fov: 30, position: [0, 0.15, 9.5], near: 0.1, far: 60 }}
      onCreated={({ gl }) => gl.setClearColor('#050706', 1)}
    >
      <Backdrop active={active} small={small} />
      <Word state={state} />
      <Bulb state={state} small={small} />
      <Dust count={small ? 110 : 260} state={state} />
      <Rig state={state} />
      <ambientLight intensity={0.04} />
      <StudioEnvironment />
      <EffectComposer multisampling={small ? 0 : 4}>
        <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.55} luminanceSmoothing={0.22} radius={0.78} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
