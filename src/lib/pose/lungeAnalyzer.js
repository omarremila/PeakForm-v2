// src/lib/pose/lungeAnalyzer.js
import { POSE_LANDMARKS } from '../../constants/pose';
import { getLandmark, angleAt, pickBetterSide } from './angles';

// Front-knee angle (hip-knee-ankle) thresholds, in degrees, that drive the
// up/down phase state machine. A gap between them (hysteresis) stops a
// single rep from being counted twice as the angle hovers near one value.
const DOWN_THRESHOLD = 120; // angle drops below this -> entered the lunge
const UP_THRESHOLD = 160; // angle rises above this -> back to standing

// A "good" lunge brings the front-knee angle at the bottom below this.
//
// No forward-lean or back-knee check here, unlike squat/push-up: how far
// the torso should lean and how low the back knee should drop both vary
// a lot across lunge styles (walking, reverse, stationary), so there isn't
// one rule that would be fair to apply to all of them.
const GOOD_DEPTH_ANGLE = 110;

const SIDE_JOINTS = ['HIP', 'KNEE', 'ANKLE'];

export function createLungeAnalyzer() {
  let phase = 'up';
  let repCount = 0;
  let minKneeAngleInRep = Infinity;
  let activeSide = 'LEFT';

  function update(landmarks) {
    // Only reconsider which side to track between reps, so a single rep's
    // angle tracking never switches sides partway through. For a lunge this
    // tracks whichever leg the camera sees best -- typically the leg
    // stepping forward, since it moves furthest into view.
    if (phase === 'up') {
      activeSide = pickBetterSide(landmarks, SIDE_JOINTS, POSE_LANDMARKS) ?? activeSide;
    }

    const hip = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_HIP`]);
    const knee = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_KNEE`]);
    const ankle = getLandmark(landmarks, POSE_LANDMARKS[`${activeSide}_ANKLE`]);

    const kneeAngle = angleAt(hip, knee, ankle);

    const events = [];

    if (kneeAngle == null) {
      return { phase, repCount, kneeAngle: null, side: activeSide, events };
    }

    if (phase === 'up' && kneeAngle < DOWN_THRESHOLD) {
      phase = 'down';
      minKneeAngleInRep = kneeAngle;
    } else if (phase === 'down') {
      minKneeAngleInRep = Math.min(minKneeAngleInRep, kneeAngle);

      if (kneeAngle > UP_THRESHOLD) {
        phase = 'up';
        repCount += 1;

        if (minKneeAngleInRep > GOOD_DEPTH_ANGLE) {
          events.push({ code: 'NOT_DEEP_ENOUGH', message: 'Drop your back knee lower' });
        }
        if (events.length === 0) {
          events.push({ code: 'REP_COUNTED', message: `Rep ${repCount}` });
        }

        minKneeAngleInRep = Infinity;
      }
    }

    return { phase, repCount, kneeAngle, side: activeSide, events };
  }

  function reset() {
    phase = 'up';
    repCount = 0;
    minKneeAngleInRep = Infinity;
    activeSide = 'LEFT';
  }

  return { update, reset };
}