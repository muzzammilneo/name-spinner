// Web Audio API procedural sound engine for NameRoll
// High-fidelity mechanical clicks, lock-in thuds, and celebratory chimes without external assets

class SoundEffectsEngine {
  constructor() {
    this.audioCtx = null;
    this.muted = localStorage.getItem('nameroll_sound_muted') === 'true';
    this.volume = 0.85;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('nameroll_sound_muted', muted ? 'true' : 'false');
  }

  isMuted() {
    return this.muted;
  }

  // Realistic mechanical ratchet tick as names pass through the center line
  playTick(velocityRatio = 1) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      // Frequency rises slightly with velocity, capped
      const baseFreq = 700 + Math.min(velocityRatio * 350, 600);
      
      // Dual oscillator click + noise burst
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.035);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.2, t);
      filter.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0.18 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.045);
    } catch (e) {
      // Audio playback fails gracefully if blocked
    }
  }

  // Heavy mechanical latch/lock-in when reel stops
  playLockIn() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;

      // Heavy low thud
      const subOsc = this.audioCtx.createOscillator();
      const subGain = this.audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, t);
      subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      subGain.gain.setValueAtTime(0.4 * this.volume, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      subOsc.connect(subGain);
      subGain.connect(this.audioCtx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.16);

      // Metallic high snap
      const snapOsc = this.audioCtx.createOscillator();
      const snapGain = this.audioCtx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(1200, t);
      snapOsc.frequency.exponentialRampToValueAtTime(320, t + 0.08);

      snapGain.gain.setValueAtTime(0.3 * this.volume, t);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      snapOsc.connect(snapGain);
      snapGain.connect(this.audioCtx.destination);
      snapOsc.start(t);
      snapOsc.stop(t + 0.1);
    } catch (e) {}
  }

  // Celebratory winner chime chord
  playWinnerChime() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      // Sparkling major 9th arpeggio: C5, E5, G5, B5, D6, G6
      const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
      
      notes.forEach((freq, idx) => {
        const startTime = t + (idx * 0.075);
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Shimmering bell tone
        osc.type = idx === notes.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22 * this.volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.25);
      });
    } catch (e) {}
  }

  // Tactile button click
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);

      gain.gain.setValueAtTime(0.12 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }
}

window.soundEngine = new SoundEffectsEngine();
