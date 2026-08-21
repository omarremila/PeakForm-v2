// src/components/LiveCamera.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { createLandmarkSmoother } from '../lib/pose/angles';
import { createSquatAnalyzer } from '../lib/pose/squatAnalyzer';
import { createVoiceFeedback } from '../lib/voiceFeedback';
import './LiveCamera.css';

const ANALYZERS = {
  squat: createSquatAnalyzer,
};

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
    },
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