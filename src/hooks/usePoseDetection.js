/**
 * Custom hook for pose detection using MediaPipe
 * Handles video stream, pose landmark detection, and camera controls
 *
 * @module usePoseDetection
 */

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_CONTEXT_OPTIONS,
  DETECTION_INTERVAL_MS,
  DRAWING_STYLES,
  POSE_CONFIG,
  POSE_CONNECTIONS,
  POSE_MODEL_URL,
  WASM_CDN_URL,
} from "../constants/pose";
import { getMediaConstraints, stopAllTracks } from "../utils/poseHelpers";

/** Initial detection state */
const INITIAL_STATE = {
  isDetecting: false,
  facingMode: "user",
  isLoading: false,
  error: null,
  landmarksDetected: false,
};

/**
 * Custom hook for pose detection logic and camera state management
 * @param {Object} [options]
 * @param {(landmarks: object[]) => void} [options.onLandmarks] Called with
 *   the first detected pose's landmarks on every frame a pose is found.
 *   Use this to drive exercise-specific rep counting/form analysis without
 *   coupling it to the detection loop itself.
 * @returns {Object} Detection state and control functions
 */
export const usePoseDetection = ({ onLandmarks } = {}) => {          // <-- added onLandmarks param
  // Detection state
  const [detectionState, setDetectionState] = useState(INITIAL_STATE);

  // Refs for DOM elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // Refs for detection control
  const animationFrameId = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const detectSessionRef = useRef(0);

  // Kept in a ref so detectPose's identity (and its deps) doesn't have to
  // change every time the caller passes a new callback instance.
  const onLandmarksRef = useRef(onLandmarks);                          // <-- added
  onLandmarksRef.current = onLandmarks;                                // <-- added

  /**
   * Initialize MediaPipe PoseLandmarker
   */
  const initializePoseLandmarker = useCallback(async () => {
    if (poseLandmarkerRef.current) return poseLandmarkerRef.current;

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        ...POSE_CONFIG,
      });

      poseLandmarkerRef.current = poseLandmarker;
      return poseLandmarker;
    } catch (error) {
      console.error("Failed to initialize PoseLandmarker:", error);
      throw error;
    }
  }, []);

  /**
   * Draw pose landmarks and connections on canvas
   */
  const drawPose = useCallback((landmarks, ctx, width, height) => {
    if (!landmarks?.length) return;

    ctx.clearRect(0, 0, width, height);
    const { connectionColor, connectionWidth, landmarkColor, landmarkRadius, confidenceThreshold } =
      DRAWING_STYLES;

    // Draw connections (skeleton lines)
    ctx.strokeStyle = connectionColor;
    ctx.lineWidth = connectionWidth;
    ctx.lineCap = "round";

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (start?.visibility > confidenceThreshold && end?.visibility > confidenceThreshold) {
        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }
    }

    // Draw landmarks (joint points)
    ctx.fillStyle = landmarkColor;
    for (const landmark of landmarks) {
      if (landmark.visibility > confidenceThreshold) {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, landmarkRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, []);

  /**
   * Run pose detection on video frame
   */
  const detectPose = useCallback(
    async (currentSession) => {
      const poseLandmarker = poseLandmarkerRef.current;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      // Validate session and resources
      if (!poseLandmarker || !video || !canvas || currentSession !== detectSessionRef.current) {
        return;
      }

      // Wait for video to be ready
      if (video.readyState < 2 || !ctx) {
        animationFrameId.current = requestAnimationFrame(() => detectPose(currentSession));
        return;
      }

      try {
        const results = poseLandmarker.detectForVideo(video, performance.now());
        const landmarks = results.landmarks?.[0];

        if (landmarks?.length) {
          drawPose(landmarks, ctx, canvas.width, canvas.height);
          onLandmarksRef.current?.(landmarks);                         // <-- added
          setDetectionState((prev) =>
            prev.landmarksDetected ? prev : { ...prev, landmarksDetected: true },
          );
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setDetectionState((prev) =>
            prev.landmarksDetected ? { ...prev, landmarksDetected: false } : prev,
          );
        }
      } catch (error) {
        console.error("Detection error:", error);
      }

      // Continue detection loop
      if (currentSession === detectSessionRef.current) {
        setTimeout(() => {
          animationFrameId.current = requestAnimationFrame(() => detectPose(currentSession));
        }, DETECTION_INTERVAL_MS);
      }
    },
    [drawPose],
  );

  /**
   * Stop pose detection and release resources
   */
  const handleStopDetection = useCallback(() => {
    // Increment session to invalidate any running detection
    detectSessionRef.current += 1;

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (streamRef.current) {
      stopAllTracks(streamRef.current);
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setDetectionState((prev) => ({
      ...prev,
      isDetecting: false,
      isLoading: false,
      landmarksDetected: false,
    }));
  }, []);

  /**
   * Start pose detection
   */
  const handleStartDetection = useCallback(async () => {
    // Stop any existing detection first
    handleStopDetection();

    // Start new session
    const currentSession = ++detectSessionRef.current;

    setDetectionState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Initialize pose landmarker
      await initializePoseLandmarker();

      // Check if session is still valid
      if (currentSession !== detectSessionRef.current) return;

      // Get camera stream
      const constraints = await getMediaConstraints(detectionState.facingMode);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Check if session is still valid
      if (currentSession !== detectSessionRef.current) {
        stopAllTracks(stream);
        return;
      }

      streamRef.current = stream;

      // Setup video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Setup canvas to match video dimensions
        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          contextRef.current = canvasRef.current.getContext("2d", CANVAS_CONTEXT_OPTIONS);
        }

        setDetectionState((prev) => ({
          ...prev,
          isDetecting: true,
          isLoading: false,
        }));

        // Start detection loop
        detectPose(currentSession);
      }
    } catch (error) {
      console.error("Failed to start detection:", error);
      setDetectionState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to start camera",
      }));
      handleStopDetection();
    }
  }, [detectionState.facingMode, handleStopDetection, initializePoseLandmarker, detectPose]);

  /**
   * Switch between front and back camera
   */
  const handleSwitchCamera = useCallback(async () => {
    if (!detectionState.isDetecting) return;

    const newFacingMode = detectionState.facingMode === "user" ? "environment" : "user";

    // Stop current detection
    handleStopDetection();

    // Start new session
    const currentSession = ++detectSessionRef.current;

    setDetectionState((prev) => ({
      ...prev,
      facingMode: newFacingMode,
      isLoading: true,
    }));

    try {
      // Get new camera stream
      const constraints = await getMediaConstraints(newFacingMode);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (currentSession !== detectSessionRef.current) {
        stopAllTracks(stream);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          contextRef.current = canvasRef.current.getContext("2d", CANVAS_CONTEXT_OPTIONS);
        }

        setDetectionState((prev) => ({
          ...prev,
          isDetecting: true,
          isLoading: false,
        }));

        detectPose(currentSession);
      }
    } catch (error) {
      console.error("Failed to switch camera:", error);
      handleStopDetection();
    }
  }, [detectionState.isDetecting, detectionState.facingMode, handleStopDetection, detectPose]);

  // Cleanup on unmount
  const handleStopDetectionRef = useRef(handleStopDetection);
  handleStopDetectionRef.current = handleStopDetection;

  useEffect(() => {
    return () => {
      handleStopDetectionRef.current();
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
    };
  }, []);

  return {
    detectionState,
    videoRef,
    canvasRef,
    handleStartDetection,
    handleStopDetection,
    handleSwitchCamera,
  };
};