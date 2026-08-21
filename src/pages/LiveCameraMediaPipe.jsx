// LiveCameraMediaPipe.jsx — minimal starting point
import { useEffect, useRef } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export default function LiveCameraMediaPipe() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let stream;
    let landmarker;
    let rafId;

    async function start() {
      // 1. Load the model (WASM runtime + task file, both fetched once).
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      // 2. Camera.
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // 3. Detect loop.
      const ctx = canvasRef.current.getContext('2d');
      const loop = () => {
        const result = landmarker.detectForVideo(videoRef.current, performance.now());
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        for (const landmarks of result.landmarks) {
          for (const point of landmarks) {
            ctx.beginPath();
            ctx.arc(
              point.x * canvasRef.current.width,
              point.y * canvasRef.current.height,
              4,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = 'rgb(208, 38, 249)';
            ctx.fill();
          }
        }

        rafId = requestAnimationFrame(loop);
      };
      loop();
    }

    start();

    return () => {
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: 640, height: 480 }}>
      <video ref={videoRef} style={{ position: 'absolute', width: '100%', height: '100%' }} muted playsInline />
      <canvas ref={canvasRef} width={640} height={480} style={{ position: 'absolute' }} />
    </div>
  );
}