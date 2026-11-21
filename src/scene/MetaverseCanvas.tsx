import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundscape } from '../audio/soundscape';
import { detectZoneName, MINDFUL_POINTS } from '../data/campusLocations';
import type {
  CameraMode,
  HudSnapshot,
  MindfulPoint,
  TeleportSpot,
  TimeOfDay,
  WishNote,
} from '../types/metaverse';
import { createAvatarRig } from './avatar';
import { buildCampusScene } from './campusBuildings';
import {
  createLotusLanternMesh,
  createMindfulMarkers,
  createSkyClouds,
  createSoccerBall,
  type LotusLantern,
} from './sansaEffects';
import { buildCheongpungLake, buildTerrainMesh, getGroundHeight } from './terrain';

export interface MetaverseHandle {
  teleportTo: (spot: TeleportSpot) => void;
  strikeBell: () => void;
  spawnWishLantern: (color: string) => void;
  resetSoccerBall: () => void;
  setJoystickVector: (x: number, y: number) => void;
  triggerJump: () => void;
}

interface MetaverseCanvasProps {
  timeOfDay: TimeOfDay;
  cameraMode: CameraMode;
  wishes: WishNote[];
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onInteractPoint: (point: MindfulPoint) => void;
  onGoalScored: (count: number) => void;
}

interface LightingPreset {
  sky: string;
  fogDensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  exposure: number;
  nightGlow: number;
}

const LIGHTING_PRESETS: Record<TimeOfDay, LightingPreset> = {
  morning: {
    sky: '#c9dfeb',
    fogDensity: 0.0028,
    sunColor: '#ffe7c2',
    sunIntensity: 1.9,
    sunPos: [85, 55, 45],
    hemiSky: '#cfe7f7',
    hemiGround: '#546e4b',
    hemiIntensity: 0.9,
    exposure: 1.05,
    nightGlow: 0.25,
  },
  day: {
    // Crisp blue sky & bright daylight matching DSC_9145 / DSC_9457
    sky: '#8ec2ec',
    fogDensity: 0.0014,
    sunColor: '#fff8eb',
    sunIntensity: 2.35,
    sunPos: [70, 115, 65],
    hemiSky: '#a8d5f7',
    hemiGround: '#4a6b3d',
    hemiIntensity: 0.95,
    exposure: 1.1,
    nightGlow: 0.0,
  },
  sunset: {
    sky: '#e2a47c',
    fogDensity: 0.0022,
    sunColor: '#ff9b54',
    sunIntensity: 2.0,
    sunPos: [-110, 32, 75],
    hemiSky: '#f5b895',
    hemiGround: '#3d453b',
    hemiIntensity: 0.78,
    exposure: 1.02,
    nightGlow: 0.75,
  },
  night: {
    sky: '#142033',
    fogDensity: 0.0024,
    sunColor: '#9ebce8',
    sunIntensity: 0.65,
    sunPos: [-60, 85, -40],
    hemiSky: '#2d456b',
    hemiGround: '#1a2420',
    hemiIntensity: 0.48,
    exposure: 0.95,
    nightGlow: 2.2,
  },
};

// Pre-allocated math helpers (zero GC inside animation loop)
const _camGoalPos = new THREE.Vector3();
const _camGoalLook = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _targetSky = new THREE.Color();
const _targetSun = new THREE.Color();
const _targetHemiSky = new THREE.Color();
const _targetHemiGround = new THREE.Color();

export const MetaverseCanvas = forwardRef<MetaverseHandle, MetaverseCanvasProps>(
  function MetaverseCanvas(
    { timeOfDay, cameraMode, wishes, onHudUpdate, onInteractPoint, onGoalScored },
    ref
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    // Refs synced with React props so WebGL lifecycle never tears down
    const timeOfDayRef = useRef<TimeOfDay>(timeOfDay);
    const cameraModeRef = useRef<CameraMode>(cameraMode);
    const onHudRef = useRef(onHudUpdate);
    const onInteractRef = useRef(onInteractPoint);
    const onGoalRef = useRef(onGoalScored);

    timeOfDayRef.current = timeOfDay;
    cameraModeRef.current = cameraMode;
    onHudRef.current = onHudUpdate;
    onInteractRef.current = onInteractPoint;
    onGoalRef.current = onGoalScored;

    // Mutable simulation control refs
    const joystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const jumpTriggerRef = useRef(false);
    const bellImpulseRef = useRef(0);
    const spawnLanternFnRef = useRef<((color: string) => void) | null>(null);
    const teleportFnRef = useRef<((spot: TeleportSpot) => void) | null>(null);
    const resetBallFnRef = useRef<(() => void) | null>(null);

    useImperativeHandle(ref, () => ({
      teleportTo: (spot) => teleportFnRef.current?.(spot),
      strikeBell: () => {
        bellImpulseRef.current = 1.0;
        soundscape.playTempleBell();
      },
      spawnWishLantern: (color) => {
        spawnLanternFnRef.current?.(color);
      },
      resetSoccerBall: () => {
        resetBallFnRef.current?.();
      },
      setJoystickVector: (x, y) => {
        joystickRef.current.x = x;
        joystickRef.current.y = y;
      },
      triggerJump: () => {
        jumpTriggerRef.current = true;
      },
    }));

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      // Software WebGL detector (Three.js skill §2.1)
      const isSoftwareGl = (() => {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      })();

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      container.appendChild(renderer.domElement);

      const onLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const onRestored = () => {
        setContextLost(false);
      };
      renderer.domElement.addEventListener('webglcontextlost', onLost);
      renderer.domElement.addEventListener('webglcontextrestored', onRestored);

      const scene = new THREE.Scene();
      const initialPreset = LIGHTING_PRESETS[timeOfDayRef.current];
      scene.background = new THREE.Color(initialPreset.sky);
      const fog = new THREE.FogExp2(initialPreset.sky, initialPreset.fogDensity);
      scene.fog = fog;

      // Mandatory procedural studio environment map (RoomEnvironment)
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();

      const camera = new THREE.PerspectiveCamera(56, width / height, 0.25, 950);

      // 3-point warm/cool outdoor lighting rig
      const hemiLight = new THREE.HemisphereLight(
        initialPreset.hemiSky,
        initialPreset.hemiGround,
        initialPreset.hemiIntensity
      );
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(
        initialPreset.sunColor,
        initialPreset.sunIntensity
      );
      sunLight.position.set(...initialPreset.sunPos);
      sunLight.castShadow = !isSoftwareGl;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 340;
      const d = 125;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.03;
      scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight('#bfe3ff', 0.4);
      rimLight.position.set(-70, 50, -90);
      scene.add(rimLight);

      // World geometry
      const terrain = buildTerrainMesh();
      scene.add(terrain);

      const lake = buildCheongpungLake();
      scene.add(lake);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const campus = buildCampusScene(maxAniso);
      scene.add(campus.group);

      const clouds = createSkyClouds();
      scene.add(clouds);

      const mindfulMarkers = createMindfulMarkers();
      scene.add(mindfulMarkers);

      // Click-to-walk destination ring
      const destRing = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.65, 24),
        new THREE.MeshBasicMaterial({
          color: '#fef08a',
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      destRing.rotation.x = -Math.PI / 2;
      destRing.visible = false;
      scene.add(destRing);

      // Interactive Soccer Ball on the field
      const soccer = createSoccerBall();
      scene.add(soccer.mesh, soccer.shadow);
      const ballState = {
        x: 0,
        y: 0.28,
        z: 0,
        vx: 0,
        vz: 0,
        goalCount: 0,
        goalCooldown: 0,
      };
      resetBallFnRef.current = () => {
        ballState.x = 0;
        ballState.z = 0;
        ballState.vx = 0;
        ballState.vz = 0;
      };

      // Floating Lotus Wish Lanterns on Cheongpung Lake
      const lanterns: LotusLantern[] = [];
      const addLantern = (x: number, z: number, colorHex: string) => {
        const mesh = createLotusLanternMesh(colorHex);
        mesh.position.set(x, -8.45, z);
        scene.add(mesh);
        lanterns.push({
          group: mesh,
          baseX: x,
          baseZ: z,
          phase: Math.random() * Math.PI * 2,
          driftSpeed: 0.35 + Math.random() * 0.3,
        });
      };

      wishes.forEach((w, idx) => {
        addLantern(10 + idx * 11, 88 + (idx % 2) * 12, w.color);
      });
      // Additional serene lanterns across the cove
      addLantern(-12, 95, '#F59E0B');
      addLantern(38, 102, '#FBBF24');

      spawnLanternFnRef.current = (color: string) => {
        const rx = 8 + Math.random() * 28;
        const rz = 80 + Math.random() * 28;
        addLantern(rx, rz, color);
      };

      // Avatar rig
      const avatar = createAvatarRig();
      scene.add(avatar.root);

      // Player & Camera state
      const player = {
        x: 0,
        y: 0,
        z: 14,
        vy: 0,
        yaw: Math.PI, // Facing North toward Pergolas & Main Building
        speed: 0,
        isGrounded: true,
        walkTarget: null as THREE.Vector3 | null,
      };
      avatar.root.position.set(player.x, player.y, player.z);
      avatar.root.rotation.y = player.yaw;

      const camOrbit = {
        yaw: 0, // camera behind player looking North (0 = looking -Z)
        pitch: 0.24,
        distance: 11.5,
      };

      camera.position.set(0, 4.5, 25);
      camera.lookAt(0, 2.5, -20);

      teleportFnRef.current = (spot: TeleportSpot) => {
        player.x = spot.position[0];
        player.y = spot.position[1];
        player.z = spot.position[2];
        player.vy = 0;
        player.yaw = spot.yaw;
        player.walkTarget = null;
        // Align camera gently behind new facing direction
        camOrbit.yaw = spot.yaw - Math.PI;
        if (spot.id === 'lake-overlook') {
          camOrbit.yaw = Math.PI; // look South over Cheongpung Lake
        } else if (spot.id === 'pergola-deck') {
          camOrbit.yaw = Math.PI; // look South over Soccer Field
        } else if (spot.id === 'field-center' || spot.id === 'main-plaza') {
          camOrbit.yaw = 0; // look North toward Main Hall
        }
      };

      // Pre-warm shaders on GPU devices
      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Keyboard & Pointer Input
      const keys: Record<string, boolean> = {};
      const onKeyDown = (e: KeyboardEvent) => {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        keys[e.code] = true;
        if (e.code === 'Space') {
          jumpTriggerRef.current = true;
        }
        if (e.code === 'KeyE') {
          // Check nearby mindful point
          for (const pt of MINDFUL_POINTS) {
            const dist = Math.hypot(player.x - pt.position[0], player.z - pt.position[2]);
            if (dist <= pt.radius) {
              if (pt.id === 'resonance-bell') {
                bellImpulseRef.current = 1.0;
                soundscape.playTempleBell();
              } else {
                soundscape.playWindChime(0.16);
              }
              onInteractRef.current(pt);
              break;
            }
          }
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        keys[e.code] = false;
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      let isDragging = false;
      let dragMoved = 0;
      let lastPointerX = 0;
      let lastPointerY = 0;

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        dragMoved = 0;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        dragMoved += Math.abs(dx) + Math.abs(dy);

        camOrbit.yaw -= dx * 0.0055;
        camOrbit.pitch = THREE.MathUtils.clamp(
          camOrbit.pitch + dy * 0.0045,
          cameraModeRef.current === 'first-person' ? -0.45 : 0.04,
          cameraModeRef.current === 'drone' ? 1.25 : 0.92
        );
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;

        // Short click without drag -> Click-to-walk on terrain/field
        if (dragMoved < 6 && cameraModeRef.current !== 'first-person') {
          const rect = renderer.domElement.getBoundingClientRect();
          _ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          _ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          _raycaster.setFromCamera(_ndc, camera);

          const hits = _raycaster.intersectObject(terrain, false);
          if (hits.length > 0) {
            const p = hits[0].point;
            // Only walk to non-submerged ground inside walkable bounds
            if (p.y > -3.5 && Math.abs(p.x) < 115 && p.z > -95 && p.z < 68) {
              player.walkTarget = new THREE.Vector3(p.x, p.y, p.z);
              destRing.position.set(p.x, p.y + 0.09, p.z);
              destRing.visible = true;
            }
          }
        }
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        camOrbit.distance = THREE.MathUtils.clamp(
          camOrbit.distance + e.deltaY * 0.012,
          4.5,
          cameraModeRef.current === 'drone' ? 95 : 32
        );
      };

      const dom = renderer.domElement;
      dom.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      dom.addEventListener('wheel', onWheel, { passive: false });

      const onResize = () => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      // Animation Loop with Software-WebGL Pacing
      let frameId = 0;
      let disposed = false;
      const clock = new THREE.Clock();
      let hudThrottle = 0;
      let bellSwingPhase = 0;

      function afterDraw(cb: () => void) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      const tick = () => {
        if (disposed) return;
        const dt = Math.min(clock.getDelta(), 0.08);
        const elapsed = clock.getElapsedTime();

        // 1. Update Lake shader waves & clouds
        lake.material.userData.uTime.value = elapsed;
        clouds.children.forEach((cloud, idx) => {
          cloud.position.x += dt * (0.45 + (idx % 3) * 0.15);
          if (cloud.position.x > 260) cloud.position.x = -260;
        });

        // 2. Update Floating Lotus Lanterns bobbing gently on Cheongpung Lake
        for (let i = 0; i < lanterns.length; i++) {
          const l = lanterns[i];
          l.group.position.y = -8.45 + Math.sin(elapsed * 1.4 + l.phase) * 0.08;
          l.group.position.x = l.baseX + Math.sin(elapsed * 0.25 + l.phase) * l.driftSpeed * 2.0;
          l.group.rotation.y += dt * 0.12;
        }

        // 3. Bell swing & striker animation
        if (bellImpulseRef.current > 0.005) {
          bellSwingPhase += dt * 5.2;
          campus.bellPivot.rotation.x = Math.sin(bellSwingPhase) * 0.14 * bellImpulseRef.current;
          campus.strikerPivot.rotation.x =
            -Math.abs(Math.sin(bellSwingPhase * 0.5)) * 0.25 * bellImpulseRef.current;
          bellImpulseRef.current *= Math.exp(-0.85 * dt);
        } else {
          campus.bellPivot.rotation.x = THREE.MathUtils.damp(
            campus.bellPivot.rotation.x,
            0,
            6,
            dt
          );
          campus.strikerPivot.rotation.x = THREE.MathUtils.damp(
            campus.strikerPivot.rotation.x,
            0,
            6,
            dt
          );
        }

        // 4. Smooth Time-of-Day lighting & atmosphere damping
        const preset = LIGHTING_PRESETS[timeOfDayRef.current];
        _targetSky.set(preset.sky);
        (scene.background as THREE.Color).lerp(_targetSky, 1 - Math.exp(-3.5 * dt));
        fog.color.copy(scene.background as THREE.Color);
        fog.density = THREE.MathUtils.damp(fog.density, preset.fogDensity, 3.5, dt);

        _targetSun.set(preset.sunColor);
        sunLight.color.lerp(_targetSun, 1 - Math.exp(-3.5 * dt));
        sunLight.intensity = THREE.MathUtils.damp(sunLight.intensity, preset.sunIntensity, 3.5, dt);
        sunLight.position.x = THREE.MathUtils.damp(sunLight.position.x, preset.sunPos[0], 3.5, dt);
        sunLight.position.y = THREE.MathUtils.damp(sunLight.position.y, preset.sunPos[1], 3.5, dt);
        sunLight.position.z = THREE.MathUtils.damp(sunLight.position.z, preset.sunPos[2], 3.5, dt);

        _targetHemiSky.set(preset.hemiSky);
        _targetHemiGround.set(preset.hemiGround);
        hemiLight.color.lerp(_targetHemiSky, 1 - Math.exp(-3.5 * dt));
        hemiLight.groundColor.lerp(_targetHemiGround, 1 - Math.exp(-3.5 * dt));
        hemiLight.intensity = THREE.MathUtils.damp(
          hemiLight.intensity,
          preset.hemiIntensity,
          3.5,
          dt
        );
        renderer.toneMappingExposure = THREE.MathUtils.damp(
          renderer.toneMappingExposure,
          preset.exposure,
          3.5,
          dt
        );

        campus.nightLights.forEach((pt) => {
          pt.intensity = THREE.MathUtils.damp(pt.intensity, preset.nightGlow, 4, dt);
        });
        campus.lanternEmissives.forEach((mat) => {
          mat.emissiveIntensity = THREE.MathUtils.damp(
            mat.emissiveIntensity,
            0.35 + preset.nightGlow * 0.75,
            4,
            dt
          );
        });

        // 5. Player Movement (Keyboard + Touch Joystick + Click-to-Walk)
        let inputForward = 0;
        let inputRight = 0;
        if (keys['KeyW'] || keys['ArrowUp']) inputForward += 1;
        if (keys['KeyS'] || keys['ArrowDown']) inputForward -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) inputRight += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) inputRight -= 1;

        inputRight += joystickRef.current.x;
        inputForward += joystickRef.current.y;

        const hasManualInput = Math.abs(inputForward) > 0.05 || Math.abs(inputRight) > 0.05;
        if (hasManualInput) {
          player.walkTarget = null;
          destRing.visible = false;
        }

        const isRunning = Boolean(keys['ShiftLeft'] || keys['ShiftRight']);
        const maxSpeed = isRunning ? 10.5 : 5.8;

        _moveDir.set(0, 0, 0);
        if (hasManualInput) {
          // Camera-relative movement direction
          const forwardX = -Math.sin(camOrbit.yaw);
          const forwardZ = -Math.cos(camOrbit.yaw);
          const rightX = Math.cos(camOrbit.yaw);
          const rightZ = -Math.sin(camOrbit.yaw);

          _moveDir.x = forwardX * inputForward + rightX * inputRight;
          _moveDir.z = forwardZ * inputForward + rightZ * inputRight;
          if (_moveDir.lengthSq() > 0.001) _moveDir.normalize();
        } else if (player.walkTarget) {
          const dx = player.walkTarget.x - player.x;
          const dz = player.walkTarget.z - player.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.55) {
            player.walkTarget = null;
            destRing.visible = false;
          } else {
            _moveDir.set(dx / dist, 0, dz / dist);
          }
        }

        const targetSpeed = _moveDir.lengthSq() > 0.01 ? maxSpeed : 0;
        player.speed = THREE.MathUtils.damp(player.speed, targetSpeed, 10, dt);

        if (player.speed > 0.1 && _moveDir.lengthSq() > 0.01) {
          player.x += _moveDir.x * player.speed * dt;
          player.z += _moveDir.z * player.speed * dt;

          const targetYaw = Math.atan2(_moveDir.x, _moveDir.z);
          let diff = targetYaw - player.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          player.yaw += diff * (1 - Math.exp(-12 * dt));
        }

        // Building collider push-out
        const radius = 0.55;
        for (let i = 0; i < campus.colliders.length; i++) {
          const c = campus.colliders[i];
          const closestX = THREE.MathUtils.clamp(player.x, c.minX, c.maxX);
          const closestZ = THREE.MathUtils.clamp(player.z, c.minZ, c.maxZ);
          const dx = player.x - closestX;
          const dz = player.z - closestZ;
          const distSq = dx * dx + dz * dz;
          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq) || 0.001;
            const overlap = radius - dist;
            player.x += (dx / dist) * overlap;
            player.z += (dz / dist) * overlap;
          }
        }

        // Walkable campus bounds (keep out of deep lake & steep cliff back)
        player.x = THREE.MathUtils.clamp(player.x, -112, 114);
        player.z = THREE.MathUtils.clamp(player.z, -92, 65.5);

        // Jump & Grounding
        const groundY = getGroundHeight(player.x, player.z);
        if (jumpTriggerRef.current && player.isGrounded) {
          player.vy = 6.2;
          player.isGrounded = false;
        }
        jumpTriggerRef.current = false;

        player.vy -= 18 * dt;
        player.y += player.vy * dt;
        if (player.y <= groundY) {
          player.y = groundY;
          player.vy = 0;
          player.isGrounded = true;
        }

        avatar.root.position.set(player.x, player.y, player.z);
        avatar.root.rotation.y = player.yaw;
        avatar.bodyGroup.visible = cameraModeRef.current !== 'first-person';
        avatar.updateAnimation(dt, player.speed, player.isGrounded);

        // 6. Interactive Soccer Ball Physics on the Field
        const distToBall = Math.hypot(player.x - ballState.x, player.z - ballState.z);
        if (distToBall < 0.85 && player.isGrounded) {
          const nx = (ballState.x - player.x) / (distToBall || 0.1);
          const nz = (ballState.z - player.z) / (distToBall || 0.1);
          const kickPower = Math.max(4.5, player.speed * 1.45);
          ballState.vx = nx * kickPower;
          ballState.vz = nz * kickPower;
          soundscape.playSoftKick();
        }

        ballState.x += ballState.vx * dt;
        ballState.z += ballState.vz * dt;
        const ballSpeed = Math.hypot(ballState.vx, ballState.vz);
        if (ballSpeed > 0.05) {
          ballState.vx *= Math.exp(-1.4 * dt);
          ballState.vz *= Math.exp(-1.4 * dt);
          soccer.mesh.rotation.z -= (ballState.vx * dt) / 0.24;
          soccer.mesh.rotation.x += (ballState.vz * dt) / 0.24;
        } else {
          ballState.vx = 0;
          ballState.vz = 0;
        }

        // Keep ball inside pitch bounds & check Goal scoring!
        if (ballState.goalCooldown > 0) {
          ballState.goalCooldown -= dt;
        } else if (Math.abs(ballState.x) > 42.3 && Math.abs(ballState.z) < 3.6) {
          ballState.goalCount += 1;
          ballState.goalCooldown = 2.5;
          soundscape.playWindChime(0.22);
          onGoalRef.current(ballState.goalCount);
          ballState.x = 0;
          ballState.z = 0;
          ballState.vx = 0;
          ballState.vz = 0;
        }

        if (ballState.x > 44.5 || ballState.x < -44.5) {
          ballState.x = THREE.MathUtils.clamp(ballState.x, -44.5, 44.5);
          ballState.vx *= -0.7;
        }
        if (ballState.z > 26.5 || ballState.z < -26.5) {
          ballState.z = THREE.MathUtils.clamp(ballState.z, -26.5, 26.5);
          ballState.vz *= -0.7;
        }
        soccer.mesh.position.set(ballState.x, 0.28, ballState.z);
        soccer.shadow.position.set(ballState.x, 0.055, ballState.z);

        // 7. Smooth Camera Choreography (3rd-Person / 1st-Person / Drone Aerial)
        const mode = cameraModeRef.current;
        if (mode === 'first-person') {
          _camGoalPos.set(player.x, player.y + 1.68, player.z);
          _camGoalLook.set(
            player.x - Math.sin(camOrbit.yaw) * 10,
            player.y + 1.68 - Math.sin(camOrbit.pitch) * 6,
            player.z - Math.cos(camOrbit.yaw) * 10
          );
        } else if (mode === 'drone') {
          const droneDist = Math.max(36, camOrbit.distance * 3.2);
          const dronePitch = Math.max(0.52, camOrbit.pitch + 0.32);
          _camGoalPos.set(
            player.x + Math.sin(camOrbit.yaw) * Math.cos(dronePitch) * droneDist,
            player.y + Math.sin(dronePitch) * droneDist,
            player.z + Math.cos(camOrbit.yaw) * Math.cos(dronePitch) * droneDist
          );
          _camGoalLook.set(player.x, player.y + 1.5, player.z);
        } else {
          const dist = Math.min(28, camOrbit.distance);
          _camGoalPos.set(
            player.x + Math.sin(camOrbit.yaw) * Math.cos(camOrbit.pitch) * dist,
            Math.max(
              getGroundHeight(
                player.x + Math.sin(camOrbit.yaw) * dist,
                player.z + Math.cos(camOrbit.yaw) * dist
              ) + 1.1,
              player.y + 1.6 + Math.sin(camOrbit.pitch) * dist
            ),
            player.z + Math.cos(camOrbit.yaw) * Math.cos(camOrbit.pitch) * dist
          );
          _camGoalLook.set(player.x, player.y + 1.45, player.z);
        }

        const camDamp = 1 - Math.exp(-8.5 * dt);
        camera.position.lerp(_camGoalPos, camDamp);
        camera.lookAt(_camGoalLook);

        // Pulse mindful rings subtly via gentle rotation
        mindfulMarkers.children.forEach((m, idx) => {
          m.rotation.y = elapsed * (idx % 2 === 0 ? 0.2 : -0.2);
        });

        // 8. Throttled HUD Telemetry Sync
        hudThrottle += dt;
        if (hudThrottle > 0.12) {
          hudThrottle = 0;
          let nearby: MindfulPoint | null = null;
          for (const pt of MINDFUL_POINTS) {
            if (Math.hypot(player.x - pt.position[0], player.z - pt.position[2]) <= pt.radius) {
              nearby = pt;
              break;
            }
          }
          onHudRef.current({
            playerX: player.x,
            playerY: player.y,
            playerZ: player.z,
            playerYaw: player.yaw,
            speed: player.speed,
            nearbyPoint: nearby,
            goalCount: ballState.goalCount,
            zoneName: detectZoneName(player.x, player.z),
          });
        }

        renderer.render(scene, camera);

        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      };

      tick();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        dom.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        dom.removeEventListener('wheel', onWheel);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('webglcontextlost', onLost);
        renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry?.dispose();
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat.dispose());
            } else {
              m.material?.dispose();
            }
          }
        });
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="relative w-full h-full">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        {contextLost && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/90 text-stone-100 p-6 text-center z-50">
            <img
              src="/assets/aistudio/DSC_9145_fa24a30c.JPG"
              alt="국민건강보험공단 인재개발원 전경"
              className="w-full max-w-md rounded-xl mb-4 object-cover border border-stone-700"
            />
            <p className="font-serif-kr text-lg font-medium mb-1">
              3D 그래픽 컨텍스트를 복구하는 중입니다
            </p>
            <p className="text-sm text-stone-400">
              잠시 후 자동으로 화면이 다시 연결됩니다.
            </p>
          </div>
        )}
      </div>
    );
  }
);
