/**
 * Small camera-stream helpers shared by pose-detection hooks.
 *
 * @module utils/poseHelpers
 */

/**
 * Build getUserMedia constraints for a given camera facing mode.
 * @param {'user' | 'environment'} facingMode
 */
export async function getMediaConstraints(facingMode = 'user') {
  return {
    video: {
      facingMode,
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: false,
  };
}

/** Stop every track on a MediaStream, releasing the camera. */
export function stopAllTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}