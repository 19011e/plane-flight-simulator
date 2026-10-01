import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecae6);
scene.fog = new THREE.Fog(0x8ecae6, 60, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 10, 18);

const ambientLight = new THREE.HemisphereLight(0xcfe9ff, 0x587d43, 1.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
sunLight.position.set(40, 80, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
scene.add(sunLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({ color: 0x3d7c46, roughness: 0.9, metalness: 0.1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const runway = new THREE.Mesh(
  new THREE.BoxGeometry(220, 1, 24),
  new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 })
);
runway.position.set(0, 0.5, 0);
runway.receiveShadow = true;
scene.add(runway);

const runwayMarkings = new THREE.Group();
for (let i = -8; i <= 8; i += 2) {
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.04, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc })
  );
  stripe.position.set(i * 10, 1.04, 0);
  runwayMarkings.add(stripe);
}
scene.add(runwayMarkings);

const plane = new THREE.Group();
scene.add(plane);

const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.35, roughness: 0.5 });
const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.35 });

const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(1.2, 6.5, 8, 18), bodyMaterial);
fuselage.rotation.z = Math.PI / 2;
fuselage.castShadow = true;
plane.add(fuselage);

const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2), accentMaterial);
cockpit.position.set(1.8, 0.7, 0);
cockpit.rotation.z = -Math.PI / 2;
cockpit.castShadow = true;
plane.add(cockpit);

const wing = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.2, 2.8), accentMaterial);
wing.position.set(0, 0, 0);
wing.castShadow = true;
plane.add(wing);

const tailWing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 1.5), accentMaterial);
tailWing.position.set(-4.5, 0.7, 0);
tailWing.rotation.z = -0.2;
tailWing.castShadow = true;
plane.add(tailWing);

const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 1.4), accentMaterial);
tailFin.position.set(-4.8, 1.4, 0);
tailFin.castShadow = true;
plane.add(tailFin);

const nose = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 22), bodyMaterial);
nose.rotation.z = -Math.PI / 2;
nose.position.set(4.6, 0, 0);
nose.castShadow = true;
plane.add(nose);

const engineLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 1.2, 14), accentMaterial);
engineLeft.rotation.z = Math.PI / 2;
engineLeft.position.set(0.2, -0.5, 1.4);
engineLeft.castShadow = true;
plane.add(engineLeft);

const engineRight = engineLeft.clone();
engineRight.position.z = -1.4;
plane.add(engineRight);

plane.position.set(0, 12, 40);
plane.rotation.order = 'YXZ';

const keys = {};
const state = {
  throttle: 0.55,
  speed: 60,
  pitch: 0,
  roll: 0,
  yaw: 0,
  altitude: 12,
};

const hud = {
  speed: document.getElementById('speed'),
  altitude: document.getElementById('altitude'),
  pitch: document.getElementById('pitch'),
  roll: document.getElementById('roll'),
};

window.addEventListener('keydown', (event) => {
  keys[event.code] = true;
  if (event.code === 'Space') {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

const clock = new THREE.Clock();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateControls(dt) {
  const throttleInput = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  state.throttle = clamp(state.throttle + throttleInput * dt * 0.9, 0.2, 1.4);

  const pitchInput = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
  const rollInput = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  const yawInput = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);

  state.pitch += pitchInput * dt * 0.9;
  state.roll += rollInput * dt * 1.3;
  state.yaw += yawInput * dt * 0.9;

  state.pitch = clamp(state.pitch, -1.2, 1.2);
  state.roll = clamp(state.roll, -1.4, 1.4);
  state.yaw = ((state.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  if (keys.Space) {
    state.speed *= 1 - dt * 0.7;
  }

  state.speed += (state.throttle * 28 - 18) * dt;
  state.speed = clamp(state.speed, 38, 170);
}

function updatePlane(dt) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion);
  const climb = Math.sin(state.pitch) * state.speed * 0.035;
  const descent = 1.8;

  plane.rotation.x = state.pitch;
  plane.rotation.y = state.yaw;
  plane.rotation.z = state.roll;

  plane.position.addScaledVector(forward, state.speed * dt * 0.23);
  plane.position.y += (climb - descent * dt) * 0.9;

  if (plane.position.y < 2) {
    plane.position.y = 2;
    state.speed *= 0.96;
    state.pitch *= 0.8;
  }

  state.altitude = Math.max(0, plane.position.y * 9);
}

function updateCamera() {
  const cameraOffset = new THREE.Vector3(0, 4.5, 16).applyQuaternion(plane.quaternion);
  const desiredPosition = plane.position.clone().add(cameraOffset);
  camera.position.lerp(desiredPosition, 0.08);

  const lookTarget = plane.position.clone().add(new THREE.Vector3(0, 2.5, -18).applyQuaternion(plane.quaternion));
  camera.lookAt(lookTarget);
}

function updateHud() {
  hud.speed.textContent = Math.round(state.speed).toString();
  hud.altitude.textContent = Math.round(state.altitude).toString();
  hud.pitch.textContent = Math.round((THREE.MathUtils.radToDeg(state.pitch))).toString();
  hud.roll.textContent = Math.round((THREE.MathUtils.radToDeg(state.roll))).toString();
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033);

  updateControls(dt);
  updatePlane(dt);
  updateCamera();
  updateHud();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
