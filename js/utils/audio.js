export const AudioEngine = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    musicEl: document.getElementById('bgMusic'),
    
    playSFX(type) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        if (type === 'slice') {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.connect(g); g.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
            g.gain.setValueAtTime(0.1, t);
            g.gain.linearRampToValueAtTime(0, t + 0.1);
            osc.start(t); osc.stop(t + 0.1);
        } 
        else if (type === 'boom') {
            const bSize = this.ctx.sampleRate * 0.5;
            const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for(let i=0; i<bSize; i++) data[i] = Math.random()*2-1;
            
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const f = this.ctx.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = 500;
            const g = this.ctx.createGain();
            
            src.connect(f); f.connect(g); g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0.5, t);
            g.gain.exponentialRampToValueAtTime(0.01, t+0.4);
            src.start(t);
        } else if (type === 'hit') {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.connect(g); g.connect(this.ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, t);
            g.gain.setValueAtTime(0.1, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            osc.start(t); osc.stop(t + 0.05);
        }
    },
    
    startMusic(rate = 1.0) {
        if(!this.musicEl) this.musicEl = document.getElementById('bgMusic');
        this.musicEl.currentTime = 0;
        this.musicEl.playbackRate = rate;
        this.musicEl.volume = 0.5;
        // Resume audio context if suspended
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this.musicEl.play().catch(e => console.log("Audio interaction needed"));
            });
        } else {
            this.musicEl.play().catch(e => console.log("Audio interaction needed"));
        }
    },
    stopMusic() {
        if(this.musicEl) this.musicEl.pause();
    },
    setRate(rate) {
        if(this.musicEl) this.musicEl.playbackRate = rate;
    }
};
