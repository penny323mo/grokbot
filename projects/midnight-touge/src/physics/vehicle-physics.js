// Vehicle Physics & Drift Dynamics Engine for Midnight Touge (《夜峠》)
// Arcade-sim hybrid with weight transfer, slip angle, counter-steer assist & gutter drop

export class VehiclePhysics {
  constructor(carData = {}) {
    this.carData = carData;
    this.reset();
  }

  reset(x = 0, y = 0, z = 0, heading = 0) {
    // Position & Orientation
    this.x = x;
    this.y = y;
    this.z = z;
    this.heading = heading; // radians, 0 = forward along +Y

    // Velocity & Dynamics
    this.vx = 0.0;
    this.vy = 0.0;
    this.vz = 0.0;
    this.speed = 0.0;        // m/s
    this.speedKmh = 0.0;     // km/h
    this.yawRate = 0.0;      // rad/s

    // Chassis Dynamics (Body Roll & Pitch)
    this.pitch = 0.0;        // Weight transfer front/rear dive
    this.roll = 0.0;         // Lateral lean in corners
    this.steerAngle = 0.0;   // Front wheel visual steer

    // Drift & Slip Angle
    this.slipAngle = 0.0;    // Angle between car forward and velocity vector (rad)
    this.driftAngleDeg = 0.0;// |slipAngle| in degrees
    this.isDrifting = false;
    this.driftLatch = 0.0;
    this.driftScore = 0;
    this.currentDriftPoints = 0;
    this.driftMultiplier = 1.0;
    this.inGutter = false;

    // Powertrain & Transmission
    this.rpm = 1000.0;
    this.gear = 1;
    this.maxRpm = 8500.0;
    this.idleRpm = 1000.0;
    this.gearRatios = [0, 3.45, 2.05, 1.38, 1.00, 0.82]; // 1st to 5th
    this.finalDrive = 4.10;

    // Car physical constants
    const carData = this.carData || {};
    const tuning = carData.tuning || {};
    this.mass = carData.weight || 980; // kg
    this.power = (carData.horsepower || 150) * 745.7 * (tuning.powerMultiplier || 1.0); // Watts
    this.turnRate = tuning.turnRate || 3.0;
    this.counterAssist = tuning.counterSteerStrength || 1.3;
    this.driftFriction = tuning.driftFriction || 0.86;
  }

  update(dt, input, weather = "midnight") {
    // Clamp delta time to avoid physics explosion
    dt = Math.min(dt, 0.05);

    const steerInput = input.steer || 0.0;       // -1.0 (left) to 1.0 (right)
    const throttleInput = input.throttle || 0.0; // 0.0 to 1.0
    const brakeInput = input.brake || 0.0;       // 0.0 to 1.0
    const handbrake = input.handbrake || false;  // boolean

    // Weather grip modifiers
    let gripModifier = 1.0;
    if (weather === "rainy_night") gripModifier = 0.72; // Wet slippery tarmac
    else if (weather === "dawn_mist") gripModifier = 0.92; // Damp morning surface

    if (this.inGutter) {
      // Gutter Drop technique locks inside grip!
      gripModifier *= 1.45;
    }

    // 1. Current Velocity in Car Local Frame
    // Forward unit vector
    const fwX = Math.sin(this.heading);
    const fwY = Math.cos(this.heading);
    // Right unit vector
    const rtX = Math.cos(this.heading);
    const rtY = -Math.sin(this.heading);

    // Forward and Lateral Velocity components
    let vForward = this.vx * fwX + this.vy * fwY;
    let vLateral = this.vx * rtX + this.vy * rtY;

    // Preserve active drift slip if slipAngle was set or latched directly
    if (this.isDrifting && Math.abs(this.slipAngle) >= 0.20 && Math.abs(vLateral) < Math.abs(vForward) * 0.15) {
      const spd = Math.max(this.speed, Math.abs(vForward), 15.0);
      vForward = spd * Math.cos(this.slipAngle);
      vLateral = spd * Math.sin(this.slipAngle);
      this.vx = vForward * fwX + vLateral * rtX;
      this.vy = vForward * fwY + vLateral * rtY;
      this.driftLatch = Math.max(this.driftLatch || 0, 0.85);
    }

    // 2. Slip Angle Calculation (Angle between heading and velocity)
    if (Math.abs(vForward) > 1.5) {
      this.slipAngle = Math.atan2(vLateral, Math.abs(vForward));
    } else {
      this.slipAngle = 0.0;
    }
    this.driftAngleDeg = Math.abs(this.slipAngle) * (180.0 / Math.PI);

    // 3. Weight Transfer (Dive & Squat)
    const accelDemand = throttleInput * 5.0 - brakeInput * 10.0;
    this.pitch += (accelDemand * 0.015 - this.pitch) * 8.0 * dt;
    // Front normal load factor: > 1.0 under braking (front dive, rear unweighted)
    const frontWeightRatio = 1.0 - (this.pitch * 2.5);

    // 4. Steer Angle & Mobile Counter-Steer Assistance
    let targetSteer = steerInput * 0.58; // Max 33 degrees mechanical lock
    
    // Counter-steer assistance: when drifting, assist smoothly takes over front wheels to lock drift angle
    if (this.driftAngleDeg > 8.0 && Math.abs(vForward) > 3.0) {
      const slipRatio = Math.min(1.0, (this.driftAngleDeg - 8.0) / 18.0); // 0 at 8°, 1.0 at 26°
      const counterCorrection = Math.sign(this.slipAngle) * (0.35 + slipRatio * 0.45);
      targetSteer = steerInput * (1.0 - slipRatio * 0.75) + counterCorrection * this.counterAssist * slipRatio;
    }
    this.steerAngle += (targetSteer - this.steerAngle) * 12.0 * dt;

    // 5. Powertrain & Acceleration
    const maxSpeedMs = (this.carData.topSpeed || 200) / 3.6;
    let driveForce = 0.0;

    if (throttleInput > 0) {
      // Tractive power curve with strong low-end launch torque
      const speedRatio = Math.max(0.1, vForward / maxSpeedMs);
      driveForce = (this.power / Math.max(5.0, vForward)) * throttleInput * (1.15 - speedRatio * 0.35);
      if (vForward < 24.0) {
        driveForce = Math.max(driveForce, this.mass * 7.8 * throttleInput);
      }
      if (this.isDrifting || (this.driftLatch && this.driftLatch > 0) || handbrake) {
        driveForce *= 1.45; // Initial D power-out drift punch
      }
      driveForce = Math.min(driveForce, this.mass * 9.5); // Traction limit
    }

    // Rolling Resistance & Air Drag (reduced in drift to maintain momentum)
    const dragMultiplier = (this.isDrifting || handbrake) ? 0.45 : 1.0;
    const dragForce = (0.38 * (vForward * Math.abs(vForward)) + 160.0 * Math.sign(vForward)) * dragMultiplier;

    // Forward Acceleration without braking
    let forwardAccel = (driveForce - dragForce) / this.mass;

    // Braking Force: opposes vForward and clamps so it cannot cross through 0
    let brakeAccel = 0.0;
    if (brakeInput > 0) {
      const maxBrakeAccel = brakeInput * 14.0;
      if (vForward > 0) {
        brakeAccel = Math.min(maxBrakeAccel, Math.max(0.0, (vForward + forwardAccel * dt) / dt));
      } else if (vForward < 0) {
        brakeAccel = Math.max(-maxBrakeAccel, Math.min(0.0, (vForward + forwardAccel * dt) / dt));
      }
    }
    forwardAccel -= brakeAccel;

    // 6. Cornering & Yaw Dynamics
    // Latch drift on handbrake with steering above 12 km/h
    if (handbrake && (Math.abs(this.steerAngle) > 0.02 || Math.abs(steerInput) > 0.02) && this.speedKmh > 12.0) {
      this.driftLatch = 0.95;
      // Smoothly kick lateral slip into an authentic 18°-22° drift angle
      const steerDir = Math.sign(steerInput || this.steerAngle || 1);
      const targetLat = -steerDir * Math.max(3.5, Math.abs(vForward)) * 0.36;
      vLateral += (targetLat - vLateral) * Math.min(1.0, 9.0 * dt);
    }
    if (this.driftLatch > 0) {
      this.driftLatch -= dt;
    }

    // Feint or handbrake initiation breaks rear traction
    let rearGripLoss = 1.0;
    if (handbrake && this.driftAngleDeg < 28.0) {
      rearGripLoss = 0.22; // Rear breaks loose to initiate drift
    } else if (this.driftLatch > 0) {
      rearGripLoss = 0.12; // Sustains smooth drift angle across corner
    } else if (this.driftAngleDeg > 8.0) {
      rearGripLoss = this.driftFriction; // Recovers traction in slide to preserve forward speed
    } else if (brakeInput > 0.4 && Math.abs(this.steerAngle) > 0.18) {
      rearGripLoss = 0.48 / frontWeightRatio;
    } else if (throttleInput > 0.85 && this.gear <= 2 && Math.abs(this.steerAngle) > 0.25) {
      rearGripLoss = 0.55;
    }

    // Cornering Yaw Force & Handbrake Flick
    const baseYawTorque = this.steerAngle * (Math.abs(vForward) / 10.0) * this.turnRate;
    let handbrakeTorque = 0.0;
    // Handbrake only adds rotation torque while initiating (< 25°); stops once sliding
    if (handbrake && Math.abs(this.steerAngle) > 0.03 && this.driftAngleDeg < 25.0) {
      handbrakeTorque = Math.sign(this.steerAngle) * 4.2 * Math.min(1.0, Math.abs(vForward) / 8.0);
    }
    let oversteerTorque = 0.0;
    if (this.driftAngleDeg > 6.0 && this.driftAngleDeg <= 25.0) {
      oversteerTorque = -Math.sign(this.slipAngle) * (this.driftAngleDeg * 0.025);
    } else if (this.driftAngleDeg > 25.0) {
      // Progressive self-aligning torque caps drift angle at ~28° so nose stays pointed downhill
      const excess = (this.driftAngleDeg - 25.0);
      oversteerTorque = Math.sign(this.slipAngle) * (excess * 0.35);
    }

    const yawDamping = 4.2 * (0.35 + 0.65 * rearGripLoss);
    this.yawRate += (baseYawTorque + handbrakeTorque + oversteerTorque - this.yawRate * yawDamping) * dt;
    const maxYaw = this.driftAngleDeg > 20.0 ? 1.85 : 3.0;
    this.yawRate = Math.max(-maxYaw, Math.min(maxYaw, this.yawRate));
    this.heading += this.yawRate * dt;

    // 7. World Acceleration via Tire Traction
    const lateralTraction = 14.0 * gripModifier * rearGripLoss;
    const ax = forwardAccel * fwX + (-vLateral * lateralTraction) * rtX;
    const ay = forwardAccel * fwY + (-vLateral * lateralTraction) * rtY;
    // Rebuild world velocity from updated local vForward/vLateral when handbrake slip kick is active
    if (handbrake && this.driftLatch > 0) {
      const nextFwd = vForward + forwardAccel * dt;
      const nextLat = vLateral * Math.max(0.75, 1.0 - lateralTraction * 0.25 * dt);
      this.vx = nextFwd * fwX + nextLat * rtX;
      this.vy = nextFwd * fwY + nextLat * rtY;
      this.slipAngle = Math.atan2(nextLat, Math.max(1.5, Math.abs(nextFwd)));
      this.driftAngleDeg = Math.abs(this.slipAngle) * (180.0 / Math.PI);
    } else {
      this.vx += ax * dt;
      this.vy += ay * dt;
    }

    // Cap slip angle strictly to <= 32° so the car never spins beyond 32°
    const maxSlipRad = (32.0 * Math.PI) / 180.0;
    if (Math.abs(this.slipAngle) > maxSlipRad) {
      const curSpd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const clampedSlip = Math.sign(this.slipAngle) * maxSlipRad;
      const targetVelHeading = this.heading + clampedSlip;
      this.vx = Math.sin(targetVelHeading) * curSpd;
      this.vy = Math.cos(targetVelHeading) * curSpd;
      this.slipAngle = clampedSlip;
      this.driftAngleDeg = 32.0;
    }

    // Ensure brake clamp holds exact 0 when brought to a full stop
    const newForward = this.vx * fwX + this.vy * fwY;
    if (brakeInput > 0 && throttleInput <= 0 && ((vForward > 0 && newForward <= 0) || Math.abs(vForward) < 0.001)) {
      this.vx = 0.0;
      this.vy = 0.0;
      this.speed = 0.0;
      this.speedKmh = 0.0;
    } else {
      this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this.speedKmh = this.speed * 3.6;
    }

    // Update World Position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 8. Body Roll (Leans away from turn center, strictly clamped <= 4.5° / 0.078 rad)
    const lateralG = (vForward * this.yawRate) / 9.81;
    const targetRoll = Math.max(-0.078, Math.min(0.078, -lateralG * 0.015));
    this.roll += (targetRoll - this.roll) * 10.0 * dt;

    // 9. Engine RPM & Automatic Gear Selection
    this.updateGears(vForward, throttleInput, dt);

    // 10. Drift Scoring
    this.updateDriftScoring(dt);
  }

  updateGears(vForward, throttle, dt) {
    const kmh = Math.abs(vForward * 3.6);
    // Automatic 5-speed transmission
    if (kmh < 45) this.gear = 1;
    else if (kmh < 85) this.gear = 2;
    else if (kmh < 130) this.gear = 3;
    else if (kmh < 175) this.gear = 4;
    else this.gear = 5;

    // Calculate realistic engine RPM
    const ratio = this.gearRatios[this.gear] || 1.0;
    const wheelRpm = (Math.abs(vForward) / (2.0 * Math.PI * 0.32)) * 60.0;
    const targetRpm = Math.max(this.idleRpm, wheelRpm * ratio * this.finalDrive);

    // Rev limiter bounce
    if (targetRpm > this.maxRpm) {
      this.rpm = this.maxRpm - (Math.random() * 250);
    } else {
      this.rpm += (targetRpm - this.rpm) * 14.0 * dt;
    }
  }

  updateDriftScoring(dt) {
    if (this.driftAngleDeg >= 8.0 && this.speedKmh >= 12.0) {
      this.isDrifting = true;
      // Formula: speed (km/h) * sin(drift angle) * angle bonus * multiplier combo
      const angleMultiplier = Math.min(2.5, this.driftAngleDeg / 25.0);
      const points = this.speedKmh * angleMultiplier * 1.5 * dt * this.driftMultiplier;
      this.currentDriftPoints += points;
      this.driftScore += points;
      this.driftMultiplier = Math.min(4.0, 1.0 + (this.currentDriftPoints / 500.0));
    } else {
      if (this.isDrifting) {
        // Drift ended cleanly
        this.isDrifting = false;
        this.currentDriftPoints = 0;
        this.driftMultiplier = 1.0;
      }
    }
  }

  applyWallCollision(normalX, normalY, penetration, isInitialImpact = true) {
    // Push car back onto track every frame
    this.x += normalX * penetration;
    this.y += normalY * penetration;

    // Reflect & scrub velocity: remove velocity directed into the wall
    const dot = this.vx * normalX + this.vy * normalY;
    if (dot < 0) {
      this.vx -= 1.1 * dot * normalX;
      this.vy -= 1.1 * dot * normalY;
    }

    // Scrub speed gently and dampen yaw rate ONCE per contact
    // (gated by cooldown in engine so a continuous wall slide doesn't stop the car)
    if (isInitialImpact) {
      this.vx *= 0.88;
      this.vy *= 0.88;
      this.yawRate *= 0.55;
    }
    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.speedKmh = this.speed * 3.6;
  }
}
