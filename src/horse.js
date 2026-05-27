import { Matrix4 } from "../lib/cuon-matrix-cse160";

const HORSE_BROWN = [0.55, 0.36, 0.22, 1.0];
const HORSE_DARK = [0.45, 0.28, 0.16, 1.0];
const HORSE_MUZZLE = [0.52, 0.34, 0.21, 1.0];
const HORSE_EAR = [0.5, 0.32, 0.19, 1.0];
const HORSE_MANE = [0.38, 0.24, 0.14, 1.0];
const HORSE_TAIL = [0.25, 0.16, 0.1, 1.0];
const HORSE_TAIL_TIP = [0.18, 0.12, 0.08, 1.0];
const HORSE_CALF = [0.5, 0.32, 0.2, 1.0];
const HORSE_HOOF = [0.1, 0.1, 0.1, 1.0];
const HORSE_EYE_WHITE = [0.92, 0.92, 0.88, 1.0];
const HORSE_EYE = [0.06, 0.06, 0.1, 1.0];
const HORSE_NOSTRIL = [0.1, 0.07, 0.05, 1.0];
const HORSE_MOUTH = [0.2, 0.12, 0.1, 1.0];

function pushMatrix(stack, M) {
  stack.push(new Matrix4(M));
}

function popMatrix(stack) {
  return stack.pop();
}

function drawTailPart(drawCube, base, tx, ty, rotZ, sx, sy, sz, color) {
  const seg = new Matrix4(base);
  seg.translate(tx, ty, 0);
  if (rotZ !== 0) seg.rotate(rotZ, 0, 0, 1);
  seg.scale(sx, sy, sz);
  drawCube(seg, color);
}

/**
 * Draw the blocky horse using drawCube(M, color).
 * @param {Matrix4} worldRoot - placement in the scene
 * @param {function(Matrix4, number[]): void} drawCube
 * @param {object} joints - leg angles in degrees
 */
export function drawHorse(worldRoot, drawCube, joints) {
  const stack = [];
  const root = new Matrix4(worldRoot);
  root.scale(0.75, 0.75, 0.75);
  root.translate(0, 0.18, 0);

  const chest = new Matrix4(root);
  chest.translate(0.38, 0.04, 0);
  chest.scale(0.55, 0.52, 0.46);
  drawCube(chest, HORSE_BROWN);

  const barrel = new Matrix4(root);
  barrel.translate(0.02, 0.06, 0);
  barrel.scale(0.95, 0.54, 0.5);
  drawCube(barrel, HORSE_BROWN);

  const rump = new Matrix4(root);
  rump.translate(-0.48, 0.1, 0);
  rump.scale(0.58, 0.5, 0.48);
  drawCube(rump, HORSE_BROWN);

  const withers = new Matrix4(root);
  withers.translate(0.48, 0.24, 0);
  withers.scale(0.38, 0.16, 0.32);
  drawCube(withers, HORSE_BROWN);

  const neck = new Matrix4(root);
  neck.translate(0.68, 0.3, 0);
  neck.rotate(18 + (joints.headTilt || 0), 0, 0, 1);
  const neckManeFrame = new Matrix4(neck);
  pushMatrix(stack, neck);
  neck.scale(0.48, 0.22, 0.26);
  drawCube(neck, HORSE_BROWN);

  for (let i = 0; i < 7; i++) {
    const mane = new Matrix4(neckManeFrame);
    mane.translate(-0.2 + i * 0.075, 0.19, 0);
    mane.scale(0.13, 0.22 - i * 0.015, 0.105);
    drawCube(mane, HORSE_MANE);
  }

  const neckToCrest = new Matrix4(root);
  neckToCrest.translate(0.56, 0.31, 0);
  neckToCrest.scale(0.13, 0.19, 0.1);
  drawCube(neckToCrest, HORSE_MANE);

  for (let i = 0; i < 5; i++) {
    const crest = new Matrix4(root);
    crest.translate(0.48 - i * 0.1, 0.32 - i * 0.02, 0);
    crest.scale(0.13 - i * 0.008, 0.2 - i * 0.012, 0.1);
    drawCube(crest, HORSE_MANE);
  }

  let headBase = popMatrix(stack);
  headBase.translate(0.32, 0.14, 0);

  const headTopMane = new Matrix4(headBase);
  headTopMane.translate(0, 0.08, 0);
  headTopMane.scale(0.38, 0.07, 0.3);
  drawCube(headTopMane, HORSE_MANE);

  for (let i = 0; i < 3; i++) {
    const poll = new Matrix4(headBase);
    poll.translate(0.02 - i * 0.048, 0.15, 0);
    poll.scale(0.12, 0.15, 0.1);
    drawCube(poll, HORSE_MANE);
  }

  for (let i = 0; i < 4; i++) {
    const headNeckMane = new Matrix4(headBase);
    headNeckMane.translate(-0.1 - i * 0.055, 0.16, 0);
    headNeckMane.scale(0.12, 0.17 - i * 0.01, 0.105);
    drawCube(headNeckMane, HORSE_MANE);
  }

  const head = new Matrix4(headBase);
  head.scale(0.4, 0.24, 0.3);
  drawCube(head, HORSE_DARK);

  const muzzle = new Matrix4(headBase);
  muzzle.translate(0.24, -0.04, 0);
  muzzle.scale(0.32, 0.15, 0.2);
  drawCube(muzzle, HORSE_MUZZLE);

  const nostrilL = new Matrix4(headBase);
  nostrilL.translate(0.405, 0.01, 0.04);
  nostrilL.scale(0.025, 0.045, 0.035);
  drawCube(nostrilL, HORSE_NOSTRIL);

  const nostrilR = new Matrix4(headBase);
  nostrilR.translate(0.405, 0.01, -0.04);
  nostrilR.scale(0.025, 0.045, 0.035);
  drawCube(nostrilR, HORSE_NOSTRIL);

  const mouth = new Matrix4(headBase);
  mouth.translate(0.405, -0.09, 0);
  mouth.scale(0.025, 0.04, 0.1);
  drawCube(mouth, HORSE_MOUTH);

  const mouthLine = new Matrix4(headBase);
  mouthLine.translate(0.403, -0.1, 0);
  mouthLine.scale(0.022, 0.018, 0.09);
  drawCube(mouthLine, HORSE_NOSTRIL);

  function drawEar(side) {
    const ear = new Matrix4(headBase);
    ear.translate(0.02, 0.18, 0.11 * side);
    ear.rotate(8 * side, 0, 1, 0);
    ear.rotate(-18, 1, 0, 0);
    ear.scale(0.09, 0.24, 0.05);
    drawCube(ear, HORSE_EAR);
  }
  drawEar(1);
  drawEar(-1);

  function drawEye(side) {
    const blink = joints.blink ? 0.02 : 0.08;
    const white = new Matrix4(headBase);
    white.translate(0.19, 0.07, 0.065 * side);
    white.scale(0.03, blink, 0.055);
    drawCube(white, HORSE_EYE_WHITE);

    if (!joints.blink) {
      const pupil = new Matrix4(headBase);
      pupil.translate(0.2, 0.07, 0.065 * side);
      pupil.scale(0.02, 0.055, 0.04);
      drawCube(pupil, HORSE_EYE);
    }
  }
  drawEye(1);
  drawEye(-1);

  let tailBase = new Matrix4(root);
  tailBase.translate(-0.74, 0.28, 0);
  const tailSwing = joints.tailSwing || 0;

  drawTailPart(drawCube, tailBase, 0, -0.06, tailSwing, 0.1, 0.15, 0.1, HORSE_TAIL);

  tailBase = new Matrix4(tailBase);
  tailBase.translate(0, -0.12, 0);
  tailBase.rotate(-8 + tailSwing * 0.5, 0, 0, 1);
  drawTailPart(drawCube, tailBase, 0, -0.05, 0, 0.09, 0.18, 0.09, HORSE_TAIL);

  tailBase = new Matrix4(tailBase);
  tailBase.translate(0, -0.16, 0);
  tailBase.rotate(-10, 0, 0, 1);
  drawTailPart(drawCube, tailBase, 0, -0.06, 0, 0.08, 0.21, 0.08, HORSE_TAIL);

  tailBase = new Matrix4(tailBase);
  tailBase.translate(0, -0.18, 0);
  tailBase.rotate(-10, 0, 0, 1);
  drawTailPart(drawCube, tailBase, 0, -0.07, 0, 0.07, 0.19, 0.07, HORSE_TAIL);

  tailBase = new Matrix4(tailBase);
  tailBase.translate(0, -0.17, 0);
  tailBase.rotate(-7, 0, 0, 1);
  drawTailPart(drawCube, tailBase, 0, -0.08, 0, 0.06, 0.15, 0.06, HORSE_TAIL_TIP);

  function drawLeg(hipX, hipZ, shoulder, knee, ankle) {
    let M = new Matrix4(root);
    M.translate(hipX, -0.05, hipZ);

    pushMatrix(stack, M);
    M.rotate(shoulder, 0, 0, 1);
    pushMatrix(stack, M);
    {
      const thigh = new Matrix4(M);
      thigh.translate(0, -0.28, 0);
      thigh.scale(0.16, 0.45, 0.16);
      drawCube(thigh, HORSE_BROWN);
    }

    M = popMatrix(stack);
    M.translate(0, -0.52, 0);
    M.rotate(knee, 0, 0, 1);
    {
      const kneeCap = new Matrix4(M);
      kneeCap.translate(0.02, 0, 0);
      kneeCap.scale(0.12, 0.1, 0.12);
      drawCube(kneeCap, HORSE_CALF);
    }
    pushMatrix(stack, M);
    {
      const calf = new Matrix4(M);
      calf.translate(0, -0.23, 0);
      calf.scale(0.14, 0.38, 0.14);
      drawCube(calf, HORSE_CALF);
    }

    M = popMatrix(stack);
    M.translate(0, -0.42, 0);
    M.rotate(ankle, 0, 0, 1);
    {
      const hoof = new Matrix4(M);
      hoof.translate(0.05, -0.06, 0);
      hoof.scale(0.22, 0.12, 0.18);
      drawCube(hoof, HORSE_HOOF);
    }

    popMatrix(stack);
  }

  const fl = joints.frontLeft;
  const fr = joints.frontRight;
  const bl = joints.backLeft;
  const br = joints.backRight;

  drawLeg(0.45, 0.18, fl.shoulder, fl.knee, fl.ankle);
  drawLeg(0.45, -0.18, fr.shoulder, fr.knee, fr.ankle);
  drawLeg(-0.45, 0.16, bl.shoulder, bl.knee, bl.ankle);
  drawLeg(-0.45, -0.16, br.shoulder, br.knee, br.ankle);
}
