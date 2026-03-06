import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── SHADERS FOR PORTAL AND FIREFLIES ──────────────────────────────────
const portalVertexShader = `
  varying vec2 vUv;
  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;
    vUv = uv;
  }
`;

const portalFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorStart;
  uniform vec3 uColorEnd;
  varying vec2 vUv;
  // Classic Perlin 3D Noise 
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
  float cnoise(vec3 P){
    vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)); float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)); float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }
  void main() {
    vec2 displacedUv = vUv + cnoise(vec3(vUv * 7.0, uTime * 0.1));
    float strength = cnoise(vec3(displacedUv * 5.0, uTime * 0.2));
    float outerGlow = distance(vUv, vec2(0.5)) * 5.0 - 1.4;
    strength += outerGlow;
    strength += step(-0.2, strength) * 0.8;
    strength = clamp(strength, 0.0, 1.0);
    vec3 color = mix(uColorStart, uColorEnd, strength);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const firefliesVertexShader = `
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uTime;
  attribute float aScale;
  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y += sin(uTime + modelPosition.x * 100.0) * aScale * 0.2;
    modelPosition.z += cos(uTime + modelPosition.x * 100.0) * aScale * 0.2;
    modelPosition.x += cos(uTime + modelPosition.x * 100.0) * aScale * 0.2;
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPostion = projectionMatrix * viewPosition;
    gl_Position = projectionPostion;
    gl_PointSize = uSize * aScale * uPixelRatio;
    gl_PointSize *= (1.0 / - viewPosition.z);
  }
`;

const firefliesFragmentShader = `
  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    gl_FragColor = vec4(1.0, 1.0, 1.0, strength);
  }
`;


// ── RENDERER ──────────────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
// renderer.toneMapping = THREE.ACESFilmicToneMapping; 
// renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function syncCanvas() {
  const W = window.innerWidth, H = window.innerHeight;
  renderer.setSize(W, H, false);
  canvas.style.cssText = `position:fixed;top:0;left:0;width:${W}px;height:${H}px;z-index:1;display:block;`;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', syncCanvas);

// ── SCENE & CAMERA ────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1e2243');
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);

// เริ่มต้นกล้องอยู่ด้านนอกมองไปที่ประตู
camera.position.set(0, 0.5, 3.8);
camera.lookAt(0, 0.5, 0);
syncCanvas();

// ── LIGHTING ──────────────────────────────────────────────────────────
const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambLight);
const sunLight = new THREE.DirectionalLight(0xfff8f0, 2.5);
sunLight.position.set(4, 7, 6);
sunLight.castShadow = true;
scene.add(sunLight);

// ── DOOR & WALL ───────────────────────────────────────────────────────
const woodMat = new THREE.MeshStandardMaterial({ color: 0xd4a070, roughness: 0.8 });
const doorMat = new THREE.MeshStandardMaterial({ color: 0xe8b870, roughness: 0.8 });
const knobMat = new THREE.MeshStandardMaterial({ color: 0xffd060, roughness: 0.3, metalness: 0.6 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0x222540, roughness: 1.0 });

const DW = 1.6, DH = 3.2, FT = 0.15;
const FLOOR_Y = -1.5;
const DOOR_Y = FLOOR_Y + DH / 2;

function addB(w, h, d, x, y, z, m) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = true; b.receiveShadow = true;
  scene.add(b); return b;
}

// สร้างกรอบของประตู
addB(DW + FT * 2, FT, 0.3, 0, DOOR_Y + DH / 2 + FT / 2, 0.1, woodMat); // top
addB(FT, DH, 0.3, -DW / 2 - FT / 2, DOOR_Y, 0.1, woodMat); // left
addB(FT, DH, 0.3, DW / 2 + FT / 2, DOOR_Y, 0.1, woodMat); // right

// สร้างกำแพงล้อมรอบ (ซ้าย ขวา บน ล่าง) ไม่ให้ฉากลอยเคว้ง
addB(10, DH + FT * 2, 0.1, -DW / 2 - FT - 5, DOOR_Y, 0.15, wallMat);
addB(10, DH + FT * 2, 0.1, DW / 2 + FT + 5, DOOR_Y, 0.15, wallMat);
addB(20, 10, 0.1, 0, DOOR_Y + DH / 2 + FT + 5, 0.15, wallMat);
addB(20, 10, 0.1, 0, DOOR_Y - DH / 2 - 5, 0.15, wallMat);


const doorPivot = new THREE.Group();
doorPivot.position.set(-DW / 2, DOOR_Y, 0.05);
scene.add(doorPivot);

const panel = new THREE.Mesh(new THREE.BoxGeometry(DW, DH - 0.04, 0.08), doorMat);
panel.position.set(DW / 2, 0, 0);
panel.castShadow = true;
doorPivot.add(panel);

const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 32, 32), knobMat);
knob.position.set(DW - 0.15, 0, 0.1);
doorPivot.add(knob);

// ── FLOATING HEARTS OUTSIDE DOOR ──────────────────────────────────────
const heartsList = [];
const heartShape = new THREE.Shape();
const hX = 0, hY = 0;
heartShape.moveTo(hX + 5, hY + 5);
heartShape.bezierCurveTo(hX + 5, hY + 5, hX + 4, hY, hX, hY);
heartShape.bezierCurveTo(hX - 6, hY, hX - 6, hY + 7, hX - 6, hY + 7);
heartShape.bezierCurveTo(hX - 6, hY + 11, hX - 3, hY + 15.4, hX + 5, hY + 19);
heartShape.bezierCurveTo(hX + 12, hY + 15.4, hX + 16, hY + 11, hX + 16, hY + 7);
heartShape.bezierCurveTo(hX + 16, hY + 7, hX + 16, hY, hX + 10, hY);
heartShape.bezierCurveTo(hX + 7, hY, hX + 5, hY + 5, hX + 5, hY + 5);
const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 1, bevelThickness: 1 });
heartGeo.scale(0.015, 0.015, 0.015);
heartGeo.rotateZ(Math.PI);
const glowMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, emissive: 0xff69b4, emissiveIntensity: 0.6 });

for (let i = 0; i < 10; i++) {
  const hMesh = new THREE.Mesh(heartGeo, glowMat);
  hMesh.position.set((Math.random() - 0.5) * 4.5, FLOOR_Y + Math.random() * 3 + 0.5, 0.3 + Math.random() * 0.8);
  hMesh.rotation.z = (Math.random() - 0.5) * 0.5;
  scene.add(hMesh);
  heartsList.push({ mesh: hMesh, speedY: Math.random() * 0.005 + 0.005, phaseX: Math.random() * Math.PI * 2, startY: hMesh.position.y });
}


// ── 3D PORTAL (GLTF) ──────────────────────────────────────────────────
const roomGroup = new THREE.Group();
roomGroup.position.set(0, FLOOR_Y + 0.8, -2.5); // ถอยไปด้านหลังเพื่อให้พอร์ทัลอยู่หลังประตู
scene.add(roomGroup);

let portalLightMaterial;
let firefliesMaterial;

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

const bakedTexture = textureLoader.load('https://assets.codepen.io/22914/baked-02.jpg');
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;
const bakedRoomMat = new THREE.MeshBasicMaterial({ map: bakedTexture });

const poleLightMaterial = new THREE.MeshBasicMaterial({ color: "#f0bf94" });

portalLightMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  transparent: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color("#b91fac") },
    uColorEnd: { value: new THREE.Color("#ffebf3") }
  }
});

loader.load('https://assets.codepen.io/22914/portal-2.glb',
  (gltf) => {
    const bakedMesh = gltf.scene.children.find((child) => child.name === "baked");
    if (bakedMesh) bakedMesh.material = bakedRoomMat;

    const portalLight = gltf.scene.children.find((child) => child.name === "portalCircle");
    if (portalLight) portalLight.material = portalLightMaterial;

    gltf.scene.children.filter((child) => child.name.includes("lampLight")).forEach((light) => {
      light.material = poleLightMaterial;
    });

    gltf.scene.scale.set(1.4, 1.4, 1.4);
    // หมุนแกน Y ให้ประตูมิติหันหน้าเข้าหากล้อง
    gltf.scene.rotation.y = -Math.PI / 2;
    // ถอยพอร์ตัลไปด้านหลัง (ให้สะพานทอดยาวมาหากล้อง)
    gltf.scene.position.set(0, -0.8, -1.5);

    roomGroup.add(gltf.scene);

    // -- Add Fireflies --
    const firefliesGeometry = new THREE.BufferGeometry();
    const firefliesCount = 45;
    const positionArray = new Float32Array(firefliesCount * 3);
    const scaleArray = new Float32Array(firefliesCount);
    for (let i = 0; i < firefliesCount; i++) {
      new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 2.5 - 0.5,
        (Math.random() - 0.5) * 6
      ).toArray(positionArray, i * 3);
      scaleArray[i] = Math.random();
    }
    firefliesGeometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3));
    firefliesGeometry.setAttribute("aScale", new THREE.BufferAttribute(scaleArray, 1));

    firefliesMaterial = new THREE.ShaderMaterial({
      vertexShader: firefliesVertexShader,
      fragmentShader: firefliesFragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 120 }
      },
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
    roomGroup.add(fireflies);

    document.dispatchEvent(new CustomEvent('threeReady'));
  },
  undefined,
  (e) => {
    console.error("Room load error", e);
    document.dispatchEvent(new CustomEvent('threeReady')); // Proceed anyway
  }
);

// ── ENVELOPE (Floating 3D object for Message Scene) ─────────────────
const envGroup = new THREE.Group();
envGroup.position.set(0, 0.3, -3.2); // เข้าห้องไปหน่อยนึง
envGroup.visible = false;
scene.add(envGroup);

// สร้างซองจดหมายให้ดู Premium ขึ้น
const envBodyMat = new THREE.MeshPhysicalMaterial({
  color: 0xffe4ec, roughness: 0.2, metalness: 0.1, clearcoat: 0.4
});
const envFlapMat = new THREE.MeshPhysicalMaterial({
  color: 0xffb6c1, roughness: 0.2, metalness: 0.1, clearcoat: 0.5
});
const sealMat = new THREE.MeshPhysicalMaterial({
  color: 0xe91e8c, roughness: 0.1, metalness: 0.6, clearcoat: 0.8
});

const envBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.04), envBodyMat);
envBody.castShadow = true;

const envFlap = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.6, 4), envFlapMat);
envFlap.rotation.y = Math.PI / 4;
envFlap.rotation.x = Math.PI / 2;
envFlap.position.set(0, 0.5, 0.025);
envGroup.add(envBody, envFlap);

const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 32), sealMat);
seal.rotation.x = Math.PI / 2;
seal.position.set(0, 0.3, 0.05);
// หัวใจนูนบนตั่งซีล
const miniHeartMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
const miniHeart = new THREE.Mesh(heartGeo.clone(), miniHeartMat);
miniHeart.scale.set(0.2, 0.2, 0.05); // Tiny
miniHeart.position.set(0.04, 0.04, 0.02);
seal.add(miniHeart);
envGroup.add(seal);


// ── TWEEN SYSTEM ──────────────────────────────────────────────────────
let phase = 'idle';
let currentTween = null;

function tween(ms, stepCb, doneCb) {
  const t0 = performance.now();
  currentTween = { ms, stepCb, doneCb, t0, active: true };
}

// ── PUBLIC API ────────────────────────────────────────────────────────
window.threeScene = {
  enterDoor(onDone) {
    phase = 'opening';

    // 1. เปิดประตูช้าๆ
    tween(1800, e => {
      doorPivot.rotation.y = -Math.PI * 0.72 * e;
    });

    // 2. ซูมกล้องทะลุเข้าไปในห้อง (ประตูมิติ)
    setTimeout(() => {
      phase = 'zooming';
      const startZ = camera.position.z;
      const startY = camera.position.y;

      tween(2500, e => {
        camera.position.z = startZ + (-1.5 - startZ) * e; // หยุดที่สะพานไม้ พอดีกับภาพ
        camera.position.y = startY + (0.0 - startY) * e;  // มองตรงๆ ระดับสายตา
      }, () => {
        phase = 'inside';
        onDone && onDone();
      });
    }, 800);
  },

  showEnvelope() {
    phase = 'envelope';
    envGroup.visible = true;

    // เปลี่ยนมาเกิดจากบนขอบจอ (มือน้องแมว) ดิ่งลงมาตรงกลาง
    envGroup.position.set(0, 3.5, -2.5); // จุดเริ่มต้นอยู่สูงและใกล้กล้อง
    envGroup.scale.set(0.1, 0.1, 0.1);

    tween(1500, e => {
      // ขยายใหญ่ขึ้น
      const s = 0.1 + (1.2 - 0.1) * e;
      envGroup.scale.set(s, s, s);
      // ตกลงมาจากด้านบน (โยน)
      envGroup.position.y = 3.5 - (2.9 * e);
      // พุ่งมาข้างหน้าเข้าหาตัว
      envGroup.position.z = -2.5 + (0.3 * e);
      // หมุนติ้วๆ แบบเท่ๆ
      envGroup.rotation.x = Math.PI * 2 * e;
      envGroup.rotation.z = Math.sin(Math.PI * e) * 0.5; // แกว่งซ้ายขวา
    });
  },

  fastForwardEnvelope() {
    // ข้าม Animation ซองจดหมายทันที
    if (currentTween && phase === 'envelope') {
      currentTween.active = false; // ยกเลิก tween ตัวเดิม
    }
    envGroup.scale.set(1.3, 1.3, 1.3);
    envGroup.position.set(0, 0.6, -2.2);
    envGroup.rotation.set(0, 0, 0); // ล็อกหน้าตรง
  },

  hideEnvelope() {
    phase = 'interactive';
    tween(500, e => {
      envGroup.scale.set(1 - e, 1 - e, 1 - e);
      envGroup.position.y = 0.6 - e;
    }, () => {
      envGroup.visible = false;
    });
  },

  showCelebrate() {
    phase = 'celebrate';
    const sr = camera.rotation.y;
    tween(2000, e => {
      camera.rotation.y = sr + Math.sin(e * Math.PI * 2) * 0.18;
    });
  }
};

// ── LOOP ──────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const t = clock.getElapsedTime();

  // จัดการ Tween
  if (currentTween && currentTween.active) {
    const raw = Math.min((now - currentTween.t0) / currentTween.ms, 1);
    const e = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
    currentTween.stepCb(e);
    if (raw >= 1) {
      currentTween.active = false;
      if (currentTween.doneCb) currentTween.doneCb();
    }
  }

  // Animation กล้องลอยหายใจเบาๆ
  if (phase === 'inside' || phase === 'interactive' || phase === 'celebrate') {
    camera.position.y = 0.3 + Math.sin(t * 1.5) * 0.04;
    camera.position.x = Math.sin(t * 0.5) * 0.03;
  }

  // Animation ซองจดหมายลอยตัว (ถ้าหยุดการหมุนเปิดแล้ว)
  if (phase === 'envelope' && (!currentTween || !currentTween.active)) {
    camera.position.y = 0.3 + Math.sin(t * 1.5) * 0.04;
    envGroup.position.y = 0.6 + Math.sin(t * 3) * 0.06;
    envGroup.rotation.z = Math.sin(t * 2) * 0.03;
  }

  // หิ่งห้อย & พอร์ทัล
  if (portalLightMaterial) portalLightMaterial.uniforms.uTime.value = t;
  if (firefliesMaterial) firefliesMaterial.uniforms.uTime.value = t;

  // เอฟเฟกต์หัวใจลอยหน้าประตูมิติ
  if (phase === 'idle' || phase === 'opening' || phase === 'zooming') {
    heartsList.forEach(obj => {
      obj.mesh.position.y += obj.speedY;
      obj.mesh.position.x += Math.sin(t + obj.phaseX) * 0.003;
      // reset
      if (obj.mesh.position.y > DOOR_Y + DH + 1) {
        obj.mesh.position.y = FLOOR_Y;
      }
    });
  } else {
    // หุบหัวใจลงไปเมื่อเข้าห้อง
    heartsList.forEach(obj => { obj.mesh.visible = false; });
  }

  renderer.render(scene, camera);
}
animate();
