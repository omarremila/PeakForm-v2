
const DEFAULT_COOLDOWN_MS = 4000;

export function createVoiceFeedback({ cooldownMs = DEFAULT_COOLDOWN_MS } = {}) {
  const lastSpokenAt = new Map();
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  function speak(code, message) {
    if (!supported) return;

    const now = Date.now();
    const last = lastSpokenAt.get(code) ?? 0;
    if (now - last < cooldownMs) return;
    lastSpokenAt.set(code, now);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  function reset() {
    lastSpokenAt.clear();
  }

  return { speak, reset, supported };
}