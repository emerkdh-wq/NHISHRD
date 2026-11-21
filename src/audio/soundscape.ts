class SansaSoundscape {
  private ctx: AudioContext | null = null;
  private isAmbientRunning = false;
  private masterGain: GainNode | null = null;
  private windNode: AudioNode | null = null;
  private chimeTimer: number | null = null;
  private muted = true;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.45;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, now, 0.25);

    if (!muted && !this.isAmbientRunning) {
      this.startAmbient();
    }
  }

  public getMuted(): boolean {
    return this.muted;
  }

  private startAmbient(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isAmbientRunning) return;
    this.isAmbientRunning = true;

    // Gentle filtered brown/pink wind breeze
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 340;
    filter.Q.value = 1.2;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.value = 0.18;

    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.windNode = noise;

    // Schedule delicate temple wind-chime (풍경) notes
    const scheduleChime = () => {
      if (!this.isAmbientRunning) return;
      if (!this.muted) {
        this.playWindChime(0.08);
      }
      this.chimeTimer = window.setTimeout(scheduleChime, 5500 + Math.random() * 7500);
    };
    this.chimeTimer = window.setTimeout(scheduleChime, 2200);
  }

  public playWindChime(volume = 0.12): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // Pentatonic calm frequencies (D5, E5, G5, A5, B5, D6)
    const freqs = [587.33, 659.25, 783.99, 880.0, 987.77, 1174.66];
    const base = freqs[Math.floor(Math.random() * freqs.length)];
    const now = ctx.currentTime;

    [1, 2.02, 3.01].forEach((mult, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * mult, now);

      const amp = volume / (idx + 1.2);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(amp, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8 - idx * 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 3.0);
    });
  }

  public playTempleBell(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.muted) {
      // Unmute softly if user explicitly strikes the temple bell
      this.setMuted(false);
    }

    const now = ctx.currentTime;
    // Rich Korean bronze bell harmonic series with slow beating
    const partials = [
      { freq: 146.83, amp: 0.32, decay: 6.5 },
      { freq: 147.65, amp: 0.24, decay: 6.2 },
      { freq: 293.66, amp: 0.16, decay: 4.8 },
      { freq: 440.0, amp: 0.1, decay: 3.6 },
      { freq: 587.33, amp: 0.06, decay: 2.5 },
      { freq: 881.2, amp: 0.03, decay: 1.6 },
    ];

    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(p.amp, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + p.decay + 0.1);
    });
  }

  public playSoftKick(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.11);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public dispose(): void {
    this.isAmbientRunning = false;
    if (this.chimeTimer !== null) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    if (this.windNode && 'stop' in this.windNode) {
      try {
        (this.windNode as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundscape = new SansaSoundscape();
