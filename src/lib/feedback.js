// Feedback utilisateur : sons générés via Web Audio + vibrations courtes.
// Tout est opt-in (settings.sound, settings.haptic) et silencieux si non supporté.

let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
}

function beep({ freq = 880, duration = 0.12, type = 'sine', gain = 0.06 } = {}) {
  const c = getCtx();
  if (!c) return;
  // Reprise après une pause d'inactivité (politique autoplay).
  if (c.state === 'suspended') c.resume?.();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  // Fade-out doux pour éviter le clic
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const sound = {
  ok() {
    beep({ freq: 880, duration: 0.1, type: 'sine' });
    setTimeout(() => beep({ freq: 1320, duration: 0.12, type: 'sine' }), 70);
  },
  fail() {
    beep({ freq: 220, duration: 0.18, type: 'triangle', gain: 0.07 });
  },
  tap() {
    beep({ freq: 660, duration: 0.04, type: 'sine', gain: 0.04 });
  },
};

export function vibrate(pattern = 25) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}
