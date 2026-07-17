// SFX — SOLUTION TEMPORAIRE clairement identifiée (voir docs/ASSETS.md).
// Aucun fichier audio de SFX n'existe dans le projet : ce module synthétise
// des sons courts via WebAudio. Dès que des fichiers .ogg/.mp3 sont déposés
// dans public/assets/sfx/ avec les clés ci-dessous, Phaser les charge et ce
// synthétiseur n'est plus utilisé pour ces clés (voir BattleScene/Exploration).
//
// Clés attendues : attack, hit, crit, heal, defend, special, death, enrage,
// victory, defeat, menu_click, step, interact, save, telegraph, summon, item.

let ctx: AudioContext | null = null;
let masterVolume = 0.5;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setSfxVolume(v: number) { masterVolume = Math.max(0, Math.min(1, v)); }
export function getSfxVolume() { return masterVolume; }
export function setSfxMuted(m: boolean) { muted = m; }

interface ToneSpec {
  freq: number;
  endFreq?: number;
  type?: OscillatorType;
  duration: number;     // secondes
  volume?: number;
  delay?: number;
  noise?: boolean;      // souffle (bruit blanc filtré) au lieu d'un oscillateur
}

function play(specs: ToneSpec[]) {
  if (muted || masterVolume <= 0) return;
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  for (const s of specs) {
    const t0 = now + (s.delay ?? 0);
    const gain = c.createGain();
    const vol = (s.volume ?? 0.5) * masterVolume;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + s.duration);
    gain.connect(c.destination);

    if (s.noise) {
      const len = Math.max(1, Math.floor(c.sampleRate * s.duration));
      const buffer = c.createBuffer(1, len, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(s.freq, t0);
      if (s.endFreq) filter.frequency.exponentialRampToValueAtTime(s.endFreq, t0 + s.duration);
      src.connect(filter);
      filter.connect(gain);
      src.start(t0);
      src.stop(t0 + s.duration);
    } else {
      const osc = c.createOscillator();
      osc.type = s.type ?? 'square';
      osc.frequency.setValueAtTime(s.freq, t0);
      if (s.endFreq) osc.frequency.exponentialRampToValueAtTime(s.endFreq, t0 + s.duration);
      osc.connect(gain);
      osc.start(t0);
      osc.stop(t0 + s.duration);
    }
  }
}

// Bibliothèque de sons synthétisés (8-bit-ish, adaptés au pixel art)
const LIB: Record<string, () => void> = {
  attack: () => play([{ freq: 900, endFreq: 200, type: 'sawtooth', duration: 0.12, volume: 0.35 }]),
  hit: () => play([
    { freq: 150, endFreq: 60, type: 'square', duration: 0.15, volume: 0.5 },
    { freq: 2000, endFreq: 400, noise: true, duration: 0.1, volume: 0.4 },
  ]),
  crit: () => play([
    { freq: 220, endFreq: 55, type: 'square', duration: 0.22, volume: 0.6 },
    { freq: 3000, endFreq: 500, noise: true, duration: 0.18, volume: 0.5 },
    { freq: 1200, endFreq: 2400, type: 'square', duration: 0.1, volume: 0.25, delay: 0.05 },
  ]),
  heal: () => play([
    { freq: 523, type: 'triangle', duration: 0.12, volume: 0.3 },
    { freq: 659, type: 'triangle', duration: 0.12, volume: 0.3, delay: 0.09 },
    { freq: 784, type: 'triangle', duration: 0.2, volume: 0.3, delay: 0.18 },
  ]),
  defend: () => play([{ freq: 300, endFreq: 500, type: 'triangle', duration: 0.18, volume: 0.35 }]),
  special: () => play([
    { freq: 400, endFreq: 1600, type: 'sawtooth', duration: 0.25, volume: 0.3 },
    { freq: 1500, endFreq: 3000, noise: true, duration: 0.2, volume: 0.2, delay: 0.1 },
  ]),
  lightning: () => play([
    { freq: 4000, endFreq: 300, noise: true, duration: 0.25, volume: 0.5 },
    { freq: 120, endFreq: 40, type: 'square', duration: 0.3, volume: 0.4, delay: 0.02 },
  ]),
  fire: () => play([{ freq: 800, endFreq: 200, noise: true, duration: 0.35, volume: 0.45 }]),
  occult: () => play([
    { freq: 200, endFreq: 90, type: 'sawtooth', duration: 0.35, volume: 0.3 },
    { freq: 600, endFreq: 150, noise: true, duration: 0.3, volume: 0.25, delay: 0.04 },
  ]),
  holy: () => play([
    { freq: 660, type: 'triangle', duration: 0.15, volume: 0.3 },
    { freq: 990, type: 'triangle', duration: 0.25, volume: 0.28, delay: 0.08 },
    { freq: 1320, type: 'sine', duration: 0.3, volume: 0.2, delay: 0.14 },
  ]),
  stamp: () => play([
    { freq: 90, endFreq: 40, type: 'square', duration: 0.3, volume: 0.65 },
    { freq: 1000, endFreq: 200, noise: true, duration: 0.15, volume: 0.4 },
  ]),
  papers: () => play([
    { freq: 2500, endFreq: 1200, noise: true, duration: 0.3, volume: 0.3 },
    { freq: 1800, endFreq: 900, noise: true, duration: 0.25, volume: 0.25, delay: 0.12 },
  ]),
  death: () => play([{ freq: 300, endFreq: 40, type: 'sawtooth', duration: 0.6, volume: 0.45 }]),
  enrage: () => play([
    { freq: 80, endFreq: 200, type: 'sawtooth', duration: 0.5, volume: 0.5 },
    { freq: 3000, endFreq: 400, noise: true, duration: 0.5, volume: 0.3, delay: 0.1 },
  ]),
  telegraph: () => play([
    { freq: 440, type: 'square', duration: 0.12, volume: 0.4 },
    { freq: 440, type: 'square', duration: 0.12, volume: 0.4, delay: 0.2 },
    { freq: 554, type: 'square', duration: 0.25, volume: 0.45, delay: 0.4 },
  ]),
  summon: () => play([
    { freq: 150, endFreq: 600, type: 'sawtooth', duration: 0.4, volume: 0.35 },
    { freq: 2000, endFreq: 3500, noise: true, duration: 0.35, volume: 0.2, delay: 0.05 },
  ]),
  victory: () => play([
    { freq: 523, type: 'square', duration: 0.14, volume: 0.35 },
    { freq: 659, type: 'square', duration: 0.14, volume: 0.35, delay: 0.14 },
    { freq: 784, type: 'square', duration: 0.14, volume: 0.35, delay: 0.28 },
    { freq: 1046, type: 'square', duration: 0.4, volume: 0.4, delay: 0.42 },
  ]),
  defeat: () => play([
    { freq: 392, type: 'triangle', duration: 0.3, volume: 0.35 },
    { freq: 330, type: 'triangle', duration: 0.3, volume: 0.35, delay: 0.28 },
    { freq: 262, type: 'triangle', duration: 0.6, volume: 0.4, delay: 0.56 },
  ]),
  menu_click: () => play([{ freq: 880, endFreq: 1100, type: 'square', duration: 0.06, volume: 0.2 }]),
  menu_move: () => play([{ freq: 660, type: 'square', duration: 0.04, volume: 0.15 }]),
  step: () => play([{ freq: 700, endFreq: 250, noise: true, duration: 0.07, volume: 0.12 }]),
  interact: () => play([
    { freq: 587, type: 'triangle', duration: 0.1, volume: 0.3 },
    { freq: 880, type: 'triangle', duration: 0.15, volume: 0.3, delay: 0.08 },
  ]),
  save: () => play([
    { freq: 523, type: 'sine', duration: 0.15, volume: 0.3 },
    { freq: 784, type: 'sine', duration: 0.15, volume: 0.3, delay: 0.12 },
    { freq: 1046, type: 'sine', duration: 0.3, volume: 0.3, delay: 0.24 },
  ]),
  item: () => play([
    { freq: 700, type: 'triangle', duration: 0.1, volume: 0.3 },
    { freq: 1050, type: 'triangle', duration: 0.18, volume: 0.3, delay: 0.09 },
  ]),
  levelup: () => play([
    { freq: 523, type: 'square', duration: 0.1, volume: 0.3 },
    { freq: 659, type: 'square', duration: 0.1, volume: 0.3, delay: 0.1 },
    { freq: 784, type: 'square', duration: 0.1, volume: 0.3, delay: 0.2 },
    { freq: 1046, type: 'square', duration: 0.12, volume: 0.35, delay: 0.3 },
    { freq: 1318, type: 'square', duration: 0.35, volume: 0.4, delay: 0.42 },
  ]),
};

export function playSfx(key: string) {
  LIB[key]?.();
}
