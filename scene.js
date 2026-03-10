import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── SHADERS ──────────────────────────────────────────────────────────
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

// ── RENDERER ──────────────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function syncCanvas() {
  const W = window.innerWidth, H = window.innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', syncCanvas);

// ── SCENE & CAMERA ────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1e2243');
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
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

addB(DW + FT * 2, FT, 0.3, 0, DOOR_Y + DH / 2 + FT / 2, 0.1, woodMat); 
addB(FT, DH, 0.3, -DW / 2 - FT / 2, DOOR_Y, 0.1, woodMat); 
addB(FT, DH, 0.3, DW / 2 + FT / 2, DOOR_Y, 0.1, woodMat); 

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

// ── FLOATING HEARTS ──────────────────────────────────────────────────
const heartsList = [];
const heartShape = new THREE.Shape();
heartShape.moveTo(5, 5);
heartShape.bezierCurveTo(5, 5, 4, 0, 0, 0);
heartShape.bezierCurveTo(-6, 0, -6, 7, -6, 7);
heartShape.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
heartShape.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
heartShape.bezierCurveTo(16, 7, 16, 0, 10, 0);
heartShape.bezierCurveTo(7, 0, 5, 5, 5, 5);
const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 1, bevelThickness: 1 });
heartGeo.scale(0.015, 0.015, 0.015);
heartGeo.rotateZ(Math.PI);
const glowMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, emissive: 0xff69b4, emissiveIntensity: 0.6 });

for (let i = 0; i < 10; i++) {
  const hMesh = new THREE.Mesh(heartGeo, glowMat);
  hMesh.position.set((Math.random() - 0.5) * 4.5, FLOOR_Y + Math.random() * 3 + 0.5, 0.3 + Math.random() * 0.8);
  scene.add(hMesh);
  heartsList.push({ mesh: hMesh, speedY: Math.random() * 0.005 + 0.005, phaseX: Math.random() * Math.PI * 2 });
}

// ── PORTAL ROOM ──────────────────────────────────────────────────────
const roomGroup = new THREE.Group();
roomGroup.position.set(0, FLOOR_Y + 0.8, -10); // ขยับพอร์ทัลไปให้ไกลขึ้น (Z = -10)
scene.add(roomGroup);

let portalLightMaterial;
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
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color("#b91fac") },
    uColorEnd: { value: new THREE.Color("#ffebf3") }
  }
});

loader.load('https://assets.codepen.io/22914/portal-2.glb', (gltf) => {
    const bakedMesh = gltf.scene.children.find(c => c.name === "baked");
    if (bakedMesh) bakedMesh.material = bakedRoomMat;
    const portalLight = gltf.scene.children.find(c => c.name === "portalCircle");
    if (portalLight) portalLight.material = portalLightMaterial;
    gltf.scene.children.filter(c => c.name.includes("lampLight")).forEach(l => l.material = poleLightMaterial);

    gltf.scene.scale.set(1.4, 1.4, 1.4);
    // หมุนให้หันมาทางประตูบ้าน (Math.PI = 180 องศา)
    gltf.scene.rotation.y = Math.PI; 
    gltf.scene.position.set(0, -0.8, 0);
    roomGroup.add(gltf.scene);
    document.dispatchEvent(new CustomEvent('threeReady'));
});

// ── FLOATING SPHERES (The Gallery) ────────────────────────────────────
const spheres = [];
const mediaSources = [
    { type: 'img', src: 'pictures/13395.jpeg' },
    { type: 'img', src: 'pictures/13396.jpeg' },
    { type: 'img', src: 'pictures/ฉากแรกเย้ๆ.jpg' },
    { type: 'img', src: 'pictures/ฉากสุดท้าย.jpeg' },
    { type: 'img', src: 'pictures/ฉากอวยพร.jpeg' },
    { type: 'img', src: 'pictures/ฉากอวยพรแรก.jpeg' },
    { type: 'vid', src: 'video/13397.mp4' },
    { type: 'vid', src: 'video/13398.mp4' },
    { type: 'vid', src: 'video/13399.mp4' },
    { type: 'vid', src: 'video/13400.mp4' },
    { type: 'vid', src: 'video/13401.mp4' }
];

// เตรียม Video Elements ล่วงหน้า
const videoElements = mediaSources.filter(m => m.type === 'vid').map(m => {
    const v = document.createElement('video');
    v.src = m.src; v.loop = true; v.muted = true; v.play();
    return new THREE.VideoTexture(v);
});

const sphereGeo = new THREE.SphereGeometry(0.35, 32, 32);

for (let i = 0; i < 16; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 });
    const s = new THREE.Mesh(sphereGeo, mat);
    
    // วางตำแหน่งสุ่มระหว่างทาง (Z จาก -1 ถึง -8)
    s.position.set(
        (Math.random() - 0.5) * 6,
        Math.random() * 2.5 - 0.5,
        -1 - Math.random() * 8
    );
    s.visible = false; // จะโชว์เมื่อเข้าประตูไปแล้ว
    scene.add(s);
    spheres.push({ 
        mesh: s, 
        timer: 0, 
        isVid: false,
        floatOffset: Math.random() * Math.PI * 2 
    });
}

function updateSphereMedia(sObj) {
    const source = mediaSources[Math.floor(Math.random() * mediaSources.length)];
    if (source.type === 'img') {
        textureLoader.load(source.src, (tex) => {
            sObj.mesh.material.map = tex;
            sObj.mesh.material.needsUpdate = true;
            sObj.isVid = false;
            sObj.timer = 1.0; // 1 second for images
        });
    } else {
        const vidTex = videoElements[Math.floor(Math.random() * videoElements.length)];
        sObj.mesh.material.map = vidTex;
        sObj.mesh.material.needsUpdate = true;
        sObj.isVid = true;
        sObj.timer = 3.0; // 3 seconds for videos
    }
}

// ── ENVELOPE (HIDDEN) ────────────────────────────────────────────────
const envGroup = new THREE.Group();
envGroup.visible = false;
scene.add(envGroup);

// ── TWEEN & ANIMATION ────────────────────────────────────────────────
let phase = 'idle';
let currentTween = null;
let cameraLookTarget = new THREE.Vector3(0, 0.5, -10);

function tween(ms, stepCb, doneCb) {
  const t0 = performance.now();
  currentTween = { ms, stepCb, doneCb, t0, active: true };
}

// ── PUBLIC API ────────────────────────────────────────────────────────
window.threeScene = {
  enterDoor(onDone) {
    phase = 'opening';

    // 1. เปิดประตูให้กว้างขึ้น (145 องศา ~ 0.8 * PI)
    tween(1500, e => {
      doorPivot.rotation.y = -Math.PI * 0.8 * e;
    });

    // 2. เริ่มเดินเข้าไป (Longer walk)
    setTimeout(() => {
      phase = 'zooming';
      spheres.forEach(s => { s.mesh.visible = true; updateSphereMedia(s); });
      
      const startZ = camera.position.z;
      
      tween(6000, e => {
        // เดินไปจนถึงหน้าพอร์ทัล (Z = -9)
        camera.position.z = startZ + (-9.5 - startZ) * e;
        
        // สุ่มการหันมองเล็กน้อย (Camera Sway)
        const lookSwayX = Math.sin(e * 15) * 0.5;
        const lookSwayY = Math.cos(e * 10) * 0.2;
        cameraLookTarget.x = lookSwayX;
        cameraLookTarget.y = 0.5 + lookSwayY;
        camera.lookAt(cameraLookTarget);

        // เมื่อเดินพ้นพอร์ทัล (Pass Z = -10) ให้เรียก Popup
        if (camera.position.z < -8.5 && !window.popupTriggered) {
            window.popupTriggered = true;
            onDone && onDone();
        }
      }, () => {
        phase = 'inside';
      });
    }, 1000);
  },

  showEnvelope() { phase = 'envelope'; },
  fastForwardEnvelope() {},
  hideEnvelope() { phase = 'interactive'; },
  showCelebrate() {
    phase = 'celebrate';
    tween(2000, e => {
      camera.rotation.y += Math.sin(e * Math.PI * 2) * 0.01;
    });
  }
};

// ── LOOP ──────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const t = clock.getElapsedTime();
  const delta = clock.getDelta();

  if (currentTween && currentTween.active) {
    const raw = Math.min((now - currentTween.t0) / currentTween.ms, 1);
    const e = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
    currentTween.stepCb(e);
    if (raw >= 1) {
      currentTween.active = false;
      if (currentTween.doneCb) currentTween.doneCb();
    }
  }

  // Animation ทรงกลมลอยและเปลี่ยนรูป
  spheres.forEach(s => {
    if (!s.mesh.visible) return;
    s.mesh.position.y += Math.sin(t + s.floatOffset) * 0.002;
    s.mesh.rotation.y += 0.01;
    
    s.timer -= delta;
    if (s.timer <= 0) {
        updateSphereMedia(s);
    }
  });

  if (phase === 'idle' || phase === 'opening') {
    heartsList.forEach(obj => {
      obj.mesh.position.y += obj.speedY;
      obj.mesh.position.x += Math.sin(t + obj.phaseX) * 0.003;
      if (obj.mesh.position.y > 2) obj.mesh.position.y = FLOOR_Y;
    });
  }

  if (portalLightMaterial) portalLightMaterial.uniforms.uTime.value = t;
  renderer.render(scene, camera);
}
animate();
