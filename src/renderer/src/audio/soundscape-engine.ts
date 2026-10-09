export type SoundscapeType = 'rain' | 'alpha_waves' | 'white_noise' | 'off';

export class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: SoundscapeType = 'alpha_waves';
  private targetVolume = 0.5; // 0.0 - 1.0
  private isCurrentlyPlaying = false;
  private activeNodes: { stop: () => void }[] = [];

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setSoundscape(type: SoundscapeType): void {
    const wasPlaying = this.isCurrentlyPlaying;
    if (wasPlaying) {
      this.stop();
    }
    this.currentType = type;
    if (wasPlaying && type !== 'off') {
      this.play();
    }
  }

  public getSoundscape(): SoundscapeType {
    return this.currentType;
  }

  public setVolume(volumeRatio: number): void {
    this.targetVolume = Math.max(0, Math.min(1, volumeRatio));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.targetVolume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.targetVolume;
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  public play(): void {
    if (this.currentType === 'off') return;
    if (this.isCurrentlyPlaying) return;

    try {
      const ctx = this.getAudioContext();
      this.masterGain = ctx.createGain();
      // Smooth fade-in
      this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.targetVolume, ctx.currentTime + 1.2);
      this.masterGain.connect(ctx.destination);

      this.activeNodes = [];

      if (this.currentType === 'alpha_waves') {
        this.generateAlphaWaves(ctx, this.masterGain);
      } else if (this.currentType === 'rain') {
        this.generateRainAmbience(ctx, this.masterGain);
      } else if (this.currentType === 'white_noise') {
        this.generateWhiteNoise(ctx, this.masterGain);
      }

      this.isCurrentlyPlaying = true;
    } catch (err) {
      console.warn('[SoundscapeEngine] Could not start audio synthesis:', err);
    }
  }

  public stop(): void {
    if (!this.isCurrentlyPlaying || !this.ctx || !this.masterGain) return;

    try {
      const ctx = this.ctx;
      const gain = this.masterGain;
      // Smooth fade-out over 600ms
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      const nodesToStop = [...this.activeNodes];
      this.activeNodes = [];

      setTimeout(() => {
        for (const node of nodesToStop) {
          try {
            node.stop();
          } catch {
            // Ignore
          }
        }
        try {
          gain.disconnect();
        } catch {
          // Ignore
        }
      }, 650);

      this.isCurrentlyPlaying = false;
    } catch (err) {
      console.warn('[SoundscapeEngine] Could not stop audio:', err);
      this.isCurrentlyPlaying = false;
    }
  }

  private generateAlphaWaves(ctx: AudioContext, destination: GainNode): void {
    // Carrier oscillator 216Hz + 226Hz (10Hz Alpha differential)
    const baseFreq = 216;
    const beatOffset = 10;

    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(baseFreq + beatOffset, ctx.currentTime);

    const merger = ctx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.18, ctx.currentTime);
    merger.connect(subGain);
    subGain.connect(destination);

    oscLeft.start();
    oscRight.start();

    this.activeNodes.push({
      stop: () => {
        oscLeft.stop();
        oscRight.stop();
      },
    });
  }

  private generateRainAmbience(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise generation
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Lowpass filter simulating raindrops through atmosphere
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(destination);
    whiteNoise.start();

    this.activeNodes.push({
      stop: () => {
        whiteNoise.stop();
      },
    });
  }

  private generateWhiteNoise(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.Q.setValueAtTime(0.5, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(destination);
    whiteNoise.start();

    this.activeNodes.push({
      stop: () => {
        whiteNoise.stop();
      },
    });
  }

  public playChime(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.15); // B5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (err) {
      console.warn('[SoundscapeEngine] Could not play chime:', err);
    }
  }
}

export const globalSoundscape = new SoundscapeEngine();
