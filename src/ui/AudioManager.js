export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.noiseSource = null;
    this.isStarted = false;
    this.isMuted = false;
    this.muteKey = 'below-ocean-muted';
    this.initMuteState();
    this.attachGlobalListeners();
  }

  initMuteState() {
    const stored = window.localStorage.getItem(this.muteKey);
    this.isMuted = stored === 'true';
  }

  attachGlobalListeners() {
    window.addEventListener('pointerdown', (event) => {
      if (!this.isStarted) {
        this.initializeAudio();
      }
      if (event.target instanceof HTMLElement && event.target.closest('button')) {
        this.playButtonClickSound();
      }
    }, { once: false });
  }

  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.55;
      this.masterGain.connect(this.audioContext.destination);

      const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * 0.18;
      }

      this.noiseSource = this.audioContext.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      const lowpass = this.audioContext.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 720;
      lowpass.Q.value = 1;

      const highpass = this.audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 45;
      highpass.Q.value = 0.8;

      this.noiseSource.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(this.masterGain);
      this.noiseSource.start(0);

      this.isStarted = true;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (error) {
      console.warn('[AudioManager] Unable to initialize audio context:', error);
    }
  }

  setMute(muted) {
    this.isMuted = muted;
    window.localStorage.setItem(this.muteKey, String(muted));
    if (this.masterGain) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0.0 : 0.55, now + 0.4);
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  playButtonClickSound() {
    if (!this.isStarted || this.isMuted || !this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 950;
    gain.gain.value = 0.0;
    osc.connect(gain);
    gain.connect(this.masterGain);
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playBubbleSound() {
    if (!this.isStarted || this.isMuted || !this.audioContext) return;
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.18, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-3.5 * i / data.length);
    }
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const band = this.audioContext.createBiquadFilter();
    band.type = 'highpass';
    band.frequency.value = 700;
    band.Q.value = 1.2;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.24);

    source.connect(band);
    band.connect(gain);
    gain.connect(this.masterGain);
    source.start();
    source.stop(this.audioContext.currentTime + 0.24);
  }
}
