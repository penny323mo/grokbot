/**
 * 12碼讀心戰 (Penalty Mind Game v2) - 3D Procedural Goalkeeper
 * Hierarchical articulated character model with anim state machine:
 * idle, set, dive_TL, dive_BL, dive_TR, dive_BR, jump_TM, stay_BM, celebrate, concede.
 */

import * as THREE from 'three';
import { TUNING } from './tuning.js';
import { DIVE_TARGETS } from './keeperAI.js';

export class Goalkeeper3D {
  constructor(scene) {
    this.scene = scene;
    this.root = null;

    // Joints & body parts
    this.bodyGroup = null;
    this.torso = null;
    this.head = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftGlove = null;
    this.rightGlove = null;
    this.leftLeg = null;
    this.rightLeg = null;

    // State machine
    this.state = 'idle'; // 'idle' | 'set' | 'diving' | 'celebrate' | 'concede'
    this.stateTime = 0;
    this.divePlan = null;
    this.diveProgress = 0;

    this.basePos = new THREE.Vector3(0, 0, 0.05);

    this.init();
  }

  init() {
    this.root = new THREE.Group();
    this.root.position.copy(this.basePos);

    // Materials
    // Vibrant goalkeeper kit (Electric Cyan jersey & shorts with Neon Yellow gloves)
    const jerseyMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.6 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.5 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Neon yellow
    const bootMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.9 });

    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0, 0);

    // 1. Torso (0.55m wide, 0.60m tall, 0.28m deep)
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.60, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, jerseyMat);
    this.torso.position.set(0, 1.15, 0);
    this.bodyGroup.add(this.torso);

    // Number '1' on back and chest (decal block)
    const numGeo = new THREE.BoxGeometry(0.08, 0.32, 0.29);
    const numMesh = new THREE.Mesh(numGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    numMesh.position.set(0, 1.15, 0);
    this.bodyGroup.add(numMesh);

    // 2. Head & Neck
    const headGeo = new THREE.SphereGeometry(0.14, 16, 16);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 1.62, 0);
    this.bodyGroup.add(this.head);

    // Hair cap
    const hairGeo = new THREE.SphereGeometry(0.145, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.64, 0);
    this.bodyGroup.add(hair);

    // 3. Arms & Gloves (Joint hierarchy)
    // Left Arm Pivot
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.35, 1.38, 0);
    const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.55, 12);
    const lArmMesh = new THREE.Mesh(armGeo, jerseyMat);
    lArmMesh.position.set(0, -0.25, 0);
    this.leftArm.add(lArmMesh);

    const gloveGeo = new THREE.BoxGeometry(0.16, 0.18, 0.12);
    this.leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
    this.leftGlove.position.set(0, -0.58, 0);
    this.leftArm.add(this.leftGlove);
    this.bodyGroup.add(this.leftArm);

    // Right Arm Pivot
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.35, 1.38, 0);
    const rArmMesh = new THREE.Mesh(armGeo, jerseyMat);
    rArmMesh.position.set(0, -0.25, 0);
    this.rightArm.add(rArmMesh);

    this.rightGlove = new THREE.Mesh(gloveGeo, gloveMat);
    this.rightGlove.position.set(0, -0.58, 0);
    this.rightArm.add(this.rightGlove);
    this.bodyGroup.add(this.rightArm);

    // 4. Shorts (Hips)
    const shortsGeo = new THREE.BoxGeometry(0.52, 0.26, 0.27);
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.set(0, 0.78, 0);
    this.bodyGroup.add(shorts);

    // 5. Legs & Boots
    const legGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.65, 12);
    const bootGeo = new THREE.BoxGeometry(0.12, 0.10, 0.22);

    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.68, 0);
    const lLegMesh = new THREE.Mesh(legGeo, skinMat);
    lLegMesh.position.set(0, -0.32, 0);
    this.leftLeg.add(lLegMesh);

    const lBoot = new THREE.Mesh(bootGeo, bootMat);
    lBoot.position.set(0, -0.66, 0.04);
    this.leftLeg.add(lBoot);
    this.bodyGroup.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.68, 0);
    const rLegMesh = new THREE.Mesh(legGeo, skinMat);
    rLegMesh.position.set(0, -0.32, 0);
    this.rightLeg.add(rLegMesh);

    const rBoot = new THREE.Mesh(bootGeo, bootMat);
    rBoot.position.set(0, -0.66, 0.04);
    this.rightLeg.add(rBoot);
    this.bodyGroup.add(this.rightLeg);

    this.root.add(this.bodyGroup);
    this.scene.add(this.root);
  }

  reset() {
    this.state = 'idle';
    this.stateTime = 0;
    this.divePlan = null;
    this.diveProgress = 0;

    this.root.position.copy(this.basePos);
    this.root.rotation.set(0, 0, 0);
    this.bodyGroup.position.set(0, 0, 0);
    this.bodyGroup.rotation.set(0, 0, 0);
    if (this.torso) this.torso.rotation.set(0, 0, 0);
    if (this.head) this.head.rotation.set(0, 0, 0);

    // Reset joint rotations
    if (this.leftArm) this.leftArm.rotation.set(0, 0, 0.4);
    if (this.rightArm) this.rightArm.rotation.set(0, 0, -0.4);
    if (this.leftLeg) this.leftLeg.rotation.set(0, 0, 0);
    if (this.rightLeg) this.rightLeg.rotation.set(0, 0, 0);
  }

  setReady() {
    this.reset();
    this.state = 'set';
    this.stateTime = 0;
  }

  startDive(divePlan) {
    this.state = 'diving';
    this.stateTime = 0;
    this.divePlan = divePlan;
    this.diveProgress = 0;
  }

  celebrate() {
    this.state = 'celebrate';
    this.stateTime = 0;
  }

  concede() {
    this.state = 'concede';
    this.stateTime = 0;
  }

  getKeeperReachPosition() {
    // Return world position of keeper reach center for blob shadow & debug
    return {
      x: this.root.position.x,
      y: this.root.position.y + 0.95,
      z: this.root.position.z
    };
  }

  update(timeSec, deltaSec) {
    this.stateTime += deltaSec;

    if (this.state === 'idle') {
      // Gentle bouncing weight shift
      const bounce = Math.abs(Math.sin(timeSec * 5.0)) * 0.05;
      this.bodyGroup.position.y = bounce;

      // Arms ready pose
      this.leftArm.rotation.z = 0.45 + Math.sin(timeSec * 5.0) * 0.08;
      this.rightArm.rotation.z = -0.45 - Math.sin(timeSec * 5.0) * 0.08;
      this.leftArm.rotation.x = 0.25;
      this.rightArm.rotation.x = 0.25;

      this.leftLeg.rotation.z = -0.08;
      this.rightLeg.rotation.z = 0.08;
    } else if (this.state === 'set') {
      // Crouched alert set stance
      this.bodyGroup.position.y = -0.12;
      this.torso.rotation.x = 0.25;
      this.head.rotation.x = -0.15;

      this.leftArm.rotation.z = 0.70;
      this.rightArm.rotation.z = -0.70;
      this.leftArm.rotation.x = 0.40;
      this.rightArm.rotation.x = 0.40;

      this.leftLeg.rotation.x = -0.25;
      this.rightLeg.rotation.x = -0.25;
      this.leftLeg.rotation.z = -0.18;
      this.rightLeg.rotation.z = 0.18;
    } else if (this.state === 'diving' && this.divePlan) {
      // Delay before reacting
      if (this.stateTime < this.divePlan.reactTime) {
        // Staying in crouched set posture
        return;
      }

      const elapsed = this.stateTime - this.divePlan.reactTime;
      const t = Math.min(1.0, elapsed / this.divePlan.diveDuration);
      this.diveProgress = t;

      // Quadratic ease out
      const ease = 1 - (1 - t) * (1 - t);

      const targetX = this.divePlan.target.x;
      const targetY = this.divePlan.target.y;
      const isLeft = targetX < -0.5;
      const isRight = targetX > 0.5;
      const isHigh = targetY > 1.35;

      // Move root towards dive target
      this.root.position.x = this.basePos.x + ease * targetX;

      if (isHigh) {
        this.root.position.y = this.basePos.y + ease * Math.max(0, targetY - 1.1);
      } else {
        this.root.position.y = this.basePos.y + Math.sin(t * Math.PI) * 0.35;
      }

      // Rotate body in dive direction
      if (isLeft) {
        this.bodyGroup.rotation.z = ease * (isHigh ? 1.25 : 1.45);
        this.leftArm.rotation.z = 2.6;  // Fully extended upper reach
        this.rightArm.rotation.z = 2.2;
        this.leftLeg.rotation.z = 0.4;
        this.rightLeg.rotation.z = 0.8;
      } else if (isRight) {
        this.bodyGroup.rotation.z = -ease * (isHigh ? 1.25 : 1.45);
        this.rightArm.rotation.z = -2.6; // Fully extended upper reach
        this.leftArm.rotation.z = -2.2;
        this.leftLeg.rotation.z = -0.8;
        this.rightLeg.rotation.z = -0.4;
      } else {
        // Center: jump up or stay low
        if (isHigh) {
          this.root.position.y = this.basePos.y + ease * 0.85;
          this.leftArm.rotation.z = 2.8;
          this.rightArm.rotation.z = -2.8;
        } else {
          // Low scoop / stay
          this.bodyGroup.position.y = -0.35 * ease;
          this.leftArm.rotation.z = 0.2;
          this.rightArm.rotation.z = -0.2;
          this.leftArm.rotation.x = 0.8;
          this.rightArm.rotation.x = 0.8;
        }
      }
    } else if (this.state === 'celebrate') {
      // Fist pump on save
      this.rightArm.rotation.z = -2.8;
      this.rightArm.rotation.x = 0.2;
      this.leftArm.rotation.z = 0.5;
      this.bodyGroup.position.y = Math.sin(timeSec * 8.0) * 0.12;
    } else if (this.state === 'concede') {
      // Disappointed hands on knees / head turn
      this.torso.rotation.x = 0.45;
      this.head.rotation.y = Math.sin(timeSec * 2.0) * 0.4;
      this.leftArm.rotation.z = 0.15;
      this.rightArm.rotation.z = -0.15;
      this.bodyGroup.position.y = -0.18;
    }
  }
}
