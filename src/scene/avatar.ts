import * as THREE from 'three';
import { createContactShadowTexture } from './textures';

export interface AvatarRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  shadowPlane: THREE.Mesh;
  updateAnimation: (dt: number, speed: number, isGrounded: boolean) => void;
}

/**
 * Creates a calm, multi-part articulated traveler/trainee avatar inspired by Sansa temple attire
 * (modern warm stone-gray linen robe/coat, subtle indigo scarf, grounded bottom-center pivot).
 */
export function createAvatarRig(): AvatarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const skinMat = new THREE.MeshStandardMaterial({
    color: '#ecc7a8',
    roughness: 0.72,
    metalness: 0.02,
  });
  const robeMat = new THREE.MeshStandardMaterial({
    color: '#6b7280', // serene stone-slate linen
    roughness: 0.85,
    metalness: 0.04,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: '#e5e7eb',
    roughness: 0.82,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: '#2c5e63', // calm Cheongpung teal accent
    roughness: 0.78,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: '#27272a',
    roughness: 0.8,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: '#3f3f46',
    roughness: 0.85,
  });

  // Torso (modern relaxed coat/robe silhouette)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.27, 0.72, 12), robeMat);
  torso.position.y = 1.02;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.045, 8, 16), scarfMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.38;
  bodyGroup.add(collar);

  const undershirt = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.25, 10), innerMat);
  undershirt.position.y = 1.28;
  bodyGroup.add(undershirt);

  // Head + hair cap
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), skinMat);
  head.position.y = 1.58;
  head.castShadow = true;
  bodyGroup.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.178, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hair.position.y = 1.6;
  hair.rotation.x = -0.15;
  bodyGroup.add(hair);

  // Articulated Arms
  const makeArm = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.27, 1.34, 0);

    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.48, 10), robeMat);
    sleeve.position.y = -0.24;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), skinMat);
    hand.position.y = -0.51;
    pivot.add(hand);

    bodyGroup.add(pivot);
    return pivot;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  // Articulated Legs
  const makeLeg = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.11, 0.68, 0);

    const pant = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.072, 0.58, 10), robeMat);
    pant.position.y = -0.29;
    pant.castShadow = true;
    pivot.add(pant);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.22), shoeMat);
    shoe.position.set(0, -0.62, 0.04);
    shoe.castShadow = true;
    pivot.add(shoe);

    bodyGroup.add(pivot);
    return pivot;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  // Soft contact shadow directly under avatar feet
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.03;
  root.add(shadowPlane);

  let walkPhase = 0;

  const updateAnimation = (dt: number, speed: number, isGrounded: boolean) => {
    const isMoving = speed > 0.25;
    if (isMoving && isGrounded) {
      walkPhase += dt * (4.2 + speed * 0.72);
      const swing = Math.min(0.7, speed * 0.09);
      leftLeg.rotation.x = Math.sin(walkPhase) * swing;
      rightLeg.rotation.x = -Math.sin(walkPhase) * swing;
      leftArm.rotation.x = -Math.sin(walkPhase) * swing * 0.78;
      rightArm.rotation.x = Math.sin(walkPhase) * swing * 0.78;
      bodyGroup.position.y = Math.abs(Math.cos(walkPhase)) * 0.045;
    } else {
      // Gentle idle breathing & return to neutral stance
      walkPhase += dt * 1.8;
      const damp = 1 - Math.exp(-10 * dt);
      leftLeg.rotation.x *= 1 - damp;
      rightLeg.rotation.x *= 1 - damp;
      leftArm.rotation.x *= 1 - damp;
      rightArm.rotation.x *= 1 - damp;
      bodyGroup.position.y = Math.sin(walkPhase) * 0.012;
    }
  };

  return {
    root,
    bodyGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    shadowPlane,
    updateAnimation,
  };
}
