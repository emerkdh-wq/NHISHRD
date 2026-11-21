import * as THREE from 'three';
import { MINDFUL_POINTS } from '../data/campusLocations';

export interface LotusLantern {
  group: THREE.Group;
  baseX: number;
  baseZ: number;
  phase: number;
  driftSpeed: number;
}

export function createLotusLanternMesh(colorHex: string): THREE.Group {
  const lantern = new THREE.Group();

  const padMat = new THREE.MeshStandardMaterial({
    color: '#2e6b46',
    roughness: 0.78,
  });
  const petalMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: 0.65,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    emissive: new THREE.Color('#fbbf24'),
    emissiveIntensity: 1.2,
  });

  // Lily pad base
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.65, 0.08, 12), padMat);
  pad.position.y = 0.04;
  lantern.add(pad);

  // 8 lotus petals arranged radially
  const petalGeo = new THREE.ConeGeometry(0.18, 0.48, 4);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(angle) * 0.28, 0.24, Math.sin(angle) * 0.28);
    petal.rotation.z = -Math.cos(angle) * 0.55;
    petal.rotation.x = Math.sin(angle) * 0.55;
    lantern.add(petal);
  }

  // Warm inner candle core
  const candle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), coreMat);
  candle.position.y = 0.26;
  lantern.add(candle);

  return lantern;
}

export function createMindfulMarkers(): THREE.Group {
  const markers = new THREE.Group();

  MINDFUL_POINTS.forEach((pt) => {
    const ringGroup = new THREE.Group();
    ringGroup.position.set(pt.position[0], pt.position[1] + 0.06, pt.position[2]);

    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.58, 36),
      new THREE.MeshBasicMaterial({
        color: '#d97706',
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    outerRing.rotation.x = -Math.PI / 2;

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.66, 28),
      new THREE.MeshBasicMaterial({
        color: '#f59e0b',
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    innerRing.rotation.x = -Math.PI / 2;

    ringGroup.add(outerRing, innerRing);
    markers.add(ringGroup);
  });

  return markers;
}

export function createSoccerBall(): {
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
} {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#1e293b';
  const patches = [
    [64, 64],
    [192, 64],
    [128, 128],
    [64, 192],
    [192, 192],
    [0, 128],
    [256, 128],
  ];
  patches.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 20, 20),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.45,
      metalness: 0.05,
    })
  );
  ball.castShadow = true;
  ball.position.set(0, 0.28, 0);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 16),
    new THREE.MeshBasicMaterial({
      color: '#090d0a',
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.055, 0);

  return { mesh: ball, shadow };
}

export function createSkyClouds(): THREE.Group {
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85,
  });

  const positions: Array<[number, number, number, number]> = [
    [-120, 95, -180, 1.4],
    [-20, 108, -220, 1.8],
    [95, 92, -195, 1.5],
    [170, 102, -120, 1.3],
    [-160, 88, 120, 1.6],
    [40, 112, 240, 2.0],
    [160, 96, 190, 1.5],
  ];

  positions.forEach(([cx, cy, cz, scale]) => {
    const cluster = new THREE.Group();
    cluster.position.set(cx, cy, cz);
    cluster.scale.setScalar(scale);

    const puffs: Array<[number, number, number, number]> = [
      [0, 0, 0, 11],
      [9, -1.5, 2, 8.5],
      [-9, -1.5, -1, 8.8],
      [4, 2.5, -3, 7.5],
      [-5, 1.5, 3, 7.2],
    ];
    puffs.forEach(([px, py, pz, r]) => {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), cloudMat);
      puff.position.set(px, py, pz);
      puff.scale.y = 0.55;
      cluster.add(puff);
    });

    clouds.add(cluster);
  });

  return clouds;
}
