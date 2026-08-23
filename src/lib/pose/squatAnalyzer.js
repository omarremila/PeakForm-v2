// src/lib/pose/squatAnalyzer.js
import { POSE_LANDMARKS } from '../../constants/pose';
import { getLandmark, getVisibility, angleAt } from './angles';

// Knee angle (hip-knee-ankle) thresholds, in degrees, that drive the
// up/down phase state machine. A gap between them (hysteresis) stops a
// single rep from being counted twice as the angle hovers near one value.
const DOWN_THRESHOLD = 110; // angle drops below this -> entered the squat
const UP_THRESHOLD = 160; // angle rises above this -> back to standing

// A "good" squat brings the knee angle at the bottom below this.
const GOOD_DEPTH_ANGLE = 100;

// If the hip-shoulder-knee angle (torso lean) drops below this at the
// bottom of the rep, the torso is pitching too far forward.
const MIN_TORSO_ANGLE = 45;

// Picks whichever side (left or right) is currently better-seen by the
// camera, so the analyzer works whether the user's left or right side
// faces the camera. Returns null if neither side is visible at all, in
// which case the caller keeps using whichever side it was already on.
function pickBetterSide(landmarks) {
  const leftScore =
    getVisibility(landmarks, POSE_LANDMARKS.LEFT_HIP) +
    getVisibility(landmarks, POSE_LANDMARKS.LEFT_KNEE) +
    getVisibility(landmarks, POSE_LANDMARKS.LEFT_ANKLE) +
    getVisibility(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);
  const rightScore =
    getVisibility(landmarks, POSE_LANDMARKS.RIGHT_HIP) +
    getVisibility(landmarks, POSE_LANDMARKS.RIGHT_KNEE) +
    getVisibility(landmarks, POSE_LANDMARKS.RIGHT_ANKLE) +
    getVisibility(landmarks, POSE_LANDMARKS.RIGHT_SHOULDER);

  if (leftScore === 0 && rightScore === 0) return null;
  return rightScore > leftScore ? 'RIGHT' : 'LEFT';
}

export function createSquatAnalyzer() {
  let phase = 'up';
  let repCount = 0;
  let minKneeAngleInRep = Infinity;
  let minTorsoAngleInRep = Infinity;
  let activeSide = 'LEFT';

  function update(landmarks) {
    // Only reconsider which side to track while standing between reps, so
    // a single rep's angle tracking never switches sides partway through.
    if (phase === 'up') {
      activeSide = pickBetterSide(landmarks) ?? activeSide;
    }

    const hip = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_HIP`]);
    const knee = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_KNEE`]);
    const ankle = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_ANKLE`]);
    const shoulder = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_SHOULDER`]);

    const kneeAngle = angleAt(hip, knee, ankle);
    const torsoAngle = angleAt(shoulder, hip, knee);

    const events = [];

    if (kneeAngle == null) {
      return { phase, repCount, kneeAngle: null, torsoAngle: null, side: activeSide, events };
    }

    if (phase === 'up' && kneeAngle < DOWN_THRESHOLD) {
      phase = 'down';
      minKneeAngleInRep = kneeAngle;
      minTorsoAngleInRep = torsoAngle ?? Infinity;
    } else if (phase === 'down') {
      minKneeAngleInRep = Math.min(minKneeAngleInRep, kneeAngle);
      if (torsoAngle != null) {
        minTorsoAngleInRep = Math.min(minTorsoAngleInRep, torsoAngle);
      }

      if (kneeAngle > UP_THRESHOLD) {
        phase = 'up';
        repCount += 1;

        if (minKneeAngleInRep > GOOD_DEPTH_ANGLE) {
          events.push({ code: 'NOT_DEEP_ENOUGH', message: 'Go lower next rep' });
        }
        if (minTorsoAngleInRep < MIN_TORSO_ANGLE) {
          events.push({ code: 'LEANING_FORWARD', message: 'Keep your chest up' });
        }
        if (events.length === 0) {
          events.push({ code: 'REP_COUNTED', message: `Rep ${repCount}` });
        }

        minKneeAngleInRep = Infinity;
        minTorsoAngleInRep = Infinity;
      }
    }

    return { phase, repCount, kneeAngle, events };
  }

  function reset() {
    phase = 'up';
    repCount = 0;
    minKneeAngleInRep = Infinity;
    minTorsoAngleInRep = Infinity;
    activeSide = 'LEFT';
  }

  return { update, reset };
}