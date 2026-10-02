// box.js - the 3D cardboard box. Needs three.js r128 and a loaded logo Image.
// Functions you can call from outside: initBox, addToBox, removeFromBox, checkoutBox, reopenBox, getBoxMode

// ---------- box settings ----------
const W = 1.6, H = 1.2, D = 1.2, T = 0.02;
const CARD_W = 0.9, CARD_D = 0.6, CARD_T = 0.04;
const CLOSE_TOTAL = 6.2;
const OPEN_TOTAL = 1.8;
const GOLD = "#c9962e";

let renderer, scene, camera, stage, tape, logo;
let flaps = [];
let cards = [];
let mode = "open";       // open, closing, closed, opening
let modeTime = 0;
let doneCallback = null;
let openedCallback = null;

const homePos = new THREE.Vector3(0, 2.7, 5.0);
const homeLook = new THREE.Vector3(0, 0.6, 0);
const endPos = new THREE.Vector3(0, 0.9, 5.6);
const endLook = new THREE.Vector3(0, 0.65, 0);
const lookPoint = new THREE.Vector3();
let posCurve, lookCurve;

// ---------- textures ----------

// smooth clean kraft cardboard like the reference picture:
// flat warm tan, a soft light-to-dark fade, and only a very faint grain
function makeCardboard(r, g, b) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
  ctx.fillRect(0, 0, 256, 256);

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "rgba(255,235,200,0.10)");
  grad.addColorStop(1, "rgba(90,55,20,0.10)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2500; i++) {
    if (Math.random() < 0.5) {
      ctx.fillStyle = "rgba(90,55,20," + (Math.random() * 0.05) + ")";
    } else {
      ctx.fillStyle = "rgba(255,240,215," + (Math.random() * 0.06) + ")";
    }
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function makeMat(tex) {
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 });
}

// the three handling symbols printed on the box (this way up, keep dry, fragile)
function makeSymbolsTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext("2d");
  ctx.strokeStyle = "#4a3320";
  ctx.fillStyle = "#4a3320";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";

  // this way up: two arrows
  const arrowX = [50, 95];
  for (let i = 0; i < arrowX.length; i++) {
    const x = arrowX[i];
    ctx.beginPath();
    ctx.moveTo(x, 135);
    ctx.lineTo(x, 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 16, 60);
    ctx.lineTo(x, 28);
    ctx.lineTo(x + 16, 60);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(30, 145);
  ctx.lineTo(115, 145);
  ctx.stroke();

  // keep dry: umbrella
  ctx.beginPath();
  ctx.arc(256, 85, 58, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(256, 85);
  ctx.lineTo(256, 132);
  ctx.arc(244, 132, 12, 0, Math.PI);
  ctx.stroke();

  // fragile: wine glass
  ctx.beginPath();
  ctx.moveTo(378, 25);
  ctx.lineTo(442, 25);
  ctx.quadraticCurveTo(442, 88, 410, 92);
  ctx.quadraticCurveTo(378, 88, 378, 25);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(410, 92);
  ctx.lineTo(410, 140);
  ctx.moveTo(388, 142);
  ctx.lineTo(432, 142);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// logo on a transparent plane (printed ink on the box)
function makeLogoPlane(width) {
  const tex = new THREE.Texture(logo);
  tex.needsUpdate = true;
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.92, roughness: 0.95, depthWrite: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, width * logo.height / logo.width), mat);
}

function makeTapeTexture() {
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 190;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#e6cf98";
  ctx.fillRect(0, 0, 1400, 190);
  const lh = 110;
  const lw = lh * logo.width / logo.height;
  for (let x = 60; x < 1400; x += 440) {
    ctx.drawImage(logo, x, (190 - lh) / 2, lw, lh);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function makeCardTexture(tag, title, priceText, free) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 341;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, 512, 341);

  // header with the brand logo
  ctx.fillStyle = "#f3ece0";
  ctx.fillRect(0, 0, 512, 84);
  const lh = 54;
  ctx.drawImage(logo, 24, 15, lh * logo.width / logo.height, lh);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 84, 512, 6);

  ctx.fillStyle = "#999";
  ctx.font = "bold 20px monospace";
  ctx.fillText(tag, 24, 128);

  ctx.fillStyle = "#111";
  ctx.font = "bold 40px Arial";
  const words = title.split(" ");
  let line = "";
  let y = 178;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > 460 && line !== "") {
      ctx.fillText(line, 24, y);
      line = words[i] + " ";
      y += 46;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, 24, y);

  if (free) {
    ctx.fillStyle = "#e3f5ea";
    ctx.fillRect(24, 272, 110, 42);
    ctx.fillStyle = "#1f7a4d";
    ctx.font = "bold 26px Arial";
    ctx.fillText("FREE", 46, 302);
  } else {
    ctx.fillStyle = "#111";
    ctx.font = "bold 40px Arial";
    ctx.fillText(priceText, 24, 305);
    ctx.fillStyle = "#999";
    ctx.font = "bold 18px monospace";
    ctx.fillText("ONE-TIME", 370, 305);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// ---------- scene ----------
function initBox(stageElement, logoImage, onOpened) {
  stage = stageElement;
  logo = logoImage;
  openedCallback = onOpened;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  stage.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.05, 60);

  // soft even light so the colours stay close to the reference
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcdb89a, 0.8));

  const key = new THREE.DirectionalLight(0xfff4e5, 0.8);
  key.position.set(3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.bias = -0.0006;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.25);
  fill.position.set(-4, 2, 3);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.22 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // soft dark patch under the box
  const sc = document.createElement("canvas");
  sc.width = 128;
  sc.height = 128;
  const sctx = sc.getContext("2d");
  const sg = sctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  sg.addColorStop(0, "rgba(0,0,0,0.5)");
  sg.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 128, 128);
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 1.4, D + 1.4),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.002;
  scene.add(contact);

  // colours taken from the reference picture (outer face slightly darker than inner)
  const outer = makeMat(makeCardboard(198, 156, 106));
  const inner = makeMat(makeCardboard(208, 168, 118));
  const edge = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 1 });

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * T, T, D - 2 * T), [edge, edge, inner, outer, edge, edge]);
  bottom.position.y = T / 2;
  bottom.receiveShadow = true;
  scene.add(bottom);

  function addWall(width, dist, rotY) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(width, H, T), [edge, edge, edge, edge, outer, inner]);
    m.position.set(0, H / 2, dist - T / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    g.rotation.y = rotY;
    g.add(m);
    scene.add(g);
  }
  addWall(W, D / 2, 0);
  addWall(W, D / 2, Math.PI);
  addWall(D - 2 * T, W / 2, -Math.PI / 2);
  addWall(D - 2 * T, W / 2, Math.PI / 2);

  // printed logo on the front wall and both side walls
  const frontLogo = makeLogoPlane(0.9);
  frontLogo.position.set(0, H * 0.55, D / 2 + 0.003);
  scene.add(frontLogo);

  const leftLogo = makeLogoPlane(0.7);
  leftLogo.rotation.y = -Math.PI / 2;
  leftLogo.position.set(-(W / 2 + 0.003), H * 0.5, 0);
  scene.add(leftLogo);

  const rightLogo = makeLogoPlane(0.7);
  rightLogo.rotation.y = Math.PI / 2;
  rightLogo.position.set(W / 2 + 0.003, H * 0.5, 0);
  scene.add(rightLogo);

  // handling symbols, bottom right of the front wall like the reference
  const symbols = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.156),
    new THREE.MeshStandardMaterial({ map: makeSymbolsTexture(), transparent: true, opacity: 0.85, roughness: 0.95, depthWrite: false })
  );
  symbols.position.set(0.5, 0.17, D / 2 + 0.003);
  scene.add(symbols);

  // c0 = when the flap starts closing, o0 = when it starts opening again
  function addFlap(px, py, pz, sizeX, sizeZ, offX, offZ, axis, sign, maxAngle, c0, o0) {
    const pivot = new THREE.Group();
    pivot.position.set(px, py, pz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(sizeX, T, sizeZ), [edge, edge, outer, inner, edge, edge]);
    m.position.set(offX, T / 2, offZ);
    m.castShadow = true;
    m.receiveShadow = true;
    pivot.add(m);
    scene.add(pivot);
    flaps.push({ pivot: pivot, axis: axis, sign: sign, maxAngle: maxAngle, c0: c0, o0: o0 });
    return pivot;
  }

  const majorLen = D / 2 - T / 2 - 0.003;
  const minorLen = D / 2 - 0.02;
  const major = 140 * Math.PI / 180;
  const minor = 115 * Math.PI / 180;

  const frontFlap = addFlap(0, H + T, D / 2 - T / 2, W - 0.004, majorLen, 0, -majorLen / 2, "x", 1, major, 3.9, 0.15);
  addFlap(0, H + T, -(D / 2 - T / 2), W - 0.004, majorLen, 0, majorLen / 2, "x", -1, major, 3.7, 0.0);
  addFlap(-(W / 2 - T / 2), H, 0, minorLen, D - 2 * T - 0.01, minorLen / 2, 0, "z", 1, minor, 3.3, 0.3);
  addFlap(W / 2 - T / 2, H, 0, minorLen, D - 2 * T - 0.01, -minorLen / 2, 0, "z", -1, minor, 3.35, 0.35);

  // logo printed on top of the front flap (seen when the box is closed)
  const flapLogo = makeLogoPlane(0.7);
  flapLogo.rotation.x = -Math.PI / 2;
  flapLogo.position.set(0, T + 0.003, -majorLen / 2);
  frontFlap.add(flapLogo);

  // packing tape with the logo repeated on it
  const tg = new THREE.PlaneGeometry(W, 0.22);
  tg.translate(W / 2, 0, 0);
  tape = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: makeTapeTexture(), roughness: 0.25, transparent: true, opacity: 0.93 }));
  tape.rotation.x = -Math.PI / 2;
  tape.position.set(-W / 2, H + 2 * T + 0.004, 0);
  tape.receiveShadow = true;
  tape.visible = false;
  scene.add(tape);

  // camera path used while checking out
  const posList = [[0, 2.7, 5.0], [0, 3.3, 2.4], [0, 2.4, 0.7], [0, 2.4, 4.4], [0, 0.9, 5.6]];
  const lookList = [[0, 0.6, 0], [0, 0.3, 0], [0, 0.1, 0], [0, 0.8, 0], [0, 0.65, 0]];
  posCurve = new THREE.CatmullRomCurve3(posList.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
  lookCurve = new THREE.CatmullRomCurve3(lookList.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));

  window.addEventListener("resize", resize);
  resize();
  frame();
}

function resize() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  if (w / h < 1) {
    camera.fov = 50;
  } else {
    camera.fov = 35;
  }
  camera.updateProjectionMatrix();
}

// ---------- helpers ----------
function prog(t, a, b) {
  return Math.min(1, Math.max(0, (t - a) / (b - a)));
}
function smooth(x) {
  return x * x * (3 - 2 * x);
}
function easeOutBack(x) {
  const c1 = 1.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// ---------- box functions ----------
function getBoxMode() {
  return mode;
}

// stack the cards in order, cards above their new spot fall down
function restack() {
  let height = 0;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    c.targetY = T + height + CARD_T / 2;
    height += CARD_T + 0.005;
    if (c.y > c.targetY + 0.001) {
      c.settled = false;
      c.vy = 0;
    }
  }
}

function addToBox(id, tag, title, priceText, free, wait) {
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.6 });
  const face = new THREE.MeshStandardMaterial({ map: makeCardTexture(tag, title, priceText, free), roughness: 0.6 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, CARD_T, CARD_D), [white, white, face, white, white, white]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set((Math.random() - 0.5) * 0.25, 3.6, (Math.random() - 0.5) * 0.25);
  mesh.rotation.y = (Math.random() - 0.5) * 0.7;
  mesh.rotation.x = (Math.random() - 0.5) * 1.0;
  mesh.rotation.z = (Math.random() - 0.5) * 0.6;
  scene.add(mesh);

  cards.push({ id: id, mesh: mesh, y: 3.6, vy: 0, targetY: 0, settled: false, wait: wait });
  restack();
}

function removeFromBox(id) {
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].id === id) {
      scene.remove(cards[i].mesh);
      cards.splice(i, 1);
      break;
    }
  }
  restack();
}

function checkoutBox(onDone) {
  if (mode !== "open" || cards.length === 0) return;
  mode = "closing";
  modeTime = 0;
  doneCallback = onDone;
}

// opens the box again, the cards stay inside
function reopenBox() {
  tape.visible = false;
  mode = "opening";
  modeTime = 0;
}

// ---------- update loop ----------
function updateFlaps() {
  for (let i = 0; i < flaps.length; i++) {
    const f = flaps[i];
    let angle = f.maxAngle;
    if (mode === "closing") {
      angle = f.maxAngle * (1 - smooth(prog(modeTime, f.c0, f.c0 + 1.0)));
    } else if (mode === "closed") {
      angle = 0;
    } else if (mode === "opening") {
      angle = f.maxAngle * easeOutBack(prog(modeTime, f.o0, f.o0 + 1.1));
    }
    f.pivot.rotation[f.axis] = f.sign * angle;
  }
}

function updateCamera() {
  if (mode === "closing") {
    const u = smooth(prog(modeTime, 0, CLOSE_TOTAL));
    posCurve.getPoint(u, camera.position);
    lookCurve.getPoint(u, lookPoint);
  } else if (mode === "closed") {
    camera.position.copy(endPos);
    lookPoint.copy(endLook);
  } else if (mode === "opening") {
    const k = smooth(prog(modeTime, 0, 1.5));
    camera.position.lerpVectors(endPos, homePos, k);
    lookPoint.lerpVectors(endLook, homeLook, k);
  } else {
    camera.position.copy(homePos);
    lookPoint.copy(homeLook);
  }
  camera.lookAt(lookPoint);
}

function updateCards(dt) {
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    if (c.wait > 0) {
      c.wait -= dt;
      continue;
    }
    if (c.settled) continue;
    c.vy -= 9 * dt;
    c.y += c.vy * dt;
    if (c.y <= c.targetY) {
      c.y = c.targetY;
      if (c.vy < -1.2) {
        c.vy = -c.vy * 0.25;
      } else {
        c.vy = 0;
        c.settled = true;
        c.mesh.rotation.x = 0;
        c.mesh.rotation.z = 0;
      }
    }
    c.mesh.position.y = c.y;
    const k = Math.min(1, dt * 4);
    c.mesh.rotation.x += (0 - c.mesh.rotation.x) * k;
    c.mesh.rotation.z += (0 - c.mesh.rotation.z) * k;
  }
}

let lastTime = performance.now() / 1000;

function frame() {
  const now = performance.now() / 1000;
  const dt = Math.min(now - lastTime, 0.05);
  lastTime = now;
  modeTime += dt;

  if (mode === "closing") {
    tape.visible = modeTime > 4.9;
    tape.scale.x = Math.max(0.001, prog(modeTime, 4.9, 5.5));
    if (modeTime >= CLOSE_TOTAL) {
      mode = "closed";
      tape.scale.x = 1;
      if (doneCallback) doneCallback();
    }
  }
  if (mode === "opening" && modeTime >= OPEN_TOTAL) {
    mode = "open";
    if (openedCallback) openedCallback();
  }

  updateFlaps();
  updateCamera();
  updateCards(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
