/**
 * Web Audio API synthesizer for realistic Go stone placement click
 * Synthesizes a crisp wooden tap with stone resonance without needing external audio files.
 */

class StoneSoundEngine {
  private audioCtx: AudioContext | null = null;

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playStoneClick() {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // 1. Initial sharp impact 'snap' (bandpassed noise)
      const bufferSize = this.audioCtx.sampleRate * 0.05; // 50ms burst
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3.0, now);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.05);

      // 2. Resonant wood/slate body 'clack' (decaying sine wave)
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();

      osc.type = 'triangle';
      // Pitch varies slightly for natural realism
      const pitch = 380 + (Math.random() * 40 - 20);
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

      oscGain.gain.setValueAtTime(0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(oscGain);
      oscGain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio autoplay policy or unavailable environment fallback gracefully
    }
  }
}

export const stoneSoundEngine = new StoneSoundEngine();
