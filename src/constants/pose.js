/**
 * Shared configuration for MediaPipe pose detection: model/runtime URLs,
 * drawing style, and the BlazePose 33-point landmark layout.
 *
 * @module constants/pose
 */

export const WASM_CDN_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

export const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export const POSE_CONFIG = {
  numPoses: 1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

// detectForVideo already runs at most once per animation frame; this just
// throttles how often we re-schedule the loop.
export const DETECTION_INTERVAL_MS = 0;

export const CANVAS_CONTEXT_OPTIONS = { willReadFrequently: false };

export const DRAWING_STYLES = {
  connectionColor: 'rgb(45, 181, 228)',
  connectionWidth: 3,
  landmarkColor: 'rgb(208, 38, 249)',
  landmarkRadius: 5,
  confidenceThreshold: 0.5,
};

// BlazePose 33-point landmark indices, named for readability.
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

// Skeleton connections for drawing (torso + limbs; skips the face mesh).
export const POSE_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13],
  [13, 15], // left arm
  [12, 14],
  [14, 16], // right arm
  [11, 23],
  [12, 24], // shoulder -> hip
  [23, 24], // hips
  [23, 25],
  [25, 27], // left leg
  [24, 26],
  [26, 28], // right leg
];