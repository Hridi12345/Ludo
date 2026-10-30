/**
 * Ludo Sound Effects System using Web Audio API
 * 100% self-contained, no external audio assets required.
 */
class LudoAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    setMute(isMuted) {
        this.muted = isMuted;
    }

    // Short wooden/plastic token hop sound
    playStep() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // Dice roll rattle sound
    playDiceRoll() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const duration = 0.45;
        const now = this.ctx.currentTime;

        // Simulate rattling clicks
        for (let i = 0; i < 7; i++) {
            const t = now + i * 0.05 + Math.random() * 0.02;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(200 + Math.random() * 400, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.03);

            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.03);
        }
    }

    // Token out of yard sound
    playSpawn() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.18);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Capture opponent token sound
    playCapture() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Impact punch
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.exponentialRampToValueAtTime(60, now + 0.25);

        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // Slide whistle effect
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, now + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(150, now + 0.35);

        gain2.gain.setValueAtTime(0.2, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);
    }

    // Reached home sound
    playHome() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const t = now + idx * 0.09;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.28);
        });
    }

    // Winner celebration fanfare
    playWin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [
            { f: 523.25, d: 0.15, p: 0.0 },  // C5
            { f: 523.25, d: 0.15, p: 0.18 }, // C5
            { f: 523.25, d: 0.15, p: 0.36 }, // C5
            { f: 659.25, d: 0.3,  p: 0.54 }, // E5
            { f: 587.33, d: 0.15, p: 0.88 }, // D5
            { f: 783.99, d: 0.5,  p: 1.05 }  // G5
        ];

        const now = this.ctx.currentTime;

        notes.forEach(n => {
            const t = now + n.p;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, t);

            gain.gain.setValueAtTime(0.28, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + n.d);
        });
    }

    // Soft chime for player turn switch
    playTurnAlert() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }
}

window.ludoAudio = new LudoAudio();

