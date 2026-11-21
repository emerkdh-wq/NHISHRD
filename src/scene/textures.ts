import * as THREE from 'three';

function finalizeTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy || 1);
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createSoccerFieldTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 2048;
  const h = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Base alternating turf stripes (matching DSC_9145 & DJI_0037)
  const stripeCount = 18;
  const stripeW = w / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#3b7e3c' : '#468c44';
    ctx.fillRect(i * stripeW, 0, stripeW + 1, h);
  }

  // Subtle turf grain noise
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Crisp white pitch lines
  const padX = 95;
  const padY = 75;
  const pitchW = w - padX * 2;
  const pitchH = h - padY * 2;
  const midX = w / 2;
  const midY = h / 2;

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.92)';
  ctx.lineWidth = 7;

  // Outer boundary
  ctx.strokeRect(padX, padY, pitchW, pitchH);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(midX, padY);
  ctx.lineTo(midX, padY + pitchH);
  ctx.stroke();

  // Center circle & spot
  ctx.beginPath();
  ctx.arc(midX, midY, 130, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.95)';
  ctx.beginPath();
  ctx.arc(midX, midY, 9, 0, Math.PI * 2);
  ctx.fill();

  // Penalty boxes (Left / West & Right / East)
  const penW = 240;
  const penH = 540;
  const goalW = 86;
  const goalH = 260;

  ctx.strokeRect(padX, midY - penH / 2, penW, penH);
  ctx.strokeRect(padX, midY - goalH / 2, goalW, goalH);

  ctx.strokeRect(padX + pitchW - penW, midY - penH / 2, penW, penH);
  ctx.strokeRect(padX + pitchW - goalW, midY - goalH / 2, goalW, goalH);

  // Penalty arcs
  ctx.beginPath();
  ctx.arc(padX + 165, midY, 120, -0.64, 0.64);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(padX + pitchW - 165, midY, 120, Math.PI - 0.64, Math.PI + 0.64);
  ctx.stroke();

  // Corner arcs
  const cR = 26;
  [
    [padX, padY, 0, Math.PI / 2],
    [padX + pitchW, padY, Math.PI / 2, Math.PI],
    [padX + pitchW, padY + pitchH, Math.PI, Math.PI * 1.5],
    [padX, padY + pitchH, Math.PI * 1.5, Math.PI * 2],
  ].forEach(([cx, cy, a0, a1]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, cR, a0, a1);
    ctx.stroke();
  });

  return finalizeTexture(canvas, maxAnisotropy);
}

export function createTennisCourtTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Outer run-off apron (matching DJI_0037)
  ctx.fillStyle = '#5f7d5b';
  ctx.fillRect(0, 0, w, h);

  // Draw 2 side-by-side vertical courts
  const courtW = 360;
  const courtH = 500;
  const topY = (h - courtH) / 2;
  const xs = [110, 554];

  xs.forEach((cx) => {
    ctx.fillStyle = '#3f6f51';
    ctx.fillRect(cx, topY, courtW, courtH);

    ctx.strokeStyle = 'rgba(244, 247, 245, 0.9)';
    ctx.lineWidth = 5;
    ctx.strokeRect(cx, topY, courtW, courtH);

    // Singles sidelines
    const alley = 44;
    ctx.beginPath();
    ctx.moveTo(cx + alley, topY);
    ctx.lineTo(cx + alley, topY + courtH);
    ctx.moveTo(cx + courtW - alley, topY);
    ctx.lineTo(cx + courtW - alley, topY + courtH);
    ctx.stroke();

    // Net line
    const netY = topY + courtH / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, netY);
    ctx.lineTo(cx + courtW + 12, netY);
    ctx.stroke();

    // Service lines
    const srvOffset = 130;
    ctx.beginPath();
    ctx.moveTo(cx + alley, netY - srvOffset);
    ctx.lineTo(cx + courtW - alley, netY - srvOffset);
    ctx.moveTo(cx + alley, netY + srvOffset);
    ctx.lineTo(cx + courtW - alley, netY + srvOffset);
    // Center service line
    ctx.moveTo(cx + courtW / 2, netY - srvOffset);
    ctx.lineTo(cx + courtW / 2, netY + srvOffset);
    ctx.stroke();
  });

  return finalizeTexture(canvas, maxAnisotropy);
}

export function createBasketballCourtTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 384;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4e7d63';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  // Center line & circle
  ctx.beginPath();
  ctx.moveTo(w / 2, 24);
  ctx.lineTo(w / 2, h - 24);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 46, 0, Math.PI * 2);
  ctx.stroke();

  // Left and right keys
  ctx.fillStyle = '#3b6450';
  ctx.fillRect(24, h / 2 - 54, 106, 108);
  ctx.strokeRect(24, h / 2 - 54, 106, 108);
  ctx.fillRect(w - 130, h / 2 - 54, 106, 108);
  ctx.strokeRect(w - 130, h / 2 - 54, 106, 108);

  // 3-pt arcs
  ctx.beginPath();
  ctx.arc(52, h / 2, 138, -Math.PI * 0.44, Math.PI * 0.44);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w - 52, h / 2, 138, Math.PI * 0.56, Math.PI * 1.44);
  ctx.stroke();

  return finalizeTexture(canvas, maxAnisotropy);
}

export function createStonePavingTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c8c5bd';
  ctx.fillRect(0, 0, size, size);

  const cols = 8;
  const rows = 8;
  const tileW = size / cols;
  const tileH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shade = 186 + Math.floor((Math.random() - 0.5) * 18);
      ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade - 7})`;
      const offset = r % 2 === 0 ? 0 : tileW * 0.5;
      ctx.fillRect((c * tileW + offset) % size, r * tileH, tileW - 2, tileH - 2);
    }
  }

  ctx.strokeStyle = 'rgba(110, 108, 102, 0.35)';
  ctx.lineWidth = 2;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * tileH);
    ctx.lineTo(size, r * tileH);
    ctx.stroke();
  }

  return finalizeTexture(canvas, maxAnisotropy, 6, 6);
}

export function createWoodDeckTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8b5e3b';
  ctx.fillRect(0, 0, size, size);

  const planks = 14;
  const plankH = size / planks;
  for (let i = 0; i < planks; i++) {
    const tone = (i % 3) * 8 - 8;
    ctx.fillStyle = `rgb(${139 + tone}, ${94 + Math.floor(tone * 0.7)}, ${59 + Math.floor(tone * 0.5)})`;
    ctx.fillRect(0, i * plankH, size, plankH - 2);

    ctx.fillStyle = 'rgba(52, 32, 18, 0.45)';
    ctx.fillRect(0, (i + 1) * plankH - 2, size, 2);
  }

  return finalizeTexture(canvas, maxAnisotropy, 4, 2);
}

export function createSignageTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f2f3f5';
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural trim
  ctx.fillStyle = '#d4d8de';
  ctx.fillRect(0, h - 8, w, 8);

  // Emblem icon (stylized warm red & jade ring inspired by NHIS mark)
  const cx = 240;
  const cy = h / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#d93829';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx + 8, cy + 4, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#1b8a7a';
  ctx.fill();

  // Korean architectural lettering
  ctx.fillStyle = '#1e242b';
  ctx.font = 'bold 54px "IBM Plex Sans KR", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('국민건강보험  인재개발원', 292, cy + 2);

  return finalizeTexture(canvas, maxAnisotropy);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(10, 15, 12, 0.55)');
  grad.addColorStop(0.55, 'rgba(10, 15, 12, 0.22)');
  grad.addColorStop(1, 'rgba(10, 15, 12, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
