// Authentic Steam Locomotive Train Audio Synthesizer (Web Audio API)
// Produces rhythmic "Çuf-Çuf-Çuf-Çuf" steam cylinder exhausts, "Tak-Tak" rail joint clatter,
// deep boiler rumble, brake shoe screech, and dual-chime steam whistle.
class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;

    // Continuous nodes
    this.noiseBuffer = null;
    this.boilerOsc = null;
    this.boilerGain = null;
    this.windGain = null;
    this.windFilter = null;
    this.brakeGain = null;
    this.brakeFilter = null;

    // Rhythmic Steam Chug ("Çuf-Çuf") & Rail Joint ("Tak-Tak") state
    this.chugTimer = 0;
    this.chugStep = 0;
    this.clackTimer = 0;
    this.lastUpdateTime = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      // Shared 2-second rich noise buffer for steam chugs, wind, and brakes
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Warm pink-tinted noise for realistic steam texture
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        output[i] = (b0 + b1 + b2 + white * 0.18) * 1.6;
      }

      this.setupBoilerRumble();
      this.setupWindSound();
      this.setupBrakeSound();

      this.lastUpdateTime = performance.now();
      this.initialized = true;
      const prompt = document.getElementById('audio-prompt');
      if (prompt) prompt.style.opacity = '0';
    } catch (e) {
      console.warn("Web Audio could not be initialized:", e);
    }
  }

  // Deep warm steam boiler pressure rumble
  setupBoilerRumble() {
    this.boilerOsc = this.ctx.createOscillator();
    this.boilerOsc.type = 'triangle';
    this.boilerOsc.frequency.setValueAtTime(38, this.ctx.currentTime);

    this.boilerFilter = this.ctx.createBiquadFilter();
    this.boilerFilter.type = 'lowpass';
    this.boilerFilter.frequency.setValueAtTime(85, this.ctx.currentTime);

    this.boilerGain = this.ctx.createGain();
    this.boilerGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.boilerOsc.connect(this.boilerFilter);
    this.boilerFilter.connect(this.boilerGain);
    this.boilerGain.connect(this.compressor);
    this.boilerOsc.start();
  }

  setupWindSound() {
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = this.noiseBuffer;
    whiteNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.compressor);
    whiteNoise.start();
  }

  setupBrakeSound() {
    const brakeNoise = this.ctx.createBufferSource();
    brakeNoise.buffer = this.noiseBuffer;
    brakeNoise.loop = true;

    this.brakeFilter = this.ctx.createBiquadFilter();
    this.brakeFilter.type = 'bandpass';
    this.brakeFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    this.brakeFilter.Q.setValueAtTime(7, this.ctx.currentTime);

    this.brakeGain = this.ctx.createGain();
    this.brakeGain.gain.setValueAtTime(0, this.ctx.currentTime);

    brakeNoise.connect(this.brakeFilter);
    this.brakeFilter.connect(this.brakeGain);
    this.brakeGain.connect(this.compressor);
    brakeNoise.start();
  }

  // Trigger a single Steam Cylinder Exhaust Puff ("Çuf!")
  triggerSteamChug(normSpeed, isAccentBeat) {
    if (!this.initialized || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // Chug duration shortens as the train speeds up
    const duration = Math.max(0.065, 0.20 - normSpeed * 0.11);

    // 1. Breathy Steam Exhaust Noise Burst
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    // Start at a random offset in the noise buffer so every puff is organic
    const offset = Math.random() * 1.5;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = isAccentBeat ? (240 + normSpeed * 180) : (190 + normSpeed * 150);
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, now + duration);
    filter.Q.setValueAtTime(1.4, now);

    const chugGain = this.ctx.createGain();
    const peakVol = (isAccentBeat ? 0.30 : 0.21) * Math.min(1.0, 0.45 + normSpeed * 0.7);
    chugGain.gain.setValueAtTime(0.001, now);
    chugGain.gain.linearRampToValueAtTime(peakVol, now + duration * 0.18);
    chugGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSrc.connect(filter);
    filter.connect(chugGain);
    chugGain.connect(this.compressor);

    noiseSrc.start(now, offset, duration + 0.02);
    noiseSrc.stop(now + duration + 0.02);

    // 2. Low-End Piston Thump ("Bom-Çuf")
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'sine';
    const startPitch = isAccentBeat ? 82 : 68;
    thumpOsc.frequency.setValueAtTime(startPitch, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(32, now + duration * 0.75);

    const thumpVol = (isAccentBeat ? 0.22 : 0.14) * Math.min(1.0, 0.4 + normSpeed * 0.6);
    thumpGain.gain.setValueAtTime(thumpVol, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.compressor);
    thumpOsc.start(now);
    thumpOsc.stop(now + duration * 0.85);
  }

  // Trigger a double metallic rail joint click-clack ("Tak-Tak!")
  triggerRailClack(normSpeed) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Two wheel bogies hitting the rail joint in quick succession
    const gap = Math.max(0.045, 0.11 - normSpeed * 0.055);
    [0, gap].forEach((delay, idx) => {
      const t = now + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(idx === 0 ? 520 : 460, t);
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.03);

      const vol = (idx === 0 ? 0.09 : 0.07) * Math.min(1.0, normSpeed * 1.2);
      gain.gain.setValueAtTime(Math.max(0.002, vol), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(t);
      osc.stop(t + 0.035);
    });
  }

  update(speedKmh, isBraking, gForceRatio) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const nowMs = performance.now();
    const dt = Math.min((nowMs - this.lastUpdateTime) / 1000, 0.1);
    this.lastUpdateTime = nowMs;

    const now = this.ctx.currentTime;
    const normSpeed = Math.min(speedKmh / 160, 1.2);

    // 1. Rhythmic Steam Train "Çuf-Çuf-Çuf-Çuf" Generator
    if (speedKmh > 1.5) {
      // Chug rate scales with wheel rotation speed (2.2 Hz at slow crawl up to 11.5 Hz at full speed)
      const chugsPerSec = 2.2 + normSpeed * 9.2;
      this.chugTimer += dt * chugsPerSec;
      if (this.chugTimer >= 1.0) {
        this.chugTimer -= 1.0;
        const isAccent = (this.chugStep % 4 === 0);
        this.triggerSteamChug(normSpeed, isAccent);
        this.chugStep = (this.chugStep + 1) % 4;
      }

      // 2. Rail Joint "Tak-Tak ... Tak-Tak" Clatter
      const clacksPerSec = 0.65 + normSpeed * 2.4;
      this.clackTimer += dt * clacksPerSec;
      if (this.clackTimer >= 1.0) {
        this.clackTimer -= 1.0;
        this.triggerRailClack(normSpeed);
      }
    } else {
      this.chugTimer = 0;
      this.clackTimer = 0;
    }

    // 3. Warm Boiler Bass Rumble
    if (this.boilerOsc && this.boilerGain) {
      const targetFreq = 34 + normSpeed * 28;
      this.boilerOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
      const targetVol = speedKmh > 1 ? (0.045 + normSpeed * 0.085) : 0.018;
      this.boilerGain.gain.setTargetAtTime(targetVol, now, 0.08);
    }

    // 4. High-altitude Wind Whoosh
    if (this.windGain) {
      const windVol = Math.max(0.005, (normSpeed - 0.22) * 0.16);
      this.windGain.gain.setTargetAtTime(windVol, now, 0.12);
      this.windFilter.frequency.setTargetAtTime(280 + normSpeed * 650, now, 0.15);
    }

    // 5. Iron Brake Shoe Screech on Rails
    if (this.brakeGain) {
      let screech = 0;
      if (isBraking && speedKmh > 15) {
        screech = Math.min((speedKmh / 100) * 0.22, 0.30);
      } else if (gForceRatio > 0.65) {
        screech = (gForceRatio - 0.65) * 0.4;
      }
      this.brakeGain.gain.setTargetAtTime(screech, now, 0.08);
    }
  }

  // Thrilling aerial jump whoosh + steam release (does NOT mute engine/boiler gains)
  playFlightWhoosh() {
    if (!this.initialized || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(920, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.85);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.85);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);
    noise.start(now, 0, 0.9);
    noise.stop(now + 0.9);
  }

  // Classic Dual-Chime Steam Train Whistle (Buharlı Tren Düdüğü)
  playTrainWhistle() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    [493.88, 659.25, 739.99].forEach((freq, idx) => { // B4, E5, F#5 rich steam chord
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq - 12, now);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.09);
      osc.frequency.setValueAtTime(freq, now + 0.45);
      osc.frequency.linearRampToValueAtTime(freq - 25, now + 0.75);

      const amp = idx === 0 ? 0.14 : 0.11;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.08);
      gain.gain.setValueAtTime(amp, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(now);
      osc.stop(now + 0.76);
    });
  }

  // Question Success Chime (Doğru Cevap Zili)
  playSuccessChime() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  playDangerBeep() {
    if (!this.initialized || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.compressor);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playCrashSound() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.boilerGain) this.boilerGain.gain.setValueAtTime(0, now);
    if (this.windGain) this.windGain.gain.setValueAtTime(0, now);
    if (this.brakeGain) this.brakeGain.gain.setValueAtTime(0, now);

    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 0.7);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.compressor);
    noise.start();

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.9);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.compressor);
    subOsc.start();
    subOsc.stop(now + 1.0);
  }

  playVictorySound() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }
}

window.AudioManager = AudioManager;
