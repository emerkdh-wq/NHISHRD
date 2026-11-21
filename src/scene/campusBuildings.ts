import * as THREE from 'three';
import { getGroundHeight } from './terrain';
import {
  createBasketballCourtTexture,
  createSignageTexture,
  createSoccerFieldTexture,
  createStonePavingTexture,
  createTennisCourtTexture,
  createWoodDeckTexture,
} from './textures';

export interface CampusBuildResult {
  group: THREE.Group;
  bellPivot: THREE.Group;
  strikerPivot: THREE.Group;
  nightLights: THREE.PointLight[];
  lanternEmissives: THREE.MeshStandardMaterial[];
  colliders: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
}

function addCollider(
  colliders: CampusBuildResult['colliders'],
  cx: number,
  cz: number,
  w: number,
  d: number
) {
  colliders.push({
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
  });
}

function createGoalNet(width = 7.32, height = 2.44, depth = 2.2): THREE.Group {
  const goal = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
    roughness: 0.35,
    metalness: 0.5,
  });
  const netMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.8,
    transparent: true,
    opacity: 0.32,
    wireframe: true,
    side: THREE.DoubleSide,
  });

  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, height, 10);
  const leftPost = new THREE.Mesh(postGeo, postMat);
  leftPost.position.set(0, height / 2, -width / 2);
  leftPost.castShadow = true;

  const rightPost = new THREE.Mesh(postGeo, postMat);
  rightPost.position.set(0, height / 2, width / 2);
  rightPost.castShadow = true;

  const crossbarGeo = new THREE.CylinderGeometry(0.08, 0.08, width + 0.16, 10);
  crossbarGeo.rotateX(Math.PI / 2);
  const crossbar = new THREE.Mesh(crossbarGeo, postMat);
  crossbar.position.set(0, height, 0);
  crossbar.castShadow = true;

  // Back frame stanchions
  const backGeo = new THREE.BoxGeometry(depth, height, width);
  const backNet = new THREE.Mesh(backGeo, netMat);
  backNet.position.set(-depth / 2, height / 2, 0);

  goal.add(leftPost, rightPost, crossbar, backNet);
  return goal;
}

function createBasketballHoop(): THREE.Group {
  const hoop = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.35,
    metalness: 0.6,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: '#2563eb',
    roughness: 0.45,
    metalness: 0.2,
  });
  const boardMat = new THREE.MeshPhysicalMaterial({
    color: '#f8fafc',
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#ea580c',
    roughness: 0.4,
    metalness: 0.5,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.9), accentMat);
  base.position.y = 0.225;
  base.castShadow = true;

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 3.3, 10), poleMat);
  pole.position.y = 1.85;
  pole.castShadow = true;

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.12), poleMat);
  arm.position.set(0.42, 3.3, 0);

  const board = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 1.65), boardMat);
  board.position.set(0.88, 3.45, 0);
  board.castShadow = true;

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 20), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(1.15, 3.05, 0);

  const net = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.14, 0.42, 10, 1, true),
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    })
  );
  net.position.set(1.15, 2.84, 0);

  hoop.add(base, pole, arm, board, rim, net);
  return hoop;
}

function createMainBuilding(
  signTex: THREE.CanvasTexture,
  stoneTex: THREE.CanvasTexture
): THREE.Group {
  const building = new THREE.Group();

  const charcoalMat = new THREE.MeshStandardMaterial({
    color: '#2c3138',
    roughness: 0.48,
    metalness: 0.35,
  });
  const lightWallMat = new THREE.MeshStandardMaterial({
    color: '#e5e3dc',
    roughness: 0.78,
    metalness: 0.05,
  });
  const whiteTrimMat = new THREE.MeshStandardMaterial({
    color: '#f4f5f7',
    roughness: 0.45,
    metalness: 0.1,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#5a7f9c',
    roughness: 0.08,
    metalness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const louvreMat = new THREE.MeshStandardMaterial({
    color: '#3c4047',
    roughness: 0.4,
    metalness: 0.55,
  });
  const greenRoofMat = new THREE.MeshStandardMaterial({
    color: '#4e7b3f',
    roughness: 0.9,
    metalness: 0.0,
  });

  // Main Plaza Stone Pad
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(56, 0.3, 22),
    new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.82,
      metalness: 0.04,
    })
  );
  plaza.position.set(0, 0.04, 15);
  plaza.receiveShadow = true;
  building.add(plaza);

  // Rear / Core light-colored massing (steps back behind dark frame)
  const coreBody = new THREE.Mesh(new THREE.BoxGeometry(40, 14.5, 18), lightWallMat);
  coreBody.position.set(0, 7.25, -4);
  coreBody.castShadow = true;
  coreBody.receiveShadow = true;
  building.add(coreBody);

  // Rooftop garden grass patch
  const roofGarden = new THREE.Mesh(new THREE.BoxGeometry(36, 0.35, 14), greenRoofMat);
  roofGarden.position.set(0, 14.6, -4);
  building.add(roofGarden);

  // Iconic cantilevered dark charcoal outer shell (Left wall, Top roof, Right wall)
  const shellWidth = 42;
  const shellHeight = 15.2;
  const shellDepth = 13;

  const topShell = new THREE.Mesh(new THREE.BoxGeometry(shellWidth, 2.2, shellDepth), charcoalMat);
  topShell.position.set(0, shellHeight - 1.1, 3.2);
  topShell.castShadow = true;
  building.add(topShell);

  const leftShell = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, shellHeight - 2.2, shellDepth),
    charcoalMat
  );
  leftShell.position.set(-shellWidth / 2 + 1.3, (shellHeight - 2.2) / 2, 3.2);
  leftShell.castShadow = true;
  building.add(leftShell);

  const rightShell = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, shellHeight - 2.2, shellDepth),
    charcoalMat
  );
  rightShell.position.set(shellWidth / 2 - 1.3, (shellHeight - 2.2) / 2, 3.2);
  rightShell.castShadow = true;
  building.add(rightShell);

  // Recessed blue reflective curtain wall facade
  const curtainGlass = new THREE.Mesh(new THREE.BoxGeometry(36.8, 9.2, 0.5), glassMat);
  curtainGlass.position.set(0, 8.6, 8.2);
  building.add(curtainGlass);

  // Signature rhythmic vertical facade fins across upper curtain wall (from DSC_9457)
  const finCount = 29;
  const finGeo = new THREE.BoxGeometry(0.28, 4.4, 0.45);
  for (let i = 0; i < finCount; i++) {
    const fx = -16.8 + (i / (finCount - 1)) * 33.6;
    const hVar = i % 2 === 0 ? 1.0 : 0.72;
    const fin = new THREE.Mesh(finGeo, louvreMat);
    fin.scale.y = hVar;
    fin.position.set(fx, 10.6 - (1 - hVar) * 0.8, 8.6);
    fin.castShadow = true;
    building.add(fin);
  }

  // Horizontal mullion bands
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(37.2, 0.25, 0.65), whiteTrimMat);
  mullion.position.set(0, 7.6, 8.5);
  building.add(mullion);

  // Crisp white entrance canopy overhang + NHIS HRD signage (from DSC_9457)
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(38.5, 0.85, 4.8), whiteTrimMat);
  canopy.position.set(0, 4.4, 10.2);
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  building.add(canopy);

  const signBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 1.25),
    new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.4,
      metalness: 0.05,
    })
  );
  signBoard.position.set(0, 4.45, 12.63);
  building.add(signBoard);

  // Ground-floor glass lobby & support columns
  const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(35.5, 4.0, 0.4), glassMat);
  lobbyGlass.position.set(0, 2.0, 8.0);
  building.add(lobbyGlass);

  const colGeo = new THREE.CylinderGeometry(0.22, 0.22, 4.1, 12);
  [-15, -7.5, 7.5, 15].forEach((cx) => {
    const col = new THREE.Mesh(colGeo, whiteTrimMat);
    col.position.set(cx, 2.05, 11.4);
    col.castShadow = true;
    building.add(col);
  });

  // Flanking wing extension on west side of main hall (seen in DSC_9457)
  const westAnnex = new THREE.Mesh(new THREE.BoxGeometry(11, 10.5, 13), lightWallMat);
  westAnnex.position.set(-25.5, 5.25, -1.5);
  westAnnex.castShadow = true;
  westAnnex.receiveShadow = true;
  building.add(westAnnex);

  return building;
}

function createDormitoryWing(width: number, height: number, depth: number): THREE.Group {
  const wing = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({
    color: '#e7e2d8',
    roughness: 0.82,
    metalness: 0.04,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#9e6b47',
    roughness: 0.72,
    metalness: 0.05,
  });
  const slateMat = new THREE.MeshStandardMaterial({
    color: '#3d434c',
    roughness: 0.55,
    metalness: 0.25,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#537692',
    roughness: 0.12,
    metalness: 0.2,
    clearcoat: 0.8,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  wing.add(body);

  // Roof cap
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.65, depth + 0.8), slateMat);
  roof.position.y = height + 0.3;
  roof.castShadow = true;
  wing.add(roof);

  // Horizontal balcony bands & warm cedar recesses on south facade
  const floors = Math.max(3, Math.round(height / 3.2));
  const floorH = height / floors;
  for (let f = 0; f < floors - 1; f++) {
    const y = (f + 1) * floorH;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width - 2, 0.28, 0.9), wallMat);
    slab.position.set(0, y, depth / 2 + 0.35);
    slab.castShadow = true;
    wing.add(slab);

    const glassStrip = new THREE.Mesh(
      new THREE.BoxGeometry(width - 3.6, floorH * 0.55, 0.2),
      glassMat
    );
    glassStrip.position.set(0, y - floorH * 0.45, depth / 2 + 0.05);
    wing.add(glassStrip);

    // Cedar vertical balcony dividers
    const bays = Math.floor(width / 4.2);
    for (let b = 0; b <= bays; b++) {
      const bx = -width / 2 + 1.8 + b * ((width - 3.6) / bays);
      const divider = new THREE.Mesh(new THREE.BoxGeometry(0.45, floorH * 0.82, 0.75), woodMat);
      divider.position.set(bx, y - floorH * 0.45, depth / 2 + 0.32);
      wing.add(divider);
    }
  }

  // White elevator/stair core tower on one end (matching DSC_9457 right dorm)
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, height + 2.2, depth * 0.72),
    new THREE.MeshStandardMaterial({ color: '#f1f2f4', roughness: 0.65 })
  );
  tower.position.set(-width / 2 - 2.1, (height + 2.2) / 2, 0.5);
  tower.castShadow = true;
  wing.add(tower);

  return wing;
}

function createGymnasium(): THREE.Group {
  const gym = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: '#d8dde3',
    roughness: 0.7,
    metalness: 0.1,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: '#5a6370',
    roughness: 0.38,
    metalness: 0.55,
  });
  const solarMat = new THREE.MeshPhysicalMaterial({
    color: '#1e3557',
    roughness: 0.18,
    metalness: 0.55,
    clearcoat: 0.9,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(24, 9.5, 18), wallMat);
  body.position.y = 4.75;
  body.castShadow = true;
  body.receiveShadow = true;
  gym.add(body);

  // Sloped modern roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 20), roofMat);
  roof.position.y = 9.9;
  roof.rotation.x = 0.12;
  roof.castShadow = true;
  gym.add(roof);

  // Solar panel array on south roof slope (seen in DJI_0008)
  for (let row = 0; row < 2; row++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(19, 0.18, 4.2), solarMat);
    panel.position.set(0, 10.65 - row * 0.6, -2.5 + row * 5.2);
    panel.rotation.x = 0.14;
    gym.add(panel);
  }

  return gym;
}

function createPergolaBleachers(woodTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();

  const woodDeckMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.78,
    metalness: 0.04,
  });
  const timberMat = new THREE.MeshStandardMaterial({
    color: '#7c4d2b',
    roughness: 0.75,
    metalness: 0.04,
  });
  const pillarMat = new THREE.MeshStandardMaterial({
    color: '#2d3138',
    roughness: 0.45,
    metalness: 0.45,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#d4d1c9',
    roughness: 0.85,
  });

  // Stepped wooden deck bleachers along north edge of soccer field (X: -24..+35, Z: -34.5..-30.5)
  const tierWidths = [59, 59, 59];
  tierWidths.forEach((w, idx) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, 0.38, 1.45), woodDeckMat);
    step.position.set(5.5, 0.19 + idx * 0.36, -31.1 - idx * 1.25);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  });

  // White stone staircases cutting cleanly through the wooden tiers (matching DSC_9145)
  [-22, -7.5, 7.5, 21.5].forEach((sx) => {
    for (let s = 0; s < 3; s++) {
      const stair = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 1.5), stoneMat);
      stair.position.set(sx, 0.21 + s * 0.36, -31.1 - s * 1.25);
      stair.receiveShadow = true;
      group.add(stair);
    }
  });

  // 4 Timber Pergolas (목재 파고라)
  const pergolaCenters = [-15, 0, 15, 28.5];
  pergolaCenters.forEach((px) => {
    const pg = new THREE.Group();
    pg.position.set(px, 1.08, -33.3);

    const spanW = 10.6;
    const spanD = 3.2;
    const postH = 3.1;

    const postGeo = new THREE.BoxGeometry(0.22, postH, 0.22);
    [
      [-spanW / 2 + 0.4, -spanD / 2 + 0.3],
      [spanW / 2 - 0.4, -spanD / 2 + 0.3],
      [-spanW / 2 + 0.4, spanD / 2 - 0.3],
      [spanW / 2 - 0.4, spanD / 2 - 0.3],
      [0, -spanD / 2 + 0.3],
      [0, spanD / 2 - 0.3],
    ].forEach(([cx, cz]) => {
      const post = new THREE.Mesh(postGeo, pillarMat);
      post.position.set(cx, postH / 2, cz);
      post.castShadow = true;
      pg.add(post);
    });

    // Main horizontal timber beams
    [-spanD / 2 + 0.3, spanD / 2 - 0.3].forEach((bz) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(spanW + 0.8, 0.22, 0.18), timberMat);
      beam.position.set(0, postH + 0.1, bz);
      beam.castShadow = true;
      pg.add(beam);
    });

    // Lattice rafters across roof
    const rafterCount = 13;
    const rafterGeo = new THREE.BoxGeometry(0.14, 0.24, spanD + 1.0);
    for (let r = 0; r < rafterCount; r++) {
      const rx = -spanW / 2 + (r / (rafterCount - 1)) * spanW;
      const rafter = new THREE.Mesh(rafterGeo, timberMat);
      rafter.position.set(rx, postH + 0.28, 0);
      rafter.castShadow = true;
      pg.add(rafter);
    }

    // Wooden bench underneath
    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.42, 0.65), timberMat);
    bench.position.set(0, 0.21, 0);
    bench.castShadow = true;
    pg.add(bench);

    group.add(pg);
  });

  return group;
}

function createBellPavilion(
  nightLights: THREE.PointLight[],
  lanternEmissives: THREE.MeshStandardMaterial[]
): { pavilion: THREE.Group; bellPivot: THREE.Group; strikerPivot: THREE.Group } {
  const pavilion = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#c9c6be',
    roughness: 0.85,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#5b3924',
    roughness: 0.72,
    metalness: 0.05,
  });
  const tileMat = new THREE.MeshStandardMaterial({
    color: '#2c3137',
    roughness: 0.62,
    metalness: 0.18,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: '#7e663d',
    roughness: 0.32,
    metalness: 0.82,
  });

  // Two-step granite dais
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.32, 6.2), stoneMat);
  base1.position.y = 0.16;
  base1.receiveShadow = true;
  base1.castShadow = true;
  pavilion.add(base1);

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.25, 5.0), stoneMat);
  base2.position.y = 0.44;
  base2.receiveShadow = true;
  pavilion.add(base2);

  // 4 traditional round timber pillars
  const pillarGeo = new THREE.CylinderGeometry(0.16, 0.19, 3.6, 12);
  [
    [-1.9, -1.9],
    [1.9, -1.9],
    [-1.9, 1.9],
    [1.9, 1.9],
  ].forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, woodMat);
    pillar.position.set(px, 2.35, pz);
    pillar.castShadow = true;
    pavilion.add(pillar);
  });

  // Crossbeam & curved Korean hipped roof (팔작지붕/사모지붕 느낌)
  const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.24, 0.28), woodMat);
  crossbeam.position.set(0, 4.05, 0);
  pavilion.add(crossbeam);

  const eaves = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 5.6), woodMat);
  eaves.position.set(0, 4.22, 0);
  eaves.castShadow = true;
  pavilion.add(eaves);

  const roofPyramid = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.85, 4), tileMat);
  roofPyramid.rotation.y = Math.PI / 4;
  roofPyramid.position.set(0, 5.25, 0);
  roofPyramid.castShadow = true;
  pavilion.add(roofPyramid);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), bronzeMat);
  finial.position.set(0, 6.22, 0);
  pavilion.add(finial);

  // Hanging Bronze Bell (LatheGeometry profile)
  const bellPivot = new THREE.Group();
  bellPivot.position.set(0, 3.95, 0);

  const bellPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.22, -0.05),
    new THREE.Vector2(0.38, -0.25),
    new THREE.Vector2(0.46, -0.7),
    new THREE.Vector2(0.54, -1.25),
    new THREE.Vector2(0.58, -1.48),
    new THREE.Vector2(0.48, -1.48),
    new THREE.Vector2(0.42, -1.2),
    new THREE.Vector2(0.0, -0.2),
  ];
  const bellGeo = new THREE.LatheGeometry(bellPoints, 28);
  const bellMesh = new THREE.Mesh(bellGeo, bronzeMat);
  bellMesh.castShadow = true;
  bellPivot.add(bellMesh);

  // Hanging yoke
  const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 10), bronzeMat);
  yoke.position.y = -0.05;
  bellPivot.add(yoke);
  pavilion.add(bellPivot);

  // Wooden Striking Beam (당목) suspended beside bell
  const strikerPivot = new THREE.Group();
  strikerPivot.position.set(0, 3.55, 1.15);
  const strikerLog = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.65, 10), woodMat);
  strikerLog.rotation.x = Math.PI / 2;
  strikerLog.position.set(0, -1.1, 0.25);
  strikerLog.castShadow = true;
  strikerPivot.add(strikerLog);
  pavilion.add(strikerPivot);

  // Warm lantern glow under roof
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fde68a',
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });
  lanternEmissives.push(lanternMat);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), lanternMat);
  bulb.position.set(0, 3.8, 0);
  pavilion.add(bulb);

  const bellLight = new THREE.PointLight('#fbbf24', 0, 14, 1.8);
  bellLight.position.set(0, 3.4, 0);
  pavilion.add(bellLight);
  nightLights.push(bellLight);

  return { pavilion, bellPivot, strikerPivot };
}

function createLakeOverlookPavilion(
  woodTex: THREE.CanvasTexture,
  nightLights: THREE.PointLight[],
  lanternEmissives: THREE.MeshStandardMaterial[]
): THREE.Group {
  const group = new THREE.Group();

  const deckMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.8,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#634028',
    roughness: 0.74,
  });
  const tileMat = new THREE.MeshStandardMaterial({
    color: '#30363e',
    roughness: 0.65,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#b8b5ad',
    roughness: 0.88,
  });

  // Wooden observation deck jutting toward Cheongpung Lake
  const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 13), deckMat);
  deck.position.set(0, 0.25, 2.5);
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  // Perimeter wooden railing posts
  const railGeo = new THREE.BoxGeometry(15.6, 0.08, 0.1);
  const frontRail = new THREE.Mesh(railGeo, woodMat);
  frontRail.position.set(0, 1.25, 8.85);
  group.add(frontRail);

  for (let x = -7.5; x <= 7.5; x += 2.5) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), woodMat);
    post.position.set(x, 0.9, 8.85);
    group.add(post);
  }

  // Open Hexagonal/Octagonal Meditation Pavilion (팔각정) on the west side of the deck
  const pav = new THREE.Group();
  pav.position.set(-3.8, 0.5, 0.5);

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.35, 8), woodMat);
  floor.position.y = 0.175;
  floor.receiveShadow = true;
  pav.add(floor);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 2.9, 10), woodMat);
    pillar.position.set(Math.cos(angle) * 2.7, 1.75, Math.sin(angle) * 2.7);
    pillar.castShadow = true;
    pav.add(pillar);
  }

  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.1, 1.55, 6), tileMat);
  roof.position.y = 3.85;
  roof.castShadow = true;
  pav.add(roof);

  group.add(pav);

  // Two traditional Korean Granite Stone Lanterns (석등)
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 0.45,
  });
  lanternEmissives.push(lanternMat);

  [-6.8, 6.8].forEach((lx) => {
    const lantern = new THREE.Group();
    lantern.position.set(lx, 0.5, 7.6);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.65), stoneMat);
    plinth.position.y = 0.125;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.95, 8), stoneMat);
    shaft.position.y = 0.72;
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), lanternMat);
    chamber.position.y = 1.4;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.38, 4), stoneMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.y = 1.8;

    lantern.add(plinth, shaft, chamber, cap);
    group.add(lantern);

    const pt = new THREE.PointLight('#fbbf24', 0, 12, 1.8);
    pt.position.set(lx, 2.0, 7.6);
    group.add(pt);
    nightLights.push(pt);
  });

  return group;
}

function buildInstancedForest(group: THREE.Group): void {
  const treePositions: Array<{ x: number; z: number; scale: number; kind: 'pine' | 'leafy' }> = [];

  // Deterministic pseudo-random helper so campus layout stays clean & balanced
  let seed = 4219;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Helper to check exclusion zones (roads, fields, buildings)
  const isClearOfBuildings = (x: number, z: number) => {
    // Soccer field & bleachers & plaza
    if (x > -52 && x < 52 && z > -39 && z < 32) return false;
    // Main building + front plaza
    if (x > -34 && x < 34 && z > -76 && z < -37) return false;
    // Dormitories
    if (x > -72 && x < -38 && z > -92 && z < -54) return false;
    if (x > 30 && x < 88 && z > -98 && z < -45) return false;
    // Gymnasium
    if (x > 80 && x < 116 && z > -62 && z < -32) return false;
    // Tennis courts & Lake overlook
    if (x > -48 && x < 44 && z > 32 && z < 68) return false;
    return true;
  };

  // 1. Campus ornamental trees along walkways, rock garden & field edges
  const campusTrees: Array<[number, number, number, 'pine' | 'leafy']> = [
    [-29, -31.5, 1.15, 'leafy'],
    [-47.5, -27, 1.2, 'leafy'],
    [-35, -42, 1.05, 'leafy'],
    [-38, -48, 1.15, 'leafy'],
    [-32, -55, 1.0, 'pine'],
    [29, -38, 1.1, 'leafy'],
    [35, -38, 1.15, 'leafy'],
    [42, -38, 1.1, 'leafy'],
    [-46, 33, 1.1, 'leafy'],
    [2, 33, 1.15, 'leafy'],
    [3, 46, 1.1, 'leafy'],
    [40, 42, 1.2, 'pine'],
    [42, 54, 1.1, 'pine'],
    [-48, 45, 1.25, 'pine'],
    [-48, 56, 1.15, 'pine'],
  ];
  campusTrees.forEach(([x, z, scale, kind]) => {
    treePositions.push({ x, z, scale, kind });
  });

  // 2. Mountain forest behind campus & lakeside peninsulas
  for (let i = 0; i < 420; i++) {
    const x = (rand() - 0.5) * 440;
    const z = -250 + rand() * 440;
    if (!isClearOfBuildings(x, z)) continue;

    const h = getGroundHeight(x, z);
    // Do not place trees inside Cheongpung Lake water
    if (h < -6.2) continue;

    treePositions.push({
      x,
      z,
      scale: 0.85 + rand() * 0.75,
      kind: h > 10 || rand() > 0.45 ? 'pine' : 'leafy',
    });
  }

  const pines = treePositions.filter((t) => t.kind === 'pine');
  const leafies = treePositions.filter((t) => t.kind === 'leafy');

  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.2, 6);
  trunkGeo.translate(0, 1.1, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5b402c', roughness: 0.9 });

  // Pine multi-tier cone geometry
  const pineLowerGeo = new THREE.ConeGeometry(1.85, 3.6, 7);
  pineLowerGeo.translate(0, 3.4, 0);
  const pineUpperGeo = new THREE.ConeGeometry(1.35, 3.2, 7);
  pineUpperGeo.translate(0, 5.2, 0);
  const pineMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.02 });

  // Leafy rounded canopy
  const leafyGeo = new THREE.DodecahedronGeometry(2.0, 1);
  leafyGeo.translate(0, 3.6, 0);
  const leafyMat = new THREE.MeshStandardMaterial({ roughness: 0.84, metalness: 0.02 });

  const totalTrunks = treePositions.length;
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, totalTrunks);
  const pineLowInst = new THREE.InstancedMesh(pineLowerGeo, pineMat, pines.length);
  const pineTopInst = new THREE.InstancedMesh(pineUpperGeo, pineMat, pines.length);
  const leafyInst = new THREE.InstancedMesh(leafyGeo, leafyMat, leafies.length);

  trunkInst.castShadow = true;
  pineLowInst.castShadow = true;
  pineTopInst.castShadow = true;
  leafyInst.castShadow = true;
  leafyInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const c = new THREE.Color();

  treePositions.forEach((t, idx) => {
    const y = getGroundHeight(t.x, t.z);
    dummy.position.set(t.x, y - 0.1, t.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.setScalar(t.scale);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);
  });

  pines.forEach((t, idx) => {
    const y = getGroundHeight(t.x, t.z);
    dummy.position.set(t.x, y - 0.1, t.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(t.scale, t.scale * (0.95 + rand() * 0.25), t.scale);
    dummy.updateMatrix();
    pineLowInst.setMatrixAt(idx, dummy.matrix);
    pineTopInst.setMatrixAt(idx, dummy.matrix);

    c.setHSL(0.28 + (rand() - 0.5) * 0.04, 0.42 + rand() * 0.12, 0.22 + rand() * 0.1);
    pineLowInst.setColorAt(idx, c);
    c.offsetHSL(0, 0, 0.04);
    pineTopInst.setColorAt(idx, c);
  });

  leafies.forEach((t, idx) => {
    const y = getGroundHeight(t.x, t.z);
    dummy.position.set(t.x, y - 0.1, t.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(t.scale * 1.1, t.scale * 0.95, t.scale * 1.1);
    dummy.updateMatrix();
    leafyInst.setMatrixAt(idx, dummy.matrix);

    c.setHSL(0.26 + (rand() - 0.5) * 0.05, 0.48 + rand() * 0.12, 0.3 + rand() * 0.12);
    leafyInst.setColorAt(idx, c);
  });

  [trunkInst, pineLowInst, pineTopInst, leafyInst].forEach((inst) => {
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    group.add(inst);
  });
}

export function buildCampusScene(maxAnisotropy: number): CampusBuildResult {
  const group = new THREE.Group();
  const colliders: CampusBuildResult['colliders'] = [];
  const nightLights: THREE.PointLight[] = [];
  const lanternEmissives: THREE.MeshStandardMaterial[] = [];

  const soccerTex = createSoccerFieldTexture(maxAnisotropy);
  const tennisTex = createTennisCourtTexture(maxAnisotropy);
  const basketTex = createBasketballCourtTexture(maxAnisotropy);
  const stoneTex = createStonePavingTexture(maxAnisotropy);
  const woodTex = createWoodDeckTexture(maxAnisotropy);
  const signTex = createSignageTexture(maxAnisotropy);

  // 1. Soccer Field (운동장)
  const fieldGeo = new THREE.PlaneGeometry(92, 56);
  fieldGeo.rotateX(-Math.PI / 2);
  const fieldMesh = new THREE.Mesh(
    fieldGeo,
    new THREE.MeshStandardMaterial({
      map: soccerTex,
      roughness: 0.88,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  fieldMesh.position.set(0, 0.04, 0);
  fieldMesh.receiveShadow = true;
  group.add(fieldMesh);

  // West & East Soccer Goals
  const westGoal = createGoalNet();
  westGoal.position.set(-42.5, 0.04, 0);
  group.add(westGoal);

  const eastGoal = createGoalNet();
  eastGoal.rotation.y = Math.PI;
  eastGoal.position.set(42.5, 0.04, 0);
  group.add(eastGoal);

  // Corner Flags
  const flagPoleMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
  const flagClothMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    side: THREE.DoubleSide,
  });
  [
    [-41.5, -24.5],
    [41.5, -24.5],
    [-41.5, 24.5],
    [41.5, 24.5],
  ].forEach(([fx, fz]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), flagPoleMat);
    pole.position.set(fx, 0.75, fz);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.3), flagClothMat);
    cloth.position.set(fx + 0.22, 1.32, fz);
    group.add(pole, cloth);
  });

  // Ball-stop high green mesh fence along East & South-East perimeter (seen in DSC_9145)
  const fenceMat = new THREE.MeshStandardMaterial({
    color: '#1e4d2b',
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });
  const eastFence = new THREE.Mesh(new THREE.PlaneGeometry(56, 6.2, 24, 6), fenceMat);
  eastFence.rotation.y = -Math.PI / 2;
  eastFence.position.set(47.5, 3.1, 0);
  group.add(eastFence);

  const fencePostGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.2, 6);
  const fencePostMat = new THREE.MeshStandardMaterial({ color: '#1b3b24', roughness: 0.6 });
  for (let z = -28; z <= 28; z += 7) {
    const post = new THREE.Mesh(fencePostGeo, fencePostMat);
    post.position.set(47.5, 3.1, z);
    group.add(post);
  }

  // 2. Paved Campus North Road & Basketball Court (농구장)
  const roadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(165, 7.6),
    new THREE.MeshStandardMaterial({
      color: '#575c63',
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(0, 0.07, -34.2);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  const basketCourt = new THREE.Mesh(
    new THREE.PlaneGeometry(17.5, 10.5),
    new THREE.MeshStandardMaterial({
      map: basketTex,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  basketCourt.rotation.x = -Math.PI / 2;
  basketCourt.position.set(-37.5, 0.09, -32.8);
  basketCourt.receiveShadow = true;
  group.add(basketCourt);

  const hoopLeft = createBasketballHoop();
  hoopLeft.position.set(-45.5, 0.08, -32.8);
  group.add(hoopLeft);

  const hoopRight = createBasketballHoop();
  hoopRight.rotation.y = Math.PI;
  hoopRight.position.set(-29.5, 0.08, -32.8);
  group.add(hoopRight);

  // 3. Twin Tennis Courts (남쪽 테니스장)
  const tennisMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 22),
    new THREE.MeshStandardMaterial({
      map: tennisTex,
      roughness: 0.86,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  tennisMesh.rotation.x = -Math.PI / 2;
  tennisMesh.position.set(-25, -0.26, 47);
  tennisMesh.receiveShadow = true;
  group.add(tennisMesh);

  // Tennis Nets
  [-33.5, -16.5].forEach((tx) => {
    const net = new THREE.Mesh(
      new THREE.PlaneGeometry(11.5, 0.95, 14, 2),
      new THREE.MeshStandardMaterial({
        color: '#f1f5f9',
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      })
    );
    net.position.set(tx, 0.25, 47);
    group.add(net);
  });

  // 4. Wooden Bleachers & 4 Timber Pergolas
  const bleachers = createPergolaBleachers(woodTex);
  group.add(bleachers);

  // 5. Main Education Hall (본관)
  const mainBuilding = createMainBuilding(signTex, stoneTex);
  mainBuilding.position.set(0, 2.6, -61);
  group.add(mainBuilding);
  addCollider(colliders, 0, -60, 42, 22);
  addCollider(colliders, -25.5, -62.5, 11, 13);

  // 6. Dormitory Wings (서동, 동동 1·2관) & Gymnasium (체육관)
  const westDorm = createDormitoryWing(32, 14.5, 11);
  westDorm.position.set(-55, 4.3, -72);
  westDorm.rotation.y = -0.35;
  group.add(westDorm);
  addCollider(colliders, -55, -72, 30, 14);

  const eastDorm1 = createDormitoryWing(26, 12.8, 10.5);
  eastDorm1.position.set(48, 2.5, -56);
  eastDorm1.rotation.y = 0.08;
  group.add(eastDorm1);
  addCollider(colliders, 48, -56, 26, 11);

  const eastDorm2 = createDormitoryWing(30, 14.5, 11);
  eastDorm2.position.set(46, 5.1, -85);
  eastDorm2.rotation.y = -0.05;
  group.add(eastDorm2);
  addCollider(colliders, 46, -85, 30, 12);

  const gym = createGymnasium();
  gym.position.set(96, 1.5, -46);
  gym.rotation.y = -0.22;
  group.add(gym);
  addCollider(colliders, 96, -46, 24, 18);

  // 7. Sansa Temple Landmarks: Resonance Bell Pavilion & Cheongpung Lake Overlook
  const { pavilion: bellPavilion, bellPivot, strikerPivot } = createBellPavilion(
    nightLights,
    lanternEmissives
  );
  bellPavilion.position.set(24, 2.6, -42);
  group.add(bellPavilion);
  addCollider(colliders, 24, -42, 4.6, 4.6);

  const lakeOverlook = createLakeOverlookPavilion(woodTex, nightLights, lanternEmissives);
  lakeOverlook.position.set(22, 0.2, 57);
  group.add(lakeOverlook);

  // Stone path leading from soccer field south edge to lake overlook
  const stonePath = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 26),
    new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  stonePath.rotation.x = -Math.PI / 2;
  stonePath.position.set(22, 0.23, 42);
  stonePath.receiveShadow = true;
  group.add(stonePath);

  // 8. Mountain Peak Pavilion (금수산 산정 정자 - visible in DJI_0037)
  const mountainPav = new THREE.Group();
  const mpY = getGroundHeight(32, -145);
  mountainPav.position.set(32, mpY, -145);
  const mpBase = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.5, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: '#9a968c', roughness: 0.9 })
  );
  const mpRoof = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 1.9, 6),
    new THREE.MeshStandardMaterial({ color: '#2b3036', roughness: 0.7 })
  );
  mpRoof.position.y = 3.2;
  mountainPav.add(mpBase, mpRoof);
  group.add(mountainPav);

  // 9. Distant Cheongpung Bridge Silhouette (청풍대교 - visible in DJI_0008)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(-115, -5.5, 215);
  bridgeGroup.rotation.y = 0.45;
  const bridgeMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.6 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(120, 1.4, 4.5), bridgeMat);
  deck.position.y = 6;
  bridgeGroup.add(deck);
  [-24, 24].forEach((px) => {
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.0, 26, 2.2), bridgeMat);
    pylon.position.set(px, 13, 0);
    bridgeGroup.add(pylon);
  });
  group.add(bridgeGroup);

  // 10. Instanced Forest Trees
  buildInstancedForest(group);

  return {
    group,
    bellPivot,
    strikerPivot,
    nightLights,
    lanternEmissives,
    colliders,
  };
}
