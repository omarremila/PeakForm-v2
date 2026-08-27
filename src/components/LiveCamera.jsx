// src/components/LiveCamera.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { createLandmarkSmoother } from '../lib/pose/angles';
import { createSquatAnalyzer } from '../lib/pose/squatAnalyzer';
import { createBicepCurlAnalyzer } from '../lib/pose/bicepCurlAnalyzer';
import { createPushupAnalyzer } from '../lib/pose/pushupAnalyzer';
import { createLungeAnalyzer } from '../lib/pose/lungeAnalyzer';
import { createShoulderPressAnalyzer } from '../lib/pose/shoulderPressAnalyzer';
import { createVoiceFeedback } from '../lib/voiceFeedback';
import { getCoachFeedback } from '../lib/aiCoach';
import { POSE_LANDMARKS } from '../constants/pose';
import './LiveCamera.css';

const ANALYZERS = {
  squat: createSquatAnalyzer,
  'bicep-curl': createBicepCurlAnalyzer,
  pushups: createPushupAnalyzer,
  lunges: createLungeAnalyzer,
  'shoulder-press': createShoulderPressAnalyzer,
};

// Each analyzer reports its own primary joint angle under a different key
// (a squat tracks the knee, a curl tracks the elbow, ...) plus which body
// landmark that angle is centered on. This lets the overlay draw the right
// number at the right joint without knowing which exercise is active.
const PRIMARY_ANGLE_FIELD = {
  squat: { angleKey: 'kneeAngle', joint: 'KNEE' },
  'bicep-curl': { angleKey: 'elbowAngle', joint: 'ELBOW' },
  pushups: { angleKey: 'elbowAngle', joint: 'ELBOW' },
  lunges: { angleKey: 'kneeAngle', joint: 'KNEE' },
  'shoulder-press': { angleKey: 'elbowAngle', joint: 'ELBOW' },
};

// Draws text that reads correctly despite the canvas being mirrored via
// CSS (transform: scaleX(-1) in LiveCamera.css). Flipping the canvas's own
// coordinate system locally, just for this one draw call, cancels out that
// outer mirror so the glyphs come out right-way-round for the viewer.
function fillMirroredText(ctx, text, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-1, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawAngleOverlay(canvas, landmarks, result, exerciseId) {
  const primary = PRIMARY_ANGLE_FIELD[exerciseId];
  if (!canvas || !primary || result[primary.angleKey] == null) return;

  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const side = result.side;

  const primaryJoint = landmarks[POSE_LANDMARKS[`${side}_${primary.joint}`]];
  const hip = landmarks[POSE_LANDMARKS[`${side}_HIP`]];

  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'middle';

  if (primaryJoint) {
    ctx.fillStyle = 'rgb(208, 38, 249)';
    fillMirroredText(
      ctx,
      `${result[primary.angleKey].toFixed(0)}°`,
      primaryJoint.x * width - 14,
      primaryJoint.y * height,
    );
  }
  if (hip && result.torsoAngle != null) {
    ctx.fillStyle = 'rgb(45, 181, 228)';
    fillMirroredText(ctx, `${result.torsoAngle.toFixed(0)}°`, hip.x * width - 14, hip.y * height);
  }
}

export default function LiveCamera({ exerciseId }) {
  const [repCount, setRepCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Recreated together whenever the exercise changes, so rep state and
  // smoothing history never leak from one exercise into another.
  const { analyzer, smooth } = useMemo(() => {
    const createAnalyzer = ANALYZERS[exerciseId];
    return {
      analyzer: createAnalyzer ? createAnalyzer() : null,
      smooth: createLandmarkSmoother(),
    };
  }, [exerciseId]);
  const voice = useMemo(() => createVoiceFeedback(), []);

  const handleLandmarks = useCallback(
    (landmarks) => {
      if (!analyzer) return;
      const result = analyzer.update(smooth(landmarks));
      setRepCount(result.repCount);

      // All events on this frame belong to the same just-completed rep
      // (an analyzer only ever pushes events at the moment a rep finishes),
      // so they're combined into one AI request instead of firing separate,
      // possibly-overlapping utterances for each issue.
      if (result.events.length > 0 && voice.shouldSpeak()) {
        const codes = result.events.map((event) => event.code);
        const { events: _events, ...metrics } = result;

        getCoachFeedback({ exerciseId, codes, repCount: result.repCount, metrics }).then(
          (text) => {
            setFeedback(text);
            voice.speakText(text);
          },
        );
      }

      // canvasRef comes from usePoseDetection(), called below (it needs
      // handleLandmarks as an argument, so it can't be declared first).
      // It's a ref object, stable across renders, so it's safe to omit here
      // -- and, since it's declared after this callback, TDZ rules mean it
      // can't be added to the dependency array even if we wanted to.
      drawAngleOverlay(canvasRef.current, landmarks, result, exerciseId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyzer, smooth, voice, exerciseId],
  );

  const {
    detectionState,
    videoRef,
    canvasRef,
    handleStartDetection,
    handleStopDetection,
    handleSwitchCamera,
  } = usePoseDetection({ onLandmarks: handleLandmarks });

  // Stop the camera when navigating away from this exercise.
  useEffect(() => handleStopDetection, [handleStopDetection]);

  return (
    <div className="live-camera">
      <div className="live-camera-stage">
        <video ref={videoRef} className="live-camera-video" muted playsInline />
        <canvas ref={canvasRef} className="live-camera-canvas" />

        {detectionState.error ? (
          <div className="live-camera-overlay live-camera-error">
            <p>{detectionState.error}</p>
            <button type="button" onClick={handleStartDetection}>
              Try Again
            </button>
          </div>
        ) : detectionState.isLoading ? (
          <div className="live-camera-overlay">Loading camera and pose model...</div>
        ) : (
          !detectionState.isDetecting && (
            <div className="live-camera-overlay">
              <button type="button" onClick={handleStartDetection}>
                Start Camera
              </button>
            </div>
          )
        )}
      </div>

      {detectionState.isDetecting && (
        <div className="live-camera-controls">
          <button type="button" onClick={handleStopDetection}>
            Stop
          </button>
          <button type="button" onClick={handleSwitchCamera}>
            Switch Camera
          </button>
        </div>
      )}

      {analyzer && (
        <div className="live-camera-stats">
          <div className="live-camera-reps">Reps: {repCount}</div>
          <div className="live-camera-feedback">{feedback}</div>
        </div>
      )}
    </div>
  );
}