// src/lib/pose/pushupAnalyzer.js
import { POSE_LANDMARKS } from '../../constants/pose';
import { getLandmark, angleAt, pickBetterSide } from './angles';

// Elbow angle (shoulder-elbow-wrist) thresholds, in degrees, that drive the
// up/down phase state machine. A gap between them (hysteresis) stops a
// single rep from being counted twice as the angle hovers near one value.
const DOWN_THRESHOLD = 130; // angle drops below this -> entered the push-up
const UP_THRESHOLD = 160; // angle rises above this -> back to arms extended

// A "good" push-up brings the elbow angle at the bottom below this.
const GOOD_DEPTH_ANGLE = 100;

// If the shoulder-hip-ankle angle (body line) drops below this at any
// point in the rep, the hips are sagging instead of holding a straight
// plank line.
const MIN_BODY_LINE_ANGLE = 160;

const SIDE_JOINTS = ['SHOULDER', 'ELBOW', 'WRIST', 'HIP', 'ANKLE'];

export function createPushupAnalyzer() {
  let phase = 'up';
  let repCount = 0;
  let minElbowAngleInRep = Infinity;
  let minBodyLineAngleInRep = Infinity;
  let activeSide = 'LEFT';

  function update(landmarks) {
    // Only reconsider which side to track between reps, so a single rep's
    // angle tracking never switches sides partway through.
    if (phase === 'up') {
      activeSide = pickBetterSide(landmarks, SIDE_JOINTS, POSE_LANDMARKS) ?? activeSide;
    }

    const shoulder = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_SHOULDER`]);
    const elbow = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_ELBOW`]);
    const wrist = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_WRIST`]);
    const hip = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_HIP`]);
    const ankle = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_ANKLE`]);

    const elbowAngle = angleAt(shoulder, elbow, wrist);
    const bodyLineAngle = angleAt(shoulder, hip, ankle);

    const events = [];

    if (elbowAngle == null) {
      return { phase, repCount, elbowAngle: null, bodyLineAngle: null, side: activeSide, events };
    }

    if (phase === 'up' && elbowAngle < DOWN_THRESHOLD) {
      phase = 'down';
      minElbowAngleInRep = elbowAngle;
      minBodyLineAngleInRep = bodyLineAngle ?? Infinity;
    } else if (phase === 'down') {
      minElbowAngleInRep = Math.min(minElbowAngleInRep, elbowAngle);
      if (bodyLineAngle != null) {
        minBodyLineAngleInRep = Math.min(minBodyLineAngleInRep, bodyLineAngle);
      }

      if (elbowAngle > UP_THRESHOLD) {
        phase = 'up';
        repCount += 1;

        if (minElbowAngleInRep > GOOD_DEPTH_ANGLE) {
          events.push({ code: 'NOT_DEEP_ENOUGH', message: 'Lower your chest closer to the floor' });
        }
        if (minBodyLineAngleInRep < MIN_BODY_LINE_ANGLE) {
          events.push({ code: 'HIPS_SAGGING', message: 'Keep your hips up, straighten your line' });
        }
        if (events.length === 0) {
          events.push({ code: 'REP_COUNTED', message: `Rep ${repCount}` });
        }

        minElbowAngleInRep = Infinity;
        minBodyLineAngleInRep = Infinity;
      }
    }

    return { phase, repCount, elbowAngle, bodyLineAngle, side: activeSide, events };
  }

  function reset() {
    phase = 'up';
    repCount = 0;
    minElbowAngleInRep = Infinity;
    minBodyLineAngleInRep = Infinity;
    activeSide = 'LEFT';
  }

  return { update, reset };
}