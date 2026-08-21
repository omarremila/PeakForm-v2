// src/lib/voiceFeedback.js

const DEFAULT_COOLDOWN_MS = 4000;

export function createVoiceFeedback({ cooldownMs = DEFAULT_COOLDOWN_MS } = {}) {
  const lastSpokenAt = new Map();
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  let warnedNoVoices = false;

  function speak(code, message) {
    if (!supported) return;

    const now = Date.now();
    const last = lastSpokenAt.get(code) ?? 0;
    if (now - last < cooldownMs) return;
    lastSpokenAt.set(code, now);

    if (!warnedNoVoices && window.speechSynthesis.getVoices().length === 0) {
      warnedNoVoices = true;
      console.warn(
        'voiceFeedback: no speech synthesis voices are available on this browser/OS ' +
          '(speechSynthesis.getVoices() is empty). Voice cues will silently fail to play ' +
          'until a TTS voice is installed.',
      );
    }

    // Chrome can silently drop an utterance if speak() is called immediately
    // after cancel(); only cancel when something is actually in progress.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.05;
    utterance.onerror = (event) => {
      console.error(`voiceFeedback: failed to speak "${message}" (${event.error})`);
    };
    window.speechSynthesis.speak(utterance);
  }

  function reset() {
    lastSpokenAt.clear();
  }

  return { speak, reset, supported };
}