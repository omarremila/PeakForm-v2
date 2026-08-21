// src/lib/pose/squatAnalyzer.js
import { POSE_LANDMARKS } from '../../constants/pose';
import { getLandmark, angleAt } from './angles';

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

// Knees should stay roughly as wide as the ankles; if they pull much
// narrower than that, that's valgus (knees caving in).
const VALGUS_RATIO = 0.8;

export function createSquatAnalyzer() {
  let phase = 'up';
  let repCount = 0;
  let minKneeAngleInRep = Infinity;
  let minTorsoAngleInRep = Infinity;
  let valgusFlaggedInRep = false;

  function update(landmarks) {
    const leftHip = getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP);
    const leftKnee = getLandmark(landmarks, POSE_LANDMARKS.LEFT_KNEE);
    const leftAnkle = getLandmark(landmarks, POSE_LANDMARKS.LEFT_ANKLE);
    const leftShoulder = getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);
    const rightKnee = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_KNEE);
    const rightAnkle = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_ANKLE);

    const kneeAngle = angleAt(leftHip, leftKnee, leftAnkle);
    const torsoAngle = angleAt(leftShoulder, leftHip, leftKnee);

    const events = [];

    if (kneeAngle == null) {
      return { phase, repCount, kneeAngle: null, events };
    }

    // Valgus check: only meaningful with both knees/ankles visible.
    if (leftKnee && rightKnee && leftAnkle && rightAnkle) {
      const ankleWidth = Math.abs(leftAnkle.x - rightAnkle.x);
      const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
      if (
        phase === 'down' &&
        ankleWidth > 0 &&
        kneeWidth < ankleWidth * VALGUS_RATIO &&
        !valgusFlaggedInRep
      ) {
        valgusFlaggedInRep = true;
        events.push({ code: 'KNEE_VALGUS', message: 'Push your knees out' });
      }
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
        if (
          events.length === 0 ||
          (!events.some((e) => e.code !== 'REP_COUNTED') && !valgusFlaggedInRep)
        ) {
          events.push({ code: 'REP_COUNTED', message: `Rep ${repCount}` });
        }

        minKneeAngleInRep = Infinity;
        minTorsoAngleInRep = Infinity;
        valgusFlaggedInRep = false;
      }
    }

    return { phase, repCount, kneeAngle, events };
  }

  function reset() {
    phase = 'up';
    repCount = 0;
    minKneeAngleInRep = Infinity;
    minTorsoAngleInRep = Infinity;
    valgusFlaggedInRep = false;
  }

  return { update, reset };
}