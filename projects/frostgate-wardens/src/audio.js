// WebAudio Synthesizer for 霜門守望 Frostgate Wardens
// High-craft procedural sound design: bow twang, mortar thud, frost chime, bell resonance, coin, hero horn, ambient wind

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.ambientGain = null;
        this.masterGain = null;
        this.initialized = false;
        
        // Restore mute state
        try {
            const savedMute = localStorage.getItem('frostgate_muted');
            if (savedMute !== null) {
                this.muted = savedMute === 'true';
            }
        } catch (e) {}
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.startAmbience();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio init error:', e);
        }
    }

    unlock() {
        if (!this.initialized) {
            this.init();
        } else if (this.ctx && this.ctx.state === 'suspended' && !this.isPaused) {
            this.ctx.resume();
        }
    }

    pause() {
        this.isPaused = true;
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }

    resume() {
        this.isPaused = false;
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        try {
            localStorage.setItem('frostgate_muted', this.muted);
        } catch (e) {}

        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
        }
        return this.muted;
    }

    startAmbience() {
        if (!this.ctx || this.ambientGain) return;
        try {
            // Ambient mountain wind: filtered pink/white noise with slow dual LFO
            const bufferSize = this.ctx.sampleRate * 2;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
                b6 = white * 0.115926;
            }

            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, this.ctx.currentTime);
            filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

            // Slow wind breathing LFO
            const lfo = this.ctx.createOscillator();
            lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

            whiteNoise.connect(filter);
            filter.connect(this.ambientGain);
            this.ambientGain.connect(this.masterGain);

            whiteNoise.start();
            lfo.start();
        } catch (e) {
            console.warn('Ambience start error:', e);
        }
    }

    // --- Sound Effects ---

    playBow() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.setValueAtTime(1.5, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playMortar() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    playFrost() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        // Dual crystal sine chime
        [1046.5, 1567.98].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.03);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.3);

            gain.gain.setValueAtTime(0.22, now + idx * 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + idx * 0.03);
            osc.stop(now + 0.36);
        });
    }

    playBell() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        // Deep bronze campanile bell with harmonics
        const freqs = [330, 660, 990, 1320];
        const weights = [0.4, 0.25, 0.15, 0.08];

        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);

            gain.gain.setValueAtTime(weights[idx], now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 1.25);
        });
    }

    playCoin() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        // Bright 2-note cheerful coin clink
        [987.77, 1318.51].forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.07);

            gain.gain.setValueAtTime(0.28, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.2);
        });
    }

    playBuild() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        // Stone placement thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    playHero() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        // Brass war-horn fanfare (C4 - E4 - G4 - C5)
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now + idx * 0.08);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now + idx * 0.08);

            gain.gain.setValueAtTime(0.22, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
        });
    }

    playVictory() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        // Triumphant saffron major progression
        const notes = [392, 523.25, 659.25, 783.99];
        notes.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + idx * 0.14);

            gain.gain.setValueAtTime(0.3, now + idx * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.5);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + idx * 0.14);
            osc.stop(now + idx * 0.14 + 0.55);
        });
    }

    playLeak() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    playDefeat() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        // Solemn minor descent
        const notes = [440, 415.3, 392, 349.23];
        notes.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.18);

            gain.gain.setValueAtTime(0.3, now + idx * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + idx * 0.18);
            osc.stop(now + idx * 0.18 + 0.45);
        });
    }
}

export const sounds = new SoundManager();
