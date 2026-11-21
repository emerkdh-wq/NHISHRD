import * as THREE from 'three';

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Continuous height function for the entire NHIS HRD Institute & Cheongpung Lake terrain.
 * Ensures every building, tree, prop, and the roaming avatar sit flush on the ground.
 */
export function getGroundHeight(x: number, z: number): number {
  // 1. Main Soccer Field & immediate flat apron (X: -48..48, Z: -30..30)
  if (x >= -50 && x <= 50 && z >= -30 && z <= 31) {
    return 0;
  }

  // 2. North road & basketball court strip (Z: -37.5..-30)
  if (x >= -85 && x <= 95 && z >= -37.5 && z < -30) {
    return 0.05;
  }

  // 3. Central ramp & Main Plaza terrace (Z < -37.5, X: -26..26)
  if (x >= -26 && x <= 26 && z < -37.5 && z >= -78) {
    const ramp = smoothstep(-37.5, -43.5, z);
    return 0.05 + ramp * 2.55; // reaches 2.60m at main plaza
  }

  // 4. Right campus terrace (East dorms + Gym)
  if (x > 26 && x <= 118 && z < -37.5 && z >= -95) {
    const northSlope = smoothstep(-37.5, -62, z);
    const eastDrop = smoothstep(55, 105, x);
    return 2.6 * northSlope * (1 - 0.35 * eastDrop) + 0.1;
  }

  // 5. Left campus terrace (West dorm + rock garden)
  if (x < -26 && x >= -88 && z < -37.5 && z >= -95) {
    const northSlope = smoothstep(-37.5, -68, z);
    return 0.1 + northSlope * 4.4;
  }

  // 6. South Tennis Courts & Overlook Garden (Z: 31..64)
  if (x >= -48 && x <= -4 && z > 31 && z <= 61) {
    return -0.3;
  }
  if (x >= 4 && x <= 46 && z > 31 && z <= 65) {
    return 0.2;
  }

  // 7. Towering Geumsusan Mountain ridge behind the campus (Z < -78)
  let h = 0;
  if (z < -78) {
    const distN = -78 - z;
    // Main peak slightly east of center as seen in DSC_9145 & DJI_0030
    const peakDist = Math.hypot((x - 36) * 0.72, z + 195);
    const mainPeak = Math.max(0, 74 * Math.exp(-(peakDist * peakDist) / 9200));

    // Secondary western ridge
    const westDist = Math.hypot((x + 85) * 0.8, z + 175);
    const westPeak = Math.max(0, 44 * Math.exp(-(westDist * westDist) / 7600));

    const ridgeSlope = smoothstep(-78, -160, z) * 18;
    const undulation =
      Math.sin(x * 0.035) * Math.cos(z * 0.035) * 3.5 +
      Math.sin(x * 0.08 + z * 0.05) * 1.4;

    h = 3.2 + ridgeSlope + mainPeak + westPeak + undulation * smoothstep(0, 25, distN);
    return h;
  }

  // 8. Cheongpung Lake basin to the South & Southwest (Z > 64)
  if (z > 64) {
    // Peninsula ridge on far east & far west so lake wraps organically like DJI_0008
    const peninsula =
      smoothstep(80, 180, Math.abs(x)) * 12 * Math.exp(-Math.pow((z - 120) / 110, 2));
    const drop = smoothstep(64, 92, z);
    const undulation = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 1.5;
    h = 0.2 - drop * 11.5 + peninsula + undulation * (1 - drop * 0.5);

    // Distant mountain ring across Cheongpung Lake (Z > 240)
    if (z > 235) {
      const farDist = smoothstep(235, 360, z);
      const farPeaks =
        (38 + Math.sin(x * 0.022) * 18 + Math.cos(x * 0.055) * 9) * farDist;
      h += farPeaks;
    }
    return h;
  }

  // 9. Gentle side slopes (East & West flanks around the soccer field)
  const sideDist = Math.max(0, Math.abs(x) - 50);
  const sideDrop = smoothstep(0, 55, sideDist);
  const sideWave = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.2;
  if (x < -50 && z > 15) {
    // Slopes down toward western cove of Cheongpung Lake
    return -sideDrop * 9.0 + sideWave;
  }
  return sideDrop * 6.5 + sideWave;
}

export function buildTerrainMesh(): THREE.Mesh {
  const width = 760;
  const depth = 760;
  const segX = 160;
  const segZ = 160;

  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const lushGreen = new THREE.Color('#4a773c');
  const deepForest = new THREE.Color('#2c5229');
  const warmGrass = new THREE.Color('#618944');
  const shoreSand = new THREE.Color('#9e9577');
  const mountainSlate = new THREE.Color('#3b5d35');
  const temp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const vy = getGroundHeight(vx, vz);
    pos.setY(i, vy);

    if (vy < -5.5) {
      // Lakeside shore & submerged bed
      const t = smoothstep(-9.5, -5.5, vy);
      temp.lerpColors(shoreSand, warmGrass, t);
    } else if (vy > 14) {
      // Mountain forest gradient
      const t = smoothstep(14, 55, vy);
      temp.lerpColors(deepForest, mountainSlate, t);
    } else if (vz > 30 && vz < 68 && Math.abs(vx) < 48) {
      temp.copy(warmGrass);
    } else {
      const noise = Math.sin(vx * 0.06) * Math.cos(vz * 0.06) * 0.5 + 0.5;
      temp.lerpColors(deepForest, lushGreen, 0.35 + noise * 0.65);
    }

    colors[i * 3] = temp.r;
    colors[i * 3 + 1] = temp.g;
    colors[i * 3 + 2] = temp.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

export function buildCheongpungLake(): THREE.Mesh<
  THREE.PlaneGeometry,
  THREE.MeshPhysicalMaterial
> {
  // Large lake surface at y = -8.5m spanning South, East, and West horizon
  const geo = new THREE.PlaneGeometry(900, 520, 48, 32);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#235d73'),
    roughness: 0.14,
    metalness: 0.12,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.92,
  });

  // Subtle animated lake ripples via onBeforeCompile
  mat.userData.uTime = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = mat.userData.uTime;
    shader.vertexShader =
      `uniform float uTime;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float wave1 = sin(position.x * 0.07 + uTime * 1.1) * 0.12;
        float wave2 = cos(position.z * 0.09 + uTime * 0.85) * 0.10;
        transformed.y += wave1 + wave2;
        `
      );
  };

  const lake = new THREE.Mesh(geo, mat);
  lake.position.set(0, -8.5, 220);
  lake.receiveShadow = true;
  lake.name = 'cheongpung_lake';
  return lake;
}
