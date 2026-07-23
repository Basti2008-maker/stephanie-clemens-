// Procedural audio engine — generates a short generative instrumental loop
// per track (kick/hat/bass/lead/pad synthesized live via the Web Audio API)
// so the app has real, functioning playback / crossfade / tempo behaviour
// without using any copyrighted or third-party audio.

const PATTERNS = {
  "fourfloor":      { kick: [0,4,8,12],  hat: [2,6,10,14], bass: [0,8],    lead: [0,2,4,6,8,10,12,14], pad: false },
  "fourfloor-light":{ kick: [0,8],       hat: [4,12],      bass: [0,8],    lead: [0,4,8,12],           pad: false },
  "boombap":        { kick: [0,10],      hat: [2,6,10,14], bass: [0,6,10], lead: [0,8],                pad: false },
  "boombap-soft":   { kick: [0,10],      hat: [6,14],      bass: [0,10],   lead: [0,8],                pad: true  },
  "rockbeat":       { kick: [0,8],       hat: [2,4,6,10,12,14], bass: [0,4,8,12], lead: [0,4,8,12],    pad: false },
  "rockbeat-soft":  { kick: [0,8],       hat: [4,12],      bass: [0,8],    lead: [0,8],                pad: true  },
  "chill-lofi":     { kick: [0],         hat: [4,12],      bass: [0],      lead: [2,6,10,14],          pad: true  },
  "ambient-none":   { kick: [],          hat: [],          bass: [0],      lead: [6,14],               pad: true  },
};

const SCALES = {
  major: [0, 4, 7, 12, 16, 19, 24],
  minor: [0, 3, 7, 12, 15, 19, 24],
};

function semi(freq, n) { return freq * Math.pow(2, n / 12); }

class Voice {
  constructor(ctx, track, outputNode) {
    this.ctx = ctx;
    this.track = track;
    this.energyMod = track.energy;
    this.tempoScale = 1;
    this.leadStepCursor = 0;
    this.stepsPerBar = 16;
    this.stepIndex = 0;
    this.lookahead = 0.12; // seconds scheduled ahead
    this.tickMs = 30;
    this.nextStepTime = 0;
    this.running = false;
    this.timer = null;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0.0001;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 1200;
    this.filter.connect(this.gain);
    this.gain.connect(outputNode);

    this.noiseBuffer = Voice.getNoiseBuffer(ctx);
  }

  static getNoiseBuffer(ctx) {
    if (!Voice._noiseBuffer || Voice._noiseCtx !== ctx) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      Voice._noiseBuffer = buf;
      Voice._noiseCtx = ctx;
    }
    return Voice._noiseBuffer;
  }

  get baseStepDur() {
    return (60 / this.track.tempoBpm / 4) * this.tempoScale;
  }

  start(fadeInSec = 1.2) {
    this.running = true;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(0.0001, now);
    this.gain.gain.exponentialRampToValueAtTime(0.85, now + fadeInSec);
    this._tick();
    this.timer = setInterval(() => this._tick(), this.tickMs);
  }

  stop(fadeOutSec = 1.0) {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(Math.max(this.gain.gain.value, 0.001), now);
    this.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutSec);
    setTimeout(() => { try { this.filter.disconnect(); this.gain.disconnect(); } catch (e) {} }, (fadeOutSec + 0.2) * 1000);
  }

  setGain(target, rampSec = 0.05) {
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(Math.max(this.gain.gain.value, 0.0001), now);
    this.gain.gain.exponentialRampToValueAtTime(Math.max(target, 0.0001), now + rampSec);
  }

  setEnergyMod(value) { this.energyMod = Math.max(0, Math.min(1, value)); }
  setTempoScale(value) { this.tempoScale = Math.max(0.5, Math.min(1.5, value)); }

  _tick() {
    while (this.nextStepTime < this.ctx.currentTime + this.lookahead) {
      this._scheduleStep(this.stepIndex, this.nextStepTime);
      this.nextStepTime += this.baseStepDur;
      this.stepIndex = (this.stepIndex + 1) % this.stepsPerBar;
    }
  }

  _scheduleStep(step, time) {
    const pattern = PATTERNS[this.track.pattern] || PATTERNS["fourfloor-light"];
    const energy = this.energyMod;
    this.filter.frequency.setValueAtTime(300 + energy * 4200, time);

    if (pattern.kick.includes(step)) this._kick(time, energy);
    if (pattern.hat.includes(step)) this._hat(time, energy);
    if (pattern.bass.includes(step)) this._bass(time, energy);
    if (pattern.lead.includes(step)) this._lead(time, energy);
    if (pattern.pad && step === 0 && this.stepIndex === 0) this._pad(time);
  }

  _env(gainNode, time, attack, decay, peak, release, sustain = 0.0001) {
    const g = gainNode.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(0.0001, time);
    g.exponentialRampToValueAtTime(peak, time + attack);
    g.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), time + attack + decay);
    if (release) g.exponentialRampToValueAtTime(0.0001, time + attack + decay + release);
  }

  _kick(time, energy) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);
    this._env(g, time, 0.001, 0.16, 0.9 * (0.5 + energy * 0.5), 0.05);
    osc.connect(g).connect(this.filter);
    osc.start(time); osc.stop(time + 0.3);
  }

  _hat(time, energy) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    const dur = 0.03 + energy * 0.03;
    this._env(g, time, 0.001, dur, 0.25 * (0.4 + energy * 0.6), 0.01);
    src.connect(hp).connect(g).connect(this.filter);
    src.start(time); src.stop(time + dur + 0.05);
  }

  _bass(time, energy) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = energy > 0.6 ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(this.track.rootFreq / 2, time);
    const dur = this.baseStepDur * 3.6;
    this._env(g, time, 0.005, dur * 0.7, 0.55, dur * 0.3);
    osc.connect(g).connect(this.filter);
    osc.start(time); osc.stop(time + dur + 0.1);
  }

  _lead(time, energy) {
    const scale = SCALES[this.track.mode] || SCALES.major;
    const degree = scale[this.leadStepCursor % scale.length];
    this.leadStepCursor++;
    const freq = semi(this.track.rootFreq, degree);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = energy > 0.75 ? "square" : energy < 0.3 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, time);
    const dur = this.baseStepDur * 1.8;
    this._env(g, time, 0.01, dur * 0.6, 0.32 * (0.5 + energy * 0.5), dur * 0.5);
    osc.connect(g).connect(this.filter);
    osc.start(time); osc.stop(time + dur + 0.2);
  }

  _pad(time) {
    const scale = SCALES[this.track.mode] || SCALES.major;
    const chordSemis = [scale[0], scale[1] !== undefined ? scale[1] - 1 : 3, scale[2] || 7];
    const dur = this.baseStepDur * this.stepsPerBar * 3.8;
    chordSemis.forEach((s) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(semi(this.track.rootFreq / 2, s), time);
      this._env(g, time, 1.2, dur * 0.5, 0.14, dur * 0.4);
      osc.connect(g).connect(this.filter);
      osc.start(time); osc.stop(time + dur + 1);
    });
  }
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.voices = [];
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  /** Plays a track, crossfading out whatever was previously playing. */
  playTrack(track, { crossfadeSec = 1.2 } = {}) {
    this.ensureContext();
    const prevVoices = this.voices;
    const voice = new Voice(this.ctx, track, this.master);
    voice.start(crossfadeSec);
    this.voices = [voice];
    prevVoices.forEach((v) => v.stop(crossfadeSec));
    return voice;
  }

  crossfadeTo(track, seconds = 4) {
    return this.playTrack(track, { crossfadeSec: seconds });
  }

  stopAll(fadeSec = 0.8) {
    this.voices.forEach((v) => v.stop(fadeSec));
    this.voices = [];
  }

  get current() { return this.voices[this.voices.length - 1] || null; }

  setEnergyMod(value) { this.voices.forEach((v) => v.setEnergyMod(value)); }
  setTempoScale(value) { this.voices.forEach((v) => v.setTempoScale(value)); }

  pauseAll() { if (this.ctx) this.ctx.suspend(); }
  resumeAll() { if (this.ctx) this.ctx.resume(); }
}

const audioEngine = new AudioEngine();
