/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Tuning Constants
 * Centralised gameplay, physics, and input parameters.
 */

export const TUNING = {
  // Goal & Pitch Geometry (metres)
  goal: {
    width: 7.32,         // Standard goal width
    height: 2.44,        // Standard crossbar height
    depth: 2.0,          // Net depth
    postRadius: 0.06,    // Cylindrical post radius
    spotDistance: 11.0,   // Penalty spot to goal line along Z axis
    // Zone boundaries in goal plane (Z = 0)
    // X: Left [-3.66, -1.22], Mid [-1.22, 1.22], Right [1.22, 3.66]
    // Y: Low [0, 1.22], High [1.22, 2.44]
    xLeft: -1.22,
    xRight: 1.22,
    yMid: 1.22
  },

  ball: {
    radius: 0.11,        // Size 5 football radius ~11 cm
    mass: 0.43,          // ~430 grams
    dragCoeff: 0.25,     // Aerodynamic quadratic drag coefficient
    airDensity: 1.225,   // kg/m^3
    magnusCoeff: 0.0010, // Lateral Magnus spin coefficient
    gravity: -9.81,      // m/s^2
    reboundPost: 0.65    // Coefficient of restitution on post hit
  },

  swipe: {
    minDistPx: 25,       // Minimum swipe pixel distance
    minDurationMs: 40,   // Minimum swipe duration
    maxDurationMs: 800,  // Maximum swipe duration
    minSpeedPxPerMs: 0.35, // Below this is too weak
    maxSpeedPxPerMs: 2.50, // Above this is 100% power
    minLaunchSpeed: 18.0,  // m/s (~65 km/h)
    maxLaunchSpeed: 32.0,  // m/s (~115 km/h)
    overpowerThreshold: 0.92, // Power > 0.92 adds vertical lift (can soar over bar)
    curveMultiplier: 1.4, // Sensitivity of swipe bend to lateral spin
    maxSpin: 28.0        // Max spin in rad/s
  },

  keeper: {
    height: 1.85,
    reactionDelayBase: 0.16, // seconds (160ms)
    reactionDelayMin: 0.12,  // 120ms at high difficulty
    reactionDelayMax: 0.22,  // 220ms at low difficulty
    diveDuration: 0.48,      // seconds to reach peak reach
    gloveReachRadius: 0.42,  // Effective reach of extended glove (metres)
    bodyReachRadius: 0.48,   // Effective reach of torso / legs
    catchSpeedLimit: 22.0,   // Below this speed (m/s) keeper catches; above = parry
    parryReboundSpeed: 0.45
  },

  juice: {
    slowMoDistZ: 3.2,     // Distance to goal line where slow-mo activates
    slowMoTimeScale: 0.30,// Game time multiplier during slow-mo
    shakeDurationMs: 250, // Screen shake duration on goal / post
    shakeIntensity: 0.08,
    hitStopMs: 80,        // Save contact freeze frame
    confettiCount: 160,
    revealDurationMs: 1400 // In-scene mind-reading heat overlay duration
  },

  audio: {
    masterVolume: 0.85
  }
};
