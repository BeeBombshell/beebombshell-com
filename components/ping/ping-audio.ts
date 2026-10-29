/**
 * components/ping/ping-audio.ts
 * Self-contained Web Audio API synthesizer for mechanical key clicks and send chimes.
 * Requires zero external audio assets, works offline, and has sub-millisecond response latency.
 */

class PingAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true; // Off by default as per spec

  constructor() {
    // AudioContext will be lazily created on the first user interaction
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      // Warm up audio context on user activation
      this.getContext();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Realistic mechanical keyboard switch sound ("thock" / lubed linear switch)
   * Double transient profile:
   * 1. High crisp tactile contact click (metal leaf / stem actuation)
   * 2. Deep acoustic low-mid resonant clack (bottom out against switch housing)
   */
  public playKeyClick(intensity: number = 1) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const pitchVariance = (Math.random() - 0.5) * 40;

      // Component 1: High crisp transient click (tactile actuation snap)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      const snapFilter = ctx.createBiquadFilter();

      snapOsc.type = "sine";
      snapOsc.frequency.setValueAtTime(1400 + pitchVariance * 2, now);
      snapOsc.frequency.exponentialRampToValueAtTime(320, now + 0.008);

      snapFilter.type = "bandpass";
      snapFilter.frequency.setValueAtTime(1800, now);
      snapFilter.Q.setValueAtTime(2.0, now);

      snapGain.gain.setValueAtTime(0.18 * intensity, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      snapOsc.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(ctx.destination);

      snapOsc.start(now);
      snapOsc.stop(now + 0.015);

      // Component 2: Deep switch housing "thock" / bottom-out resonance
      const thockOsc = ctx.createOscillator();
      const thockGain = ctx.createGain();
      const thockFilter = ctx.createBiquadFilter();

      // Deeper initial thump (260Hz -> 85Hz) characteristic of GMK / lubed mechanical switches
      thockOsc.type = "triangle";
      thockOsc.frequency.setValueAtTime(240 + pitchVariance, now + 0.002);
      thockOsc.frequency.exponentialRampToValueAtTime(80, now + 0.038);

      thockFilter.type = "lowpass";
      thockFilter.frequency.setValueAtTime(800, now);
      thockFilter.frequency.exponentialRampToValueAtTime(250, now + 0.04);

      thockGain.gain.setValueAtTime(0.001, now);
      thockGain.gain.linearRampToValueAtTime(0.28 * intensity, now + 0.004);
      thockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

      thockOsc.connect(thockFilter);
      thockFilter.connect(thockGain);
      thockGain.connect(ctx.destination);

      thockOsc.start(now + 0.002);
      thockOsc.stop(now + 0.045);
    } catch {
      // Audio playback best-effort fallback
    }
  }


  /**
   * Send confirmation chime
   * Harmonic 3-note ascending chime (C5 -> E5 -> G5)
   */
  public playSendChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.07;
        const duration = 0.35;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
      });
    } catch {
      // Audio playback best-effort fallback
    }
  }

  /**
   * Clear / Reject shred chirp
   */
  public playRejectSound() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Audio playback best-effort fallback
    }
  }
}

export const pingAudio = new PingAudioSynthesizer();
