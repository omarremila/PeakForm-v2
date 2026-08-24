// src/lib/pose/shoulderPressAnalyzer.js
import { POSE_LANDMARKS } from '../../constants/pose';
import { getLandmark, angleAt, pickBetterSide } from './angles';

// Elbow angle (shoulder-elbow-wrist) thresholds, in degrees, that drive the
// racked/pressed phase state machine. Unlike squat/curl/push-up, the *rest*
// position here is the bent one (arms racked at shoulder height, a small
// angle), so the state machine runs in the opposite direction: it enters
// the active phase when the angle rises past PRESS_THRESHOLD, and returns
// to rest when the angle falls back below RACK_THRESHOLD. The gap between
// them (hysteresis) stops a single rep from being counted twice as the
// angle hovers near one value.
const PRESS_THRESHOLD = 130; // angle rises above this -> entered the press
const RACK_THRESHOLD = 100; // angle drops below this -> back to racked

// A "good" press extends the elbow angle at the top above this (full
// lockout overhead).
const GOOD_LOCKOUT_ANGLE = 160;

// If the shoulder-hip-knee angle (torso lean) drops below this at any
// point in the rep, the lifter is arching their back to help drive the
// weight up instead of pressing with the arms alone.
const MIN_TORSO_ANGLE = 160;

const SIDE_JOINTS = ['SHOULDER', 'ELBOW', 'WRIST', 'HIP', 'KNEE'];

export function createShoulderPressAnalyzer() {
  let phase = 'racked';
  let repCount = 0;
  let maxElbowAngleInRep = -Infinity;
  let minTorsoAngleInRep = Infinity;
  let activeSide = 'LEFT';

  function update(landmarks) {
    // Only reconsider which side to track between reps, so a single rep's
    // angle tracking never switches sides partway through.
    if (phase === 'racked') {
      activeSide = pickBetterSide(landmarks, SIDE_JOINTS, POSE_LANDMARKS) ?? activeSide;
    }

    const shoulder = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_SHOULDER`]);
    const elbow = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_ELBOW`]);
    const wrist = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_WRIST`]);
    const hip = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_HIP`]);
    const knee = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_KNEE`]);

    const elbowAngle = angleAt(shoulder, elbow, wrist);
    const torsoAngle = angleAt(shoulder, hip, knee);

    const events = [];

    if (elbowAngle == null) {
      return { phase, repCount, elbowAngle: null, torsoAngle: null, side: activeSide, events };
    }

    if (phase === 'racked' && elbowAngle > PRESS_THRESHOLD) {
      phase = 'pressed';
      maxElbowAngleInRep = elbowAngle;
      minTorsoAngleInRep = torsoAngle ?? Infinity;
    } else if (phase === 'pressed') {
      maxElbowAngleInRep = Math.max(maxElbowAngleInRep, elbowAngle);
      if (torsoAngle != null) {
        minTorsoAngleInRep = Math.min(minTorsoAngleInRep, torsoAngle);
      }

      if (elbowAngle < RACK_THRESHOLD) {
        phase = 'racked';
        repCount += 1;

        if (maxElbowAngleInRep < GOOD_LOCKOUT_ANGLE) {
          events.push({ code: 'NOT_FULL_LOCKOUT', message: 'Press all the way to lockout' });
        }
        if (minTorsoAngleInRep < MIN_TORSO_ANGLE) {
          events.push({ code: 'ARCHING_BACK', message: "Don't arch your back, brace your core" });
        }
        if (events.length === 0) {
          events.push({ code: 'REP_COUNTED', message: `Rep ${repCount}` });
        }

        maxElbowAngleInRep = -Infinity;
        minTorsoAngleInRep = Infinity;
      }
    }

    return { phase, repCount, elbowAngle, torsoAngle, side: activeSide, events };
  }

  function reset() {
    phase = 'racked';
    repCount = 0;
    maxElbowAngleInRep = -Infinity;
    minTorsoAngleInRep = Infinity;
    activeSide = 'LEFT';
  }

  return { update, reset };
}