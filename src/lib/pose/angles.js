// src/lib/pose/angles.js

const MIN_VISIBILITY = 0.5;

// Angle in degrees at vertex `b`, formed by rays b->a and b->c.
// Works on any {x, y} points, whether pixel or normalized coordinates.
export function angleAt(a, b, c) {
  if (!a || !b || !c) return null;

  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return null;

  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// A MediaPipe landmark below this confidence is treated as not visible.
export function getLandmark(landmarks, index) {
  const point = landmarks[index];
  return point && point.visibility >= MIN_VISIBILITY ? point : null;
}

// Exponential moving average smoothing across a landmarks array, to cut
// down on frame-to-frame jitter before angles are computed from them.
export function createLandmarkSmoother(alpha = 0.5) {
  let prev = null;

  return function smooth(landmarks) {
    if (!prev) {
      prev = landmarks;
      return landmarks;
    }

    const next = landmarks.map((landmark, index) => {
      const prior = prev[index];
      if (!prior || landmark.visibility < MIN_VISIBILITY) return landmark;
      return {
        ...landmark,
        x: alpha * landmark.x + (1 - alpha) * prior.x,
        y: alpha * landmark.y + (1 - alpha) * prior.y,
      };
    });

    prev = next;
    return next;
  };
}