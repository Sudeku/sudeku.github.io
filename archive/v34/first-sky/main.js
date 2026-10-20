/* Independent First Sky prototype. Intentionally does not modify the Sudeki host site. */
(() => {
  const T = window.THREE;
  const host = document.getElementById('sky');
  const canvas = document.getElementById('world');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(pointer: coarse)');
  const backUrl = location.pathname.includes('/parallel/') ? '../../publish-v21/web/index.html#/corridor' : '../index.html#/corridor';
  document.querySelectorAll('[data-back]').forEach(link => {
    link.href = backUrl;
    if (window.parent !== window) link.addEventListener('click', event => {
      event.preventDefault();
      window.parent.location.hash = '#/corridor';
    });
  });
  const titles = [
    ['На краю неба', 'Под ногами камень. Дальше — только облака.'],
    ['Арки без стен', 'Здесь остался проход, даже когда исчезли стены.'],
    ['Световой маяк', 'Можно зажечь его. Вдалеке ответят другие острова.']
  ];
  let progress = 0, targetProgress = 0, yaw = 0, targetYaw = 0, pitch = 0, targetPitch = 0, cameraLift = 0, cameraLiftTarget = 0;
  let station = 0, awakened = false, dragging = null, lastTime = performance.now();
  const keys = new Set();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;

  function setStation(index, travel = true) {
    station = clamp(index, 0, 2);
    host.dataset.station = String(station);
    host.querySelector('.discovery-number').textContent = `0${station + 1} / 03`;
    host.querySelector('.discovery strong').textContent = titles[station][0];
    host.querySelector('.discovery span').textContent = station === 2 && awakened ? 'На далёком острове вспыхнул ответный огонь.' : titles[station][1];
    host.querySelectorAll('[data-go]').forEach(button => button.setAttribute('aria-current', Number(button.dataset.go) === station ? 'step' : 'false'));
    if (travel) targetProgress = [0, .49, 1][station];
  }
  function goTo(index) { targetProgress = [0, .49, 1][clamp(index, 0, 2)]; }
  host.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.go))));
  host.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => goTo(station + Number(button.dataset.step))));

  if (!T) { host.dataset.ready = 'true'; return; }
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    host.dataset.ready = 'true';
    host.dataset.render = 'fallback';
    console.warn('First Sky WebGL unavailable', error);
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile.matches ? 1.35 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  renderer.shadowMap.enabled = !mobile.matches;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(62, 1, .08, 500);
  camera.rotation.order = 'YXZ';
  scene.add(new T.HemisphereLight(0xc7d7ff, 0x483b50, 3.1));
  const sun = new T.DirectionalLight(0xffc799, 3.3);
  sun.position.set(-19, 24, -44);
  sun.castShadow = !mobile.matches;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 85 });
  sun.shadow.bias = -.0003;
  scene.add(sun);
  const fill = new T.DirectionalLight(0xa6a8f0, 1.9);
  fill.position.set(16, 10, 14);
  scene.add(fill);

  const loader = new T.TextureLoader();
  // The distant landscape must live in the same 3D coordinate system as the
  // island. A fixed CSS image made camera motion look like the island slid
  // over a stationary backdrop instead of the visitor looking around.
  const horizonTexture = loader.load('../../../first-sky/assets/sky-matte.png');
  horizonTexture.colorSpace = T.SRGBColorSpace;
  // Extend the source beyond the largest look angle without stretching its
  // central composition. Mirroring avoids a hard edge when looking sideways.
  horizonTexture.wrapS = horizonTexture.wrapT = T.MirroredRepeatWrapping;
  horizonTexture.repeat.set(2200 / 900, 2200 / 900);
  horizonTexture.offset.set(-(2200 / 900 - 1) / 2, -(2200 / 900 - 1) / 2);
  const horizon = new T.Mesh(
    new T.PlaneGeometry(2200, 2200 * 941 / 1672),
    new T.MeshBasicMaterial({ map: horizonTexture, depthWrite: false, fog: false, toneMapped: false })
  );
  horizon.position.set(0, 2.5, -250);
  horizon.renderOrder = -100;
  scene.add(horizon);
  function texture(file, x, y) {
    const tex = loader.load('../../../first-sky/assets/' + file);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(x, y);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }
  const rock = new T.MeshStandardMaterial({ map: texture('rock.jpg', 4, 4), color: 0xaaa1b8, roughness: .98, flatShading: true });
  const path = new T.MeshStandardMaterial({ map: texture('stone.jpg', 2, 2), color: 0xcac3c8, roughness: .92 });
  const moss = new T.MeshStandardMaterial({ map: texture('grass.jpg', 8, 8), color: 0x7c8e84, roughness: 1 });
  const carved = new T.MeshStandardMaterial({ map: texture('rock.jpg', 1.4, 1.4), color: 0xa9a2b2, roughness: .96, metalness: .02 });
  const carvedDark = new T.MeshStandardMaterial({ map: texture('rock.jpg', 1, 1), color: 0x777087, roughness: .98 });
  const gilt = new T.MeshStandardMaterial({ color: 0xb48d79, metalness: .66, roughness: .35 });
  const glow = new T.MeshStandardMaterial({ color: 0xffdbbd, emissive: 0xf3aa89, emissiveIntensity: .48, metalness: .08, roughness: .28 });
  const coreMaterial = new T.MeshStandardMaterial({ color: 0x987eac, emissive: 0xad77ab, emissiveIntensity: .65, metalness: .18, roughness: .29, flatShading: true });
  const ghost = new T.MeshBasicMaterial({ color: 0xf1d9dd, transparent: true, opacity: .08, depthWrite: false, side: T.DoubleSide });
  const gold = new T.Color(0xffd8a5);

  function add(mesh, x = 0, y = 0, z = 0, parent = scene) {
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.isMesh && !mesh.material.transparent;
    mesh.receiveShadow = mesh.isMesh;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(rt, rb, h, mat, x, y, z, n = 12, parent = scene) {
    return add(new T.Mesh(new T.CylinderGeometry(rt, rb, h, n), mat), x, y, z, parent);
  }
  function box(w, h, d, mat, x, y, z, parent = scene) {
    return add(new T.Mesh(new T.BoxGeometry(w, h, d), mat), x, y, z, parent);
  }
  function seeded(i) { const x = Math.sin(i * 79.717 + 12.12) * 43758.545; return x - Math.floor(x); }

  // One contiguous floating island with a genuinely traversable stone approach.
  // The horizon image stays distant while all nearby architecture has real depth.
  const top = new T.Mesh(new T.CircleGeometry(17.8, 96), moss);
  top.rotation.x = -Math.PI / 2;
  top.scale.set(.81, 1.35, 1);
  add(top, 0, -.10, -2.8);
  top.receiveShadow = true;
  const segments = 96, rings = 10, position = [], uv = [], indices = [];
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    for (let i = 0; i <= segments; i++) {
      const a = i / segments * Math.PI * 2;
      const noise = Math.sin(a * 7) * .045 + Math.sin(a * 13 + 1) * .03 + Math.sin(a * 19 - t * 2) * .025;
      const radius = (17.7 * (1 - .62 * t)) * (1 + noise);
      const x = Math.cos(a) * radius * .81;
      const z = -2.8 + Math.sin(a) * radius * 1.35;
      const y = -.18 - t * 10.5 + Math.sin(a * 11 + t * 14) * .32 * t;
      position.push(x, y, z);
      uv.push(i / segments * 6, t * 3);
      if (ring < rings && i < segments) {
        const k = ring * (segments + 1) + i;
        indices.push(k, k + segments + 1, k + 1, k + 1, k + segments + 1, k + segments + 2);
      }
    }
  }
  const cliffGeo = new T.BufferGeometry();
  cliffGeo.setAttribute('position', new T.Float32BufferAttribute(position, 3));
  cliffGeo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  cliffGeo.setIndex(indices);
  cliffGeo.computeVertexNormals();
  add(new T.Mesh(cliffGeo, rock));

  // Path slabs are partly buried, with a deliberate break before the beacon.
  for (let i = 0; i < 25; i++) {
    const z = 13 - i * 1.1;
    const x = Math.sin(i * .31) * .38;
    const slab = box(2.9 + seeded(i) * .5, .16, 1.04, path, x, .02, z);
    slab.rotation.y = (seeded(i + 40) - .5) * .055;
    slab.receiveShadow = true;
  }
  // Layered rim stones, plants, and ruins give the island a believable scale.
  for (let i = 0; i < 110; i++) {
    const a = i * 2.39996, r = 4.3 + seeded(i + 90) * 11.2;
    const x = Math.cos(a) * r * .79, z = -2.8 + Math.sin(a) * r * 1.25;
    if (Math.abs(x) < 2.2 && z > -14) continue;
    const stone = new T.Mesh(new T.DodecahedronGeometry(.25 + seeded(i + 8) * .42, 0), i % 4 ? carvedDark : carved);
    stone.rotation.set(seeded(i + 4) * 3, seeded(i + 18) * 3, seeded(i + 22) * 3);
    stone.scale.set(1.2, .34 + seeded(i + 12) * .4, .8);
    add(stone, x, .1, z);
  }
  for (let i = 0; i < 130; i++) {
    const a = i * 2.39996, r = 5 + seeded(i + 301) * 11.2;
    const x = Math.cos(a) * r * .78, z = -2.8 + Math.sin(a) * r * 1.22;
    if (Math.abs(x) < 2.3 && z > -13) continue;
    const floret = add(new T.Mesh(new T.IcosahedronGeometry(.048 + seeded(i + 9) * .035, 0), i % 3 ? glow : carved), x, .23, z);
    floret.castShadow = false;
  }

  function arch(z, width, height, broken = false) {
    const group = new T.Group();
    scene.add(group);
    group.position.z = z;
    const colHeight = height - width * .46;
    for (const side of [-1, 1]) {
      const x = side * width / 2;
      box(.84, .38, .92, carved, x, .18, 0, group);
      cylinder(.28, .36, colHeight, carved, x, .38 + colHeight / 2, 0, 12, group);
      cylinder(.48, .28, .28, carved, x, .42 + colHeight, 0, 12, group);
      for (const y of [.65, 1.05, colHeight * .6]) {
        const band = cylinder(.295, .295, .05, gilt, x, y, 0, 12, group);
        band.castShadow = false;
      }
    }
    if (!broken) {
      const torus = add(new T.Mesh(new T.TorusGeometry(width / 2 - .02, .39, 8, 36, Math.PI), carved), 0, .42 + colHeight, 0, group);
      torus.castShadow = true;
      add(new T.Mesh(new T.TorusGeometry(width / 2 - .05, .025, 5, 36, Math.PI), gilt), 0, .42 + colHeight, .42, group);
    } else {
      const part = add(new T.Mesh(new T.TorusGeometry(width / 2 - .02, .4, 8, 16, Math.PI * .46), carved), 0, .42 + colHeight, 0, group);
      part.rotation.z = .08;
    }
    return group;
  }
  arch(-3.1, 6.9, 6.3);
  arch(-10.9, 6.2, 5.4);
  for (const [x, z, h] of [[-7, 3.4, 2.5], [7.2, .2, 3.4], [-7.9, -7.2, 4.4], [7.5, -13.8, 3.1]]) {
    cylinder(.31, .48, h, carved, x, h / 2, z);
    cylinder(.47, .4, .24, carved, x, h, z);
    box(1.05, .2, 1.05, carvedDark, x, .1, z);
  }
  // The final beacon has a physical dais, engraved rings, and a responsive core.
  const beacon = new T.Group();
  beacon.position.set(0, 0, -14.2);
  scene.add(beacon);
  cylinder(3.5, 3.8, .34, carvedDark, 0, .03, 0, 48, beacon);
  cylinder(2.82, 3.1, .21, carved, 0, .28, 0, 48, beacon);
  const ring = add(new T.Mesh(new T.TorusGeometry(2.54, .045, 8, 64), gilt), 0, .41, 0, beacon);
  ring.rotation.x = Math.PI / 2;
  const core = add(new T.Mesh(new T.IcosahedronGeometry(.78, 1), coreMaterial), 0, 2.42, 0, beacon);
  core.castShadow = false;
  const innerRing = add(new T.Mesh(new T.TorusGeometry(1.45, .075, 10, 80), gilt), 0, 2.36, 0, beacon);
  innerRing.rotation.y = .4;
  const outerRing = add(new T.Mesh(new T.TorusGeometry(2.06, .045, 10, 80), gilt), 0, 2.36, 0, beacon);
  outerRing.rotation.x = .28;
  const coreLight = new T.PointLight(0xffbd93, 1.6, 15, 2);
  coreLight.position.set(0, 2.4, -14.2);
  scene.add(coreLight);
  const responses = new T.Group();
  scene.add(responses);
  for (const [x, y, z, radius] of [[-22, 5, -76, .42], [31, 7, -104, .58], [-42, 8, -124, .72]]) {
    const response = add(new T.Mesh(new T.SphereGeometry(radius, 12, 8), new T.MeshBasicMaterial({ color: 0xffdfbc, transparent: true, opacity: .86 })), x, y, z, responses);
    response.castShadow = false;
    const aura = add(new T.Mesh(new T.SphereGeometry(radius * 3.2, 12, 8), new T.MeshBasicMaterial({ color: 0xf2a989, transparent: true, opacity: .12, depthWrite: false })), x, y, z, responses);
    aura.castShadow = false;
  }
  responses.visible = false;
  const motes = [];
  for (let i = 0; i < 48; i++) {
    const material = new T.MeshBasicMaterial({ color: i % 4 ? 0xf2c8bd : 0xd1f2e4, transparent: true, opacity: .18 + seeded(i + 100) * .23, depthWrite: false });
    const mote = add(new T.Mesh(new T.SphereGeometry(.015 + seeded(i) * .027, 5, 4), material));
    mote.userData = { x: (seeded(i + 7) - .5) * 17, y: .5 + seeded(i + 13) * 6, z: -18 + seeded(i + 20) * 35, phase: seeded(i + 31) * 6.28 };
    motes.push(mote);
  }
  // Faint airy veils provide depth without expensive floor reflections.
  for (let i = 0; i < 6; i++) {
    const veil = add(new T.Mesh(new T.PlaneGeometry(14 + i * 3, 3), ghost), (i % 2 ? 1 : -1) * (9 + i), -1.5, -7 - i * 4);
    veil.rotation.x = -.31;
    veil.rotation.y = (i % 2 ? -1 : 1) * .12;
  }

  const gltf = new T.GLTFLoader();
  const assetReady = [];
  async function scenery(file, placements, height, offsetY = 0) {
    const loaded = await gltf.loadAsync('../../../first-sky/assets/' + file);
    const original = loaded.scene;
    original.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(original);
    const size = bounds.getSize(new T.Vector3());
    const bottom = bounds.min.y;
    for (const [x, z, scale = 1, rotate = 0] of placements) {
      const wrapper = new T.Group();
      wrapper.position.set(x, offsetY - .03, z);
      wrapper.rotation.y = rotate;
      scene.add(wrapper);
      const model = original.clone(true);
      const factor = height / Math.max(.01, size.y) * scale;
      model.scale.setScalar(factor);
      model.position.y = -bottom * factor;
      model.traverse(node => { if (node.isMesh) { node.castShadow = !mobile.matches; node.receiveShadow = true; } });
      wrapper.add(model);
    }
  }
  assetReady.push(scenery('tree.glb', [[-9, 5, 1.1, .4], [9, -3, .95, 2], [-8, -12, .8, .9], [8.5, -16, .7, 1.3]], 5.6));
  assetReady.push(scenery('fern.glb', [[-4.7, 9, .6], [5.8, 7, .7], [-5.2, -1, .65], [6.8, -8, .8], [-5, -14, .75]], 1.2));
  // A few modelled cliffs sit below the edges and sell real three-dimensional depth.
  assetReady.push(scenery('cliff.glb', [[-11.8, -1, 1.1, 1], [11.9, -7, 1.2, 3], [-11, -17, .8, 2]], 7, -6.7));

  const signalButton = host.querySelector('.signal');
  signalButton.addEventListener('click', () => {
    awakened = !awakened;
    host.dataset.awake = String(awakened);
    responses.visible = awakened;
    signalButton.setAttribute('aria-pressed', String(awakened));
    signalButton.querySelector('small').textContent = awakened ? 'СВЕТ ПРОСНУЛСЯ' : 'ПРОБУДИТЬ СВЕТ';
    if (station === 2) host.querySelector('.discovery span').textContent = awakened ? 'На далёком острове вспыхнул ответный огонь.' : titles[2][1];
    if (awakened && targetProgress < .55) goTo(2);
  });

  canvas.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    if (mobile.matches) cameraLiftTarget = clamp(cameraLiftTarget + event.deltaY * .009, -1, 5);
    else targetProgress = clamp(targetProgress + event.deltaY * (event.deltaMode === 1 ? 15 : 1) * .00024, 0, 1);
  }, { passive: false });
  canvas.addEventListener('pointerdown', event => {
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging || dragging.id !== event.pointerId) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    targetYaw = clamp(targetYaw - dx * (mobile.matches ? .004 : .0016), -.36, .36);
    // Scrolling down (finger moves up) raises the camera in this world.
    if (mobile.matches) cameraLiftTarget = clamp(cameraLiftTarget - dy * .019, -1, 5);
    else targetPitch = clamp(targetPitch - dy * .0013, -.16, .16);
    dragging.x = event.clientX;
    dragging.y = event.clientY;
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, () => dragging = null);
  window.addEventListener('keydown', event => {
    if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault(); keys.add(event.code);
    }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    camera.aspect = w / h;
    camera.fov = w < 700 ? 69 : 62;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  new ResizeObserver(resize).observe(host);
  resize();
  let previousStation = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(.05, (now - lastTime) / 1000 || .016);
    lastTime = now;
    if (keys.has('KeyW') || keys.has('ArrowUp')) targetProgress = clamp(targetProgress + dt * .23, 0, 1);
    if (keys.has('KeyS') || keys.has('ArrowDown')) targetProgress = clamp(targetProgress - dt * .23, 0, 1);
    if (keys.has('ArrowLeft')) targetYaw = clamp(targetYaw + dt * .45, -.36, .36);
    if (keys.has('ArrowRight')) targetYaw = clamp(targetYaw - dt * .45, -.36, .36);
    const follow = reduced.matches ? 1 : 1 - Math.exp(-dt * 2.8);
    progress = lerp(progress, targetProgress, follow);
    yaw = lerp(yaw, targetYaw, follow * 1.4);
    pitch = lerp(pitch, targetPitch, follow * 1.4);
    cameraLift = lerp(cameraLift, cameraLiftTarget, follow * 1.4);
    const z = lerp(11.8, -6.2, progress);
    camera.position.set(Math.sin(progress * 4) * .22, 2.55 + cameraLift + (reduced.matches ? 0 : Math.sin(now * .0014) * .022), z);
    // As the eye approaches the far rim, its projection naturally falls lower
    // on screen. A small downward gaze adjustment keeps the island anchored
    // instead of making the whole landmass seem to sink while walking.
    const travelPitch = -.06 * progress;
    camera.rotation.set(pitch + travelPitch + Math.sin(progress * Math.PI) * -.012, yaw + Math.sin(progress * 3) * .025, 0);
    const nearest = progress < .24 ? 0 : progress < .73 ? 1 : 2;
    if (nearest !== previousStation) { previousStation = nearest; setStation(nearest, false); }
    if (!reduced.matches) {
      core.position.y = 2.42 + Math.sin(now * .0013) * .18;
      innerRing.rotation.y += dt * (awakened ? .54 : .14);
      outerRing.rotation.x += dt * (awakened ? -.28 : -.065);
      for (const mote of motes) {
        const m = mote.userData;
        mote.position.set(m.x + Math.sin(now * .0003 + m.phase) * .3, m.y + Math.sin(now * .0009 + m.phase) * .28, m.z);
      }
    }
    glow.emissiveIntensity = lerp(glow.emissiveIntensity, awakened ? 2.1 : .48, Math.min(1, dt * 2));
    coreMaterial.emissiveIntensity = lerp(coreMaterial.emissiveIntensity, awakened ? 2.5 : .65, Math.min(1, dt * 2));
    coreLight.intensity = lerp(coreLight.intensity, awakened ? 5.5 : 1.6, Math.min(1, dt * 2));
    renderer.render(scene, camera);
    host.dataset.progress = progress.toFixed(3);
    host.dataset.pitch = pitch.toFixed(3);
    host.dataset.lift = cameraLift.toFixed(3);
    host.dataset.travelPitch = travelPitch.toFixed(3);
    host.dataset.render = 'webgl';
  }
  requestAnimationFrame(frame);
  Promise.allSettled(assetReady).then(results => {
    results.filter(result => result.status === 'rejected').forEach(result => console.warn('First Sky optional model failed', result.reason));
    host.dataset.ready = 'true';
  });
  setTimeout(() => { host.dataset.ready = 'true'; }, 9000);
})();
