/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Lazy initialized on first interaction due to browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Plays a mechanical keyboard click sound
  public playKeyPress() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      // Low pass filter to make it sound like a mechanical switch click
      const filter = this.ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.Q.setValueAtTime(5, this.ctx.currentTime);

      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);

      osc.type = 'triangle';
      // Pitch randomized slightly to make it sound natural
      const pitch = 400 + Math.random() * 200;
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

      // Exponential decay envelope
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Failed to play sound:", e);
    }
  }

  // Plays an error buzz
  public playError() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Failed to play sound:", e);
    }
  }

  // Plays a beautiful complete notification
  public playComplete() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Play a beautiful chord progression (C major triad feel)
      const playTone = (freq: number, start: number, duration: number, vol: number) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.ctx.destination);
        
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, start);
        
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(vol, start + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        o.start(start);
        o.stop(start + duration + 0.1);
      };

      playTone(523.25, now, 0.4, 0.1); // C5
      playTone(659.25, now + 0.1, 0.4, 0.1); // E5
      playTone(783.99, now + 0.2, 0.6, 0.1); // G5
      playTone(1046.50, now + 0.3, 0.8, 0.12); // C6
    } catch (e) {
      console.warn("Failed to play sound:", e);
    }
  }
}

export const sounds = new SoundEffects();
