/**
 * 12碼讀心戰 (Penalty Mind Game v2) - 3D Procedural Penalty Taker (Striker)
 * Articulated humanoid striker with run-up, plant foot, strike swing,
 * follow-through, celebration, and disappointment animations.
 */

import * as THREE from 'three';
import { TUNING } from './tuning.js';

export class Taker3D {
  constructor(scene) {
    this.scene = scene;
    this.root = null;

    // Body parts & pivots
    this.bodyGroup = null;
    this.torso = null;
    this.head = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftLeg = null;
    this.rightLeg = null;

    // Animation state
    this.state = 'hidden'; // 'hidden' | 'ready' | 'run_up' | 'strike' | 'follow_through' | 'celebrate' | 'concede'
    this.stateTime = 0;
    this.onStrikeCallback = null;
    this.hasStruck = false;

    // Positions:
    // Ball is at (0, r, 11.0). Taker starts run-up ~3.2m behind ball, angled for clear goal view
    this.startPos = new THREE.Vector3(-0.65, 0, 14.2);
    this.strikePos = new THREE.Vector3(-0.25, 0, 11.18);

    this.init();
  }

  init() {
    this.root = new THREE.Group();
    this.root.position.copy(this.startPos);
    this.root.visible = false;

    // Materials
    // Crimson red away jersey (#dc2626) with white shorts (#f8fafc) and black/yellow boots
    this.jerseyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
    this.shortsMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.5 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x271c19, roughness: 0.9 });
    this.sockMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });

    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0, 0);

    // 1. Torso (0.52m wide, 0.58m tall, 0.26m deep)
    const torsoGeo = new THREE.BoxGeometry(0.52, 0.58, 0.26);
    this.torso = new THREE.Mesh(torsoGeo, this.jerseyMat);
    this.torso.position.set(0, 1.15, 0);
    this.bodyGroup.add(this.torso);

    // Number '10' on back of jersey
    const numGeo = new THREE.BoxGeometry(0.12, 0.28, 0.27);
    const numMesh = new THREE.Mesh(numGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    numMesh.position.set(0, 1.18, 0);
    this.bodyGroup.add(numMesh);

    // 2. Head & Neck
    const headGeo = new THREE.SphereGeometry(0.135, 16, 16);
    this.head = new THREE.Mesh(headGeo, this.skinMat);
    this.head.position.set(0, 1.60, 0);
    this.bodyGroup.add(this.head);

    // Hair cap
    const hairGeo = new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.62, 0);
    this.bodyGroup.add(hair);

    // 3. Arms
    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.56, 12);
    const handGeo = new THREE.BoxGeometry(0.10, 0.12, 0.09);

    // Left Arm Pivot
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.33, 1.36, 0);
    const lArmMesh = new THREE.Mesh(armGeo, this.jerseyMat);
    lArmMesh.position.set(0, -0.25, 0);
    this.leftArm.add(lArmMesh);
    const lHand = new THREE.Mesh(handGeo, this.skinMat);
    lHand.position.set(0, -0.56, 0);
    this.leftArm.add(lHand);
    this.bodyGroup.add(this.leftArm);

    // Right Arm Pivot
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.33, 1.36, 0);
    const rArmMesh = new THREE.Mesh(armGeo, this.jerseyMat);
    rArmMesh.position.set(0, -0.25, 0);
    this.rightArm.add(rArmMesh);
    const rHand = new THREE.Mesh(handGeo, this.skinMat);
    rHand.position.set(0, -0.56, 0);
    this.rightArm.add(rHand);
    this.bodyGroup.add(this.rightArm);

    // 4. Shorts (Hips)
    const shortsGeo = new THREE.BoxGeometry(0.50, 0.25, 0.25);
    const shorts = new THREE.Mesh(shortsGeo, this.shortsMat);
    shorts.position.set(0, 0.78, 0);
    this.bodyGroup.add(shorts);

    // 5. Legs & Boots
    const legGeo = new THREE.CylinderGeometry(0.07, 0.058, 0.65, 12);
    const bootGeo = new THREE.BoxGeometry(0.11, 0.10, 0.22);

    // Left Leg (Plant leg for right-footed striker)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.68, 0);
    const lLegMesh = new THREE.Mesh(legGeo, this.sockMat);
    lLegMesh.position.set(0, -0.32, 0);
    this.leftLeg.add(lLegMesh);
    const lBoot = new THREE.Mesh(bootGeo, bootMat);
    lBoot.position.set(0, -0.66, 0.04);
    this.leftLeg.add(lBoot);
    this.bodyGroup.add(this.leftLeg);

    // Right Leg (Striking leg)
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.68, 0);
    const rLegMesh = new THREE.Mesh(legGeo, this.sockMat);
    rLegMesh.position.set(0, -0.32, 0);
    this.rightLeg.add(rLegMesh);
    const rBoot = new THREE.Mesh(bootGeo, bootMat);
    rBoot.position.set(0, -0.66, 0.04);
    this.rightLeg.add(rBoot);
    this.bodyGroup.add(this.rightLeg);

    this.root.add(this.bodyGroup);
    // Face forward towards the goal (negative Z)
    this.root.rotation.y = Math.PI;
    this.scene.add(this.root);
  }

  showReady() {
    this.root.visible = true;
    this.state = 'ready';
    this.stateTime = 0;
    this.hasStruck = false;
    this.onStrikeCallback = null;

    this.root.position.copy(this.startPos);
    this.root.rotation.set(0, Math.PI, 0);
    this.bodyGroup.position.set(0, 0, 0);
    this.bodyGroup.rotation.set(0, 0, 0);

    if (this.leftArm) this.leftArm.rotation.set(0.15, 0, 0.2);
    if (this.rightArm) this.rightArm.rotation.set(0.15, 0, -0.2);
    if (this.leftLeg) this.leftLeg.rotation.set(0, 0, 0);
    if (this.rightLeg) this.rightLeg.rotation.set(0, 0, 0);
    if (this.torso) this.torso.rotation.set(0.1, 0, 0);
  }

  setKitColors(colors) {
    if (!colors) return;
    if (this.jerseyMat && colors.primary) {
      this.jerseyMat.color.set(colors.primary);
    }
    if (this.shortsMat && colors.shorts) {
      this.shortsMat.color.set(colors.shorts);
    }
    if (this.sockMat && (colors.socks || colors.secondary)) {
      this.sockMat.color.set(colors.socks || colors.secondary);
    }
  }

  startRunUp(onStrike) {
    this.root.visible = true;
    this.state = 'run_up';
    this.stateTime = 0;
    this.hasStruck = false;
    this.onStrikeCallback = onStrike;
  }

  celebrate() {
    this.state = 'celebrate';
    this.stateTime = 0;
  }

  concede() {
    this.state = 'concede';
    this.stateTime = 0;
  }

  hide() {
    this.root.visible = false;
    this.state = 'hidden';
  }

  reset() {
    this.hide();
    this.stateTime = 0;
    this.hasStruck = false;
    this.onStrikeCallback = null;
  }

  update(timeSec, deltaSec) {
    if (!this.root.visible || this.state === 'hidden') return;
    this.stateTime += deltaSec;

    const runDuration = (TUNING.taker && TUNING.taker.runUpDurationMs ? TUNING.taker.runUpDurationMs : 850) / 1000;

    if (this.state === 'ready') {
      // Idling ready stance: bouncing gently on toes, deep breaths
      const bounce = Math.abs(Math.sin(timeSec * 4.0)) * 0.04;
      this.bodyGroup.position.y = bounce;
      this.leftArm.rotation.x = 0.15 + Math.sin(timeSec * 4.0) * 0.08;
      this.rightArm.rotation.x = 0.15 - Math.sin(timeSec * 4.0) * 0.08;
    } else if (this.state === 'run_up') {
      const progress = Math.min(1.0, this.stateTime / runDuration);

      // Lerp root position from startPos to strikePos
      this.root.position.x = THREE.MathUtils.lerp(this.startPos.x, this.strikePos.x, progress);
      this.root.position.z = THREE.MathUtils.lerp(this.startPos.z, this.strikePos.z, progress);

      // Running cycle
      const cycleFreq = 14.0;
      const legAngle = Math.sin(this.stateTime * cycleFreq) * 0.75;
      const armAngle = -legAngle * 0.85;

      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = armAngle;
      this.rightArm.rotation.x = -armAngle;

      this.bodyGroup.position.y = Math.abs(Math.sin(this.stateTime * cycleFreq)) * 0.08;
      this.torso.rotation.x = 0.22; // Forward athletic lean

      // Reached ball: trigger strike
      if (progress >= 1.0 && !this.hasStruck) {
        this.state = 'strike';
        this.stateTime = 0;
        this.hasStruck = true;

        // Strike posture
        // Plant left foot, swing right leg forward
        this.leftLeg.rotation.x = 0.1;
        this.rightLeg.rotation.x = -1.1; // Backswing to forward snap
        this.rightArm.rotation.x = 0.8;
        this.leftArm.rotation.x = -0.5;
        this.torso.rotation.x = 0.35;

        if (this.onStrikeCallback) {
          this.onStrikeCallback();
        }
      }
    } else if (this.state === 'strike') {
      // Powerful forward kick snap
      const strikeProgress = Math.min(1.0, this.stateTime / 0.18);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(-1.1, 0.9, strikeProgress);
      this.torso.rotation.x = THREE.MathUtils.lerp(0.35, 0.15, strikeProgress);

      if (strikeProgress >= 1.0) {
        this.state = 'follow_through';
        this.stateTime = 0;
      }
    } else if (this.state === 'follow_through') {
      // Decelerate kick swing and land on two feet
      const ftProgress = Math.min(1.0, this.stateTime / 0.35);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(0.9, 0, ftProgress);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(0.1, 0, ftProgress);
      this.bodyGroup.position.y = THREE.MathUtils.lerp(0.06, 0, ftProgress);
    } else if (this.state === 'celebrate') {
      // Striker celebrates goal: double fist pump / jump
      this.bodyGroup.position.y = Math.abs(Math.sin(timeSec * 7.0)) * 0.22;
      this.leftArm.rotation.x = -2.7;
      this.rightArm.rotation.x = -2.7;
      this.torso.rotation.x = -0.15;
    } else if (this.state === 'concede') {
      // Striker misses / saved: hands on head
      this.torso.rotation.x = 0.35;
      this.head.rotation.x = -0.25;
      this.leftArm.rotation.x = -2.4;
      this.rightArm.rotation.x = -2.4;
      this.leftArm.rotation.z = -0.5;
      this.rightArm.rotation.z = 0.5;
      this.bodyGroup.position.y = -0.05;
    }
  }
}
