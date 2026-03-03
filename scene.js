import * as THREE from 'three';

// ── RENDERER ──────────────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
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
scene.background = new THREE.Color(0xffe4ec);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(0, 0.1, 1.4);
camera.lookAt(0, 0.1, 0);
syncCanvas();

// ── LIGHTING ──────────────────────────────────────────────────────────
const ambLight = new THREE.AmbientLight(0xffffff, 2.5);
scene.add(ambLight);

const sunLight = new THREE.DirectionalLight(0xfff8f0, 3.5);
sunLight.position.set(3, 6, 5);
sunLight.castShadow = true;
scene.add(sunLight);

const p1 = new THREE.PointLight(0xff85c2, 4, 20);
p1.position.set(-2, 4, 3);
scene.add(p1);

const p2 = new THREE.PointLight(0xffd6a8, 3, 15);
p2.position.set(3, 2, -3);
scene.add(p2);

// ── MATERIALS ─────────────────────────────────────────────────────────
const mat = (col) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 });
const pinkMat = mat(0xfff0f5);
const woodMat = mat(0xd4a070);
const catMat = new THREE.MeshStandardMaterial({ color: 0xfffcf9, roughness: 0.9 });
const blackMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
const noseMat = new THREE.MeshStandardMaterial({ color: 0xffa0b0, roughness: 0.6 });
const cakeMat = new THREE.MeshStandardMaterial({ color: 0xffd1dc, roughness: 0.5 });
const glazeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

// ── ROOM ──────────────────────────────────────────────────────────────
const ROW = 14, ROH = 7, ROD = 16;
const FLOOR_Y = -1.5;

function addPlane(w, h, rotX, rotY, x, y, z, m) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  p.rotation.x = rotX; p.rotation.y = rotY; p.position.set(x, y, z);
  p.receiveShadow = true;
  scene.add(p);
}
// Floor
addPlane(ROW, ROD, -Math.PI / 2, 0, 0, FLOOR_Y, -ROD / 2 + 2, mat(0xf5dce8));
// Back Wall
addPlane(ROW, ROH, 0, 0, 0, FLOOR_Y + ROH / 2, -ROD / 2 + 2, pinkMat);
// L/R Walls
addPlane(ROD, ROH, 0, Math.PI / 2, -ROW / 2, FLOOR_Y + ROH / 2, -ROD / 2 + 2, pinkMat);
addPlane(ROD, ROH, 0, -Math.PI / 2, ROW / 2, FLOOR_Y + ROH / 2, -ROD / 2 + 2, pinkMat);

// ── DOOR ──────────────────────────────────────────────────────────────
const DW = 1.2, DH = 3.0, FT = 0.1;
const DOOR_Y = FLOOR_Y + DH / 2;

function addB(w, h, d, x, y, z, m) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = true; b.receiveShadow = true;
  scene.add(b); return b;
}
// Frame
addB(DW + FT * 2, FT, 0.2, 0, DOOR_Y + DH / 2 + FT / 2, 0.1, woodMat);
addB(FT, DH, 0.2, -DW / 2 - FT / 2, DOOR_Y, 0.1, woodMat);
addB(FT, DH, 0.2, DW / 2 + FT / 2, DOOR_Y, 0.1, woodMat);

const doorPivot = new THREE.Group();
doorPivot.position.set(-DW / 2, DOOR_Y, 0.05);
scene.add(doorPivot);

const panel = new THREE.Mesh(new THREE.BoxGeometry(DW, DH - 0.03, 0.08), mat(0xe8b870));
panel.position.set(DW / 2, 0, 0);
panel.castShadow = true;
doorPivot.add(panel);

// Knob
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), mat(0xffd060));
knob.position.set(DW - 0.15, 0, 0.08);
doorPivot.add(knob);

// ── CAT (Pure Three.js) ───────────────────────────────────────────────
const cat = new THREE.Group();
// Place cat deep in the room, facing away (Math.PI)
cat.position.set(0, FLOOR_Y, -2);
cat.rotation.y = Math.PI;
scene.add(cat);

// Body
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.3, 4, 16), catMat);
body.position.y = 0.55; body.castShadow = true;
cat.add(body);

// Head Group
const headGrp = new THREE.Group();
headGrp.position.set(0, 1.15, 0);
cat.add(headGrp);
const headObj = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), catMat);
headObj.castShadow = true;
headGrp.add(headObj);

// Ears
const earG = new THREE.ConeGeometry(0.12, 0.25, 16);
const el = new THREE.Mesh(earG, catMat); el.position.set(-0.2, 0.3, 0); el.rotation.z = Math.PI / 6;
const er = new THREE.Mesh(earG, catMat); er.position.set(0.2, 0.3, 0); er.rotation.z = -Math.PI / 6;
headGrp.add(el, er);
// Face (Eyes, Nose)
const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), blackMat); eyeL.position.set(-0.12, 0.05, 0.33);
const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), blackMat); eyeR.position.set(0.12, 0.05, 0.33);
const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), noseMat); nose.position.set(0, -0.05, 0.35);
headGrp.add(eyeL, eyeR, nose);

// Limbs
const armGeom = new THREE.CapsuleGeometry(0.08, 0.25, 4, 16);
const armL = new THREE.Mesh(armGeom, catMat); armL.position.set(-0.4, 0.65, 0); armL.rotation.z = -Math.PI / 4;
const armR = new THREE.Mesh(armGeom, catMat); armR.position.set(0.4, 0.65, 0); armR.rotation.z = Math.PI / 4;
cat.add(armL, armR);

const legGeom = new THREE.CapsuleGeometry(0.1, 0.2, 4, 16);
const legL = new THREE.Mesh(legGeom, catMat); legL.position.set(-0.15, 0.15, 0);
const legR = new THREE.Mesh(legGeom, catMat); legR.position.set(0.15, 0.15, 0);
cat.add(legL, legR);

// Tail
const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 4, 16), catMat);
tail.position.set(0, 0.3, -0.35); tail.rotation.x = -Math.PI / 3;
cat.add(tail);

// ── CAKE (Hidden initially) ───────────────────────────────────────────
const cake = new THREE.Group();
cake.visible = false;
cake.position.set(0, 0.5, 0.5);  // held in front of cat body
cat.add(cake);

const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 32), cakeMat);
const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 32), glazeMat);
drip.position.y = 0.075;
const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), mat(0x87cefa));
cand.position.y = 0.2;
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
flame.position.y = 0.3;
const glow = new THREE.PointLight(0xffaa00, 2, 5);
glow.position.y = 0.3;
cake.add(base, drip, cand, flame, glow);

// ── STATE ─────────────────────────────────────────────────────────────
let phase = 'intro'; // intro -> open -> walk -> chat -> celebrate
document.dispatchEvent(new CustomEvent('sceneReady')); // Ready instantly!

function tween(ms, stepCb, doneCb) {
  const t0 = performance.now();
  (function tick(now) {
    const raw = Math.min((now - t0) / ms, 1);
    const e = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
    stepCb(e);
    if (raw < 1) requestAnimationFrame(tick);
    else doneCb && doneCb();
  })(t0);
}

// ── PUBLIC API ────────────────────────────────────────────────────────
window.threeScene = {
  enterDoor(onDone) {
    phase = 'open';
    // 1. Open door
    tween(2000, e => { doorPivot.rotation.y = -Math.PI * 0.75 * e; });
    // 2. Zoom camera through door
    setTimeout(() => {
      const fromZ = camera.position.z;
      tween(1500, e => {
        camera.position.z = fromZ + (-1.5 - fromZ) * e;
      }, () => {
        phase = 'walk';
        onDone && onDone();
      });
    }, 1200);
  },

  showCat(onDone) {
    // Cat is walking away. Make it stop, turn around, and show cake.
    setTimeout(() => {
      phase = 'turn';
      // Rotate cat 180 degrees to face camera
      const startY = cat.rotation.y;
      tween(1000, e => {
        cat.rotation.y = startY - Math.PI * e;
      }, () => {
        phase = 'chat';
        // Show cake and raise arms
        cake.visible = true;
        armL.rotation.z = Math.PI / 6; armL.rotation.x = -Math.PI / 3; armL.position.set(-0.25, 0.6, 0.2);
        armR.rotation.z = -Math.PI / 6; armR.rotation.x = -Math.PI / 3; armR.position.set(0.25, 0.6, 0.2);

        // Zoom camera in on the cake / face
        const cZ = camera.position.z, cY = camera.position.y;
        tween(1200, e => {
          camera.position.z = cZ + (cat.position.z + 1.2 - cZ) * e;
          camera.position.y = cY + (0.9 - cY) * e;
        }, onDone);
      });
    }, 1500); // let intro walk play a bit
  },

  showBirthday() {
    phase = 'birthday';
    const cZ = camera.position.z, cY = camera.position.y;
    tween(800, e => {
      camera.position.z = cZ + (cat.position.z + 1.8 - cZ) * e;
      camera.position.y = cY + (0.6 - cY) * e;
    });
  },

  showCatTaunt() {
    phase = 'taunt';
  },

  showCelebrate() {
    phase = 'celebrate';
    const cZ = camera.position.z, cY = camera.position.y;
    tween(1500, e => {
      camera.position.z = cZ + (cat.position.z + 2.5 - cZ) * e;
      camera.position.y = cY + (1.2 - cY) * e;
      cat.rotation.y = e * Math.PI * 4; // spin around happily
    });
  },
};

// ── LOOP ──────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // If cat is walking away or turning: leg animation + waddle
  if (phase === 'intro' || phase === 'open' || phase === 'walk') {
    // walks deeper into room
    cat.position.z -= 0.005;
    legL.position.z = Math.sin(t * 8) * 0.15;
    legR.position.z = Math.sin(t * 8 + Math.PI) * 0.15;
    armL.rotation.x = Math.sin(t * 8 + Math.PI) * 0.2;
    armR.rotation.x = Math.sin(t * 8) * 0.2;
    cat.position.y = FLOOR_Y + Math.abs(Math.sin(t * 8)) * 0.05;
    tail.rotation.z = Math.sin(t * 4) * 0.2;
  } else if (phase === 'chat' || phase === 'birthday') {
    // idle bob
    cat.position.y = FLOOR_Y + Math.sin(t * 2) * 0.02 + 0.02;
    legL.position.z = 0; legR.position.z = 0;
    tail.rotation.z = Math.sin(t * 3) * 0.15;
    headGrp.rotation.y = Math.sin(t * 1.5) * 0.05;
  } else if (phase === 'taunt') {
    // angry fast shake + head turn
    headGrp.rotation.y = -Math.PI / 6; // turn head away slightly
    cat.position.y = FLOOR_Y + Math.abs(Math.sin(t * 12)) * 0.04;
    tail.rotation.z = Math.sin(t * 10) * 0.4;
  } else if (phase === 'celebrate') {
    // jumping loop if spin is done
    if (Math.abs(cat.rotation.y % (Math.PI * 2)) < 0.1) {
      cat.position.y = FLOOR_Y + Math.abs(Math.sin(t * 6)) * 0.3;
      armL.rotation.z = Math.PI / 2 + Math.sin(t * 10) * 0.2;
      armR.rotation.z = -Math.PI / 2 - Math.sin(t * 10) * 0.2;
    }
  }

  p1.position.x = Math.sin(t * 0.3) * 3;
  renderer.render(scene, camera);
}
animate();
