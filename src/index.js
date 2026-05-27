import "./styles.css";
import { initShaders } from "../lib/cuon-utils";
import { Matrix4 } from "../lib/cuon-matrix-cse160";
import { drawHorse } from "./horse";

const VSHADER_SOURCE = `
  attribute vec3 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotation;
  void main() {
    gl_Position = u_GlobalRotation * u_ModelMatrix * vec4(a_Position, 1.0);
  }
`;

const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  uniform vec4 u_Color;
  void main() {
    gl_FragColor = u_Color;
  }
`;

const canvas = document.getElementById("webgl");
const gl = canvas.getContext("webgl");
if (!gl) throw new Error("WebGL not supported");

if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
  throw new Error("Shader init failed");
}

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.2, 0.22, 0.28, 1.0);

const aPositionLoc = gl.getAttribLocation(gl.program, "a_Position");
const uModelMatrixLoc = gl.getUniformLocation(gl.program, "u_ModelMatrix");
const uGlobalRotationLoc = gl.getUniformLocation(gl.program, "u_GlobalRotation");
const uColorLoc = gl.getUniformLocation(gl.program, "u_Color");

gl.enableVertexAttribArray(aPositionLoc);

// ---- Globals (UI / animation) ----
let gAnimalGlobalRotation = 0;
let gAnimalTiltX = -20;

let gFrontShoulder = 15;
let gFrontKnee = -25;
let gFrontAnkle = 10;

let gAnimationOn = false;
let g_time = 0;
let g_animTime = 0;

let g_pokeActive = false;
let g_pokeTime = 0;

let g_mouseDown = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

// Leg angles used by horse (updated from sliders or animation)
const gJoints = {
  frontLeft: { shoulder: 15, knee: -25, ankle: 10 },
  frontRight: { shoulder: -10, knee: -18, ankle: -7 },
  backLeft: { shoulder: 10, knee: -20, ankle: 5 },
  backRight: { shoulder: -10, knee: -20, ankle: 5 },
  headTilt: 0,
  tailSwing: 0,
  blink: false
};

// ---- Cube buffer (built once) ----
const CUBE_VERTS = new Float32Array([
  -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,
  -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5,
  0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
  -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,
  -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
  0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,
  0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
  -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
  -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5,
  -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5
]);

const cubeBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
gl.bufferData(gl.ARRAY_BUFFER, CUBE_VERTS, gl.STATIC_DRAW);

const CUBE_VERT_COUNT = 36;

function bindPositions(buf) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
}

function setGlobalRotationUniform() {
  const R = new Matrix4();
  R.rotate(gAnimalTiltX, 1, 0, 0);
  R.rotate(gAnimalGlobalRotation, 0, 1, 0);
  R.scale(0.45, 0.45, 0.45);
  gl.uniformMatrix4fv(uGlobalRotationLoc, false, R.elements);
}

function drawCube(M, color) {
  bindPositions(cubeBuf);
  gl.uniformMatrix4fv(uModelMatrixLoc, false, M.elements);
  gl.uniform4f(uColorLoc, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, CUBE_VERT_COUNT);
}

function syncJointsFromSliders() {
  gJoints.frontLeft.shoulder = gFrontShoulder;
  gJoints.frontLeft.knee = gFrontKnee;
  gJoints.frontLeft.ankle = gFrontAnkle;
}

function updateAnimationAngles() {
  const t = g_animTime * 0.001;
  const swing = Math.sin(t * 3.0);

  if (gAnimationOn && !g_pokeActive) {
    gFrontShoulder = 20 + swing * 25;
    gFrontKnee = -25 + Math.max(0, -swing) * -35;
    gFrontAnkle = 10 + Math.sin(t * 3.0 + 1.2) * 10;

    gJoints.frontLeft.shoulder = gFrontShoulder;
    gJoints.frontLeft.knee = gFrontKnee;
    gJoints.frontLeft.ankle = gFrontAnkle;

    gJoints.frontRight.shoulder = -gFrontShoulder * 0.75;
    gJoints.frontRight.knee = gFrontKnee * 0.75;
    gJoints.frontRight.ankle = -gFrontAnkle * 0.75;

    const backPhase = Math.sin(t * 3.0) * 22;
    gJoints.backLeft.shoulder = 10 - backPhase;
    gJoints.backLeft.knee = -20 + backPhase * 0.5;
    gJoints.backLeft.ankle = 5 + backPhase * 0.2;

    gJoints.backRight.shoulder = -10 + backPhase;
    gJoints.backRight.knee = -20 - backPhase * 0.5;
    gJoints.backRight.ankle = 5 - backPhase * 0.2;

    gJoints.headTilt = Math.sin(t * 2.0) * 4;
    gJoints.tailSwing = Math.sin(t * 2.5) * 12;
    gJoints.blink = Math.sin(t * 5.0) > 0.92;
  } else if (g_pokeActive) {
    const p = g_pokeTime * 0.001;
    const wink = Math.sin(p * 12) > 0 ? 1 : 0;
    gJoints.blink = wink === 1;
    gJoints.headTilt = -15 + Math.sin(p * 8) * 8;
    gJoints.tailSwing = 25 + Math.sin(p * 6) * 15;
    gJoints.frontLeft.shoulder = 35;
    gJoints.frontLeft.knee = -50;
    gJoints.frontLeft.ankle = 20;
  } else {
    syncJointsFromSliders();
    gJoints.frontRight.shoulder = -gFrontShoulder * 0.7;
    gJoints.frontRight.knee = gFrontKnee * 0.7;
    gJoints.frontRight.ankle = -gFrontAnkle * 0.7;
    gJoints.backLeft.shoulder = 10;
    gJoints.backLeft.knee = -20;
    gJoints.backLeft.ankle = 5;
    gJoints.backRight.shoulder = -10;
    gJoints.backRight.knee = -20;
    gJoints.backRight.ankle = 5;
    gJoints.headTilt = 0;
    gJoints.tailSwing = 0;
    gJoints.blink = false;
  }
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  setGlobalRotationUniform();

  const horseRoot = new Matrix4();
  horseRoot.translate(0, -0.2, 0);
  drawHorse(horseRoot, drawCube, gJoints);
}

function bindSlider(id, read, write, outId) {
  const el = document.getElementById(id);
  const out = document.getElementById(outId);
  if (!el) return;
  el.addEventListener("input", () => {
    const v = Number(el.value);
    write(v);
    if (out) out.textContent = String(v);
    if (!gAnimationOn) syncJointsFromSliders();
    renderScene();
  });
  if (out) out.textContent = String(read());
}

bindSlider(
  "globalRot",
  () => gAnimalGlobalRotation,
  (v) => (gAnimalGlobalRotation = v),
  "globalRotVal"
);
bindSlider(
  "mouseTilt",
  () => gAnimalTiltX,
  (v) => (gAnimalTiltX = v),
  "mouseTiltVal"
);
bindSlider(
  "frontShoulder",
  () => gFrontShoulder,
  (v) => (gFrontShoulder = v),
  "frontShoulderVal"
);
bindSlider(
  "frontKnee",
  () => gFrontKnee,
  (v) => (gFrontKnee = v),
  "frontKneeVal"
);
bindSlider(
  "frontAnkle",
  () => gFrontAnkle,
  (v) => (gFrontAnkle = v),
  "frontAnkleVal"
);

const toggleAnimBtn = document.getElementById("toggleAnim");
if (toggleAnimBtn) {
  toggleAnimBtn.addEventListener("click", () => {
    gAnimationOn = !gAnimationOn;
    toggleAnimBtn.textContent = `Animation: ${gAnimationOn ? "ON" : "OFF"}`;
  });
}

canvas.addEventListener("mousedown", (e) => {
  if (e.shiftKey) {
    g_pokeActive = true;
    g_pokeTime = performance.now();
    setTimeout(() => {
      g_pokeActive = false;
    }, 1200);
    return;
  }
  g_mouseDown = true;
  g_lastMouseX = e.clientX;
  g_lastMouseY = e.clientY;
});

window.addEventListener("mouseup", () => {
  g_mouseDown = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!g_mouseDown) return;
  const dx = e.clientX - g_lastMouseX;
  const dy = e.clientY - g_lastMouseY;
  g_lastMouseX = e.clientX;
  g_lastMouseY = e.clientY;

  gAnimalGlobalRotation += dx * 0.4;
  gAnimalTiltX = Math.max(-60, Math.min(60, gAnimalTiltX + dy * 0.3));

  const rotEl = document.getElementById("globalRot");
  const tiltEl = document.getElementById("mouseTilt");
  const rotOut = document.getElementById("globalRotVal");
  const tiltOut = document.getElementById("mouseTiltVal");
  if (rotEl) rotEl.value = String(Math.round(gAnimalGlobalRotation));
  if (tiltEl) tiltEl.value = String(Math.round(gAnimalTiltX));
  if (rotOut) rotOut.textContent = String(Math.round(gAnimalGlobalRotation));
  if (tiltOut) tiltOut.textContent = String(Math.round(gAnimalTiltX));

  renderScene();
});

let g_prevTime = performance.now();
let g_fpsSmoothed = 0;
const fpsEl = document.getElementById("fps");

function tick(now) {
  g_time = now;
  const dt = now - g_prevTime;
  g_prevTime = now;

  const fps = dt > 0 ? 1000 / dt : 0;
  g_fpsSmoothed = g_fpsSmoothed ? g_fpsSmoothed * 0.9 + fps * 0.1 : fps;
  if (fpsEl) fpsEl.textContent = `FPS: ${g_fpsSmoothed.toFixed(1)}`;

  if (gAnimationOn) g_animTime += dt;
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

syncJointsFromSliders();
renderScene();
requestAnimationFrame(tick);
