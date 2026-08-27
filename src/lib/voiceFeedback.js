// src/lib/voiceFeedback.js

const DEFAULT_COOLDOWN_MS = 4000;

export function createVoiceFeedback({ cooldownMs = DEFAULT_COOLDOWN_MS } = {}) {
  let lastSpokenAt = 0;

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  let warnedNoVoices = false;

  // Call before requesting feedback text, so a rep mid-cooldown never
  // triggers a wasted AI request just to throw the result away.
  function shouldSpeak() {
    return Date.now() - lastSpokenAt >= cooldownMs;
  }

  function speakText(text) {
    if (!supported) return;

    lastSpokenAt = Date.now();

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
    const utterance = new SpeechSynthesisUtterance(text);


    utterance.rate = 1.05;
    utterance.onerror = (event) => {
      console.error(`voiceFeedback: failed to speak "${text}" (${event.error})`);
    };
    window.speechSynthesis.speak(utterance);
  }

  function reset() {
    lastSpokenAt.clear();
    lastSpokenAt = 0;
  }

  return { shouldSpeak, speakText, reset, supported };
}