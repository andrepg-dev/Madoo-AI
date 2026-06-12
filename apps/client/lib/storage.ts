const SOUND_PREF_KEY = "madoo.sound.pref";

export type SoundPref = "soft" | "bright" | "silent";

export function readSoundPref(): SoundPref {
  if (typeof window === "undefined") return "soft";
  const raw = window.localStorage.getItem(SOUND_PREF_KEY);
  return raw === "bright" || raw === "silent" ? raw : "soft";
}

export function saveSoundPref(pref: SoundPref) {
  window.localStorage.setItem(SOUND_PREF_KEY, pref);
}

export function playCompletionSound() {
  if (typeof window === "undefined") return;
  const pref = readSoundPref();
  if (pref === "silent") return;

  const audioWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextCtor = window.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(pref === "bright" ? 740 : 520, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      pref === "bright" ? 980 : 620,
      now + 0.12,
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
    oscillator.onended = () => void context.close();
  } catch {
    // Browsers can block AudioContext until user gesture; ignore quietly.
  }
}
