// src/lib/pose/bicepCurlAnalyzer.js
import { POSE_LANDMARKS } from '../../constants/pose';
import { getLandmark, angleAt, pickBetterSide } from './angles';

// Elbow angle (shoulder-elbow-wrist) thresholds, in degrees, that drive the
// extended/curled phase state machine. A gap between them (hysteresis)
// stops a single rep from being counted twice as the angle hovers near
// one value.
const CURL_THRESHOLD = 70; // angle drops below this -> entered the curl
const EXTEND_THRESHOLD = 150; // angle rises above this -> arm back down

// A "good" curl brings the elbow angle at the top below this.
const GOOD_CURL_ANGLE = 55;

// If the shoulder-hip-elbow angle (how far the upper arm swings forward
// off the torso) climbs above this during the rep, the lifter is swinging
// the elbow forward to use momentum instead of curling in place.
const MAX_SHOULDER_SWING_ANGLE = 45;

const SIDE_JOINTS = ['SHOULDER', 'ELBOW', 'WRIST', 'HIP'];

export function createBicepCurlAnalyzer() {
  let phase = 'extended';
  let repCount = 0;
  let minElbowAngleInRep = Infinity;
  let maxSwingAngleInRep = -Infinity;
  let activeSide = 'LEFT';

  function update(landmarks) {
    // Only reconsider which side to track between reps, so a single rep's
    // angle tracking never switches sides partway through.
    if (phase === 'extended') {
      activeSide = pickBetterSide(landmarks, SIDE_JOINTS, POSE_LANDMARKS) ?? activeSide;
    }

    const shoulder = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_SHOULDER`]);
    const elbow = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_ELBOW`]);
    const wrist = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_WRIST`]);
    const hip = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_HIP`]);

    const elbowAngle = angleAt(shoulder, elbow, wrist);
    const swingAngle = angleAt(hip, shoulder, elbow);

    const events = [];

    if (elbowAngle == null) {
      return { phase, repCount, elbowAngle: null, swingAngle: null, side: activeSide, events };
    }

    if (phase === 'extended' && elbowAngle < CURL_THRESHOLD) {
      phase = 'curled';
      minElbowAngleInRep = elbowAngle;
      maxSwingAngleInRep = swingAngle ?? -Infinity;
    } else if (phase === 'curled') {
      minElbowAngleInRep = Math.min(minElbowAngleInRep, elbowAngle);
      if (swingAngle != null) {
        maxSwingAngleInRep = Math.max(maxSwingAngleInRep, swingAngle);
      }

      if (elbowAngle > EXTEND_THRESHOLD) {
        phase = 'extended';
        repCount += 1;

        if (minElbowAngleInRep > GOOD_CURL_ANGLE) {
          events.push({ code: 'NOT_CURLED_ENOUGH', message: 'Curl all the way up' });
        }
        if (maxSwingAngleInRep > MAX_SHOULDER_SWING_ANGLE) {
          events.push({ code: 'USING_MOMENTUM', message: 'Keep your elbow pinned to your side' });
        }
        if (events.length === 0) {
          events.push({ code: 'REP_COUNTED', message: `Rep ${repCount}` });
        }

        minElbowAngleInRep = Infinity;
        maxSwingAngleInRep = -Infinity;
      }
    }

    return { phase, repCount, elbowAngle, swingAngle, side: activeSide, events };
  }

  function reset() {
    phase = 'extended';
    repCount = 0;
    minElbowAngleInRep = Infinity;
    maxSwingAngleInRep = -Infinity;
    activeSide = 'LEFT';
  }

  return { update, reset };
}