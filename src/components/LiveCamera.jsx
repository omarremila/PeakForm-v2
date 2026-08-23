// src/components/LiveCamera.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { createLandmarkSmoother } from '../lib/pose/angles';
import { createSquatAnalyzer } from '../lib/pose/squatAnalyzer';
import { createVoiceFeedback } from '../lib/voiceFeedback';
import { POSE_LANDMARKS } from '../constants/pose';
import './LiveCamera.css';

const ANALYZERS = {
  squat: createSquatAnalyzer,
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

function drawAngleOverlay(canvas, landmarks, result) {
  if (!canvas || result.kneeAngle == null) return;

  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const side = result.side;

  const knee = landmarks[POSE_LANDMARKS[`${side}_KNEE`]];
  const hip = landmarks[POSE_LANDMARKS[`${side}_HIP`]];

  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'middle';

  if (knee) {
    ctx.fillStyle = 'rgb(208, 38, 249)';
    fillMirroredText(ctx, `${result.kneeAngle.toFixed(0)}°`, knee.x * width - 14, knee.y * height);
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
      for (const event of result.events) {
        setFeedback(event.message);
        voice.speak(event.code, event.message);
      }
      // canvasRef comes from usePoseDetection(), called below (it needs
      // handleLandmarks as an argument, so it can't be declared first).
      // It's a ref object, stable across renders, so it's safe to omit here
      // -- and, since it's declared after this callback, TDZ rules mean it
      // can't be added to the dependency array even if we wanted to.
      drawAngleOverlay(canvasRef.current, landmarks, result);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analyzer, smooth, voice],
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