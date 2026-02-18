import { globals } from '../utils/global.js';
import { Input } from '../utils/input.js';
import { Assets } from '../utils/assets.js';
import { AudioEngine } from '../utils/audio.js';

export default class BeatGame {
    constructor() {
        this.state = 'WAITING';
        this.notes = [];
        this.keys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
        this.laneWidth = 100;
        const startX = (globals.w - (this.laneWidth * 4)) / 2 + (this.laneWidth/2);
        this.lanes = [startX, startX + this.laneWidth, startX + this.laneWidth*2, startX + this.laneWidth*3];
        this.laneEffects = [0, 0, 0, 0];
        this.score = 0;
        this.hype = 100;
        this.level = 1;
        this.bpm = 128;
        this.speed = 300; 
        this.startTime = 0;
        this.hitY = globals.h - 100;
        this.judgements = { perfect: 50, good: 100, ok: 150 };
        
        window.gameManager.showOverlay('START', 'BEAT.IO', 'Music: Time Circles<br>Keys: D F J K', () => this.start());
    }

    start() {
        this.state = 'PLAYING';
        AudioEngine.startMusic();
        this.startTime = Date.now();
        this.generateMap();
    }

    destroy() { AudioEngine.stopMusic(); }

    generateMap() {
        const beatInterval = 60000 / this.bpm;
        for(let i=0; i<300; i++) {
            if(Math.random() > 0.4) {
                this.notes.push({ time: (i * beatInterval) + 2000, lane: Math.floor(Math.random()*4), hit: false });
            }
        }
    }

    update() {
        if (this.state !== 'PLAYING') return;
        const timeElapsed = (Date.now() - this.startTime);
        this.laneEffects = this.laneEffects.map(e => Math.max(0, e - 0.1));

        this.keys.forEach((k, i) => {
            if(Input.keys[k]) {
                Input.keys[k] = false; 
                this.laneEffects[i] = 1; 
                this.checkHit(i, timeElapsed);
            }
        });

        this.notes.forEach(n => {
            if(!n.hit && n.time < timeElapsed - this.judgements.ok) {
                n.hit = true; 
                this.hype -= 10;
                this.showFeedback("MISS", "#ff3838");
                if(this.hype <= 0) {
                    AudioEngine.stopMusic();
                    window.gameManager.showOverlay('END', 'FAILED', '', ()=>window.gameManager.restart());
                    this.state = 'DEAD';
                }
            }
        });

        document.getElementById('scoreDisplay').innerText = "SCORE: " + this.score;
        this.level = 1 + Math.floor(timeElapsed / 15000);
        document.getElementById('levelDisplay').innerText = "LVL: " + this.level;
        
        if(this.level > 1 && AudioEngine.musicEl.playbackRate === 1) {
            AudioEngine.setRate(1.1);
            window.gameManager.showFloatingMessage("SPEED UP!", "#00ffe1");
        }
    }

    checkHit(lane, time) {
        const hitWindow = this.judgements.ok; 
        const target = this.notes.find(n => n.lane === lane && !n.hit && Math.abs(n.time - time) < hitWindow);
        
        if(target) {
            const diff = Math.abs(target.time - time);
            let scoreAdd = 100;
            let feedback = "OK";
            let color = "#00b894";

            if (diff < this.judgements.perfect) {
                scoreAdd = 300; feedback = "PERFECT"; color = "#f1c40f"; 
            } else if (diff < this.judgements.good) {
                scoreAdd = 200; feedback = "GOOD"; color = "#0984e3"; 
            }

            target.hit = true;
            this.score += scoreAdd;
            this.hype = Math.min(100, this.hype+5);
            AudioEngine.playSFX('hit');
            this.showFeedback(feedback, color);
        }
    }

    showFeedback(text, color) {
        const el = document.getElementById('feedbackMessage');
        el.innerText = text;
        el.style.color = color;
        el.style.opacity = 1;
        el.style.transform = 'translate(-50%, -50%) scale(1.2)';
        setTimeout(() => {
            el.style.opacity = 0;
            el.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 1000);
    }

    draw() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const ctx = globals.ctx;
        
        this.lanes.forEach((x, i) => {
            ctx.fillStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
            ctx.fillRect(x - this.laneWidth/2 + 2, 0, this.laneWidth - 4, globals.h);
            ctx.strokeStyle = isLight ? 'rgba(0, 150, 150, 0.2)' : 'rgba(0, 255, 225, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x - this.laneWidth/2, 0); ctx.lineTo(x - this.laneWidth/2, globals.h); ctx.stroke();

            if (this.laneEffects[i] > 0) {
                ctx.shadowBlur = 20; ctx.shadowColor = '#00ffe1';
                ctx.fillStyle = `rgba(0, 255, 225, ${this.laneEffects[i] * 0.5})`;
                ctx.fillRect(x - this.laneWidth/2, 0, this.laneWidth, globals.h);
                ctx.shadowBlur = 0;
            }
        });

        ctx.shadowBlur = 10; ctx.shadowColor = isLight ? '#333' : '#fff'; ctx.strokeStyle = isLight ? '#333' : '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(this.lanes[0] - this.laneWidth/2, this.hitY);
        ctx.lineTo(this.lanes[3] + this.laneWidth/2, this.hitY); ctx.stroke(); ctx.shadowBlur = 0;

        if (this.state !== 'PLAYING') return;
        const timeElapsed = (Date.now() - this.startTime);

        this.notes.forEach(n => {
            if(n.hit) return;
            const y = this.hitY - (n.time - timeElapsed)/1000 * this.speed;
            if(y > -50 && y < globals.h) ctx.drawImage(Assets.note, this.lanes[n.lane]-24, y-24, 48, 48);
        });
        
        const barH = 300;
        ctx.fillStyle = isLight ? '#ccc' : '#333';
        ctx.fillRect(globals.w - 30, globals.h/2 - barH/2, 10, barH);
        const fillH = (this.hype / 100) * barH;
        ctx.fillStyle = this.hype > 30 ? '#00ffe1' : '#ff3838';
        ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(globals.w - 30, globals.h/2 + barH/2 - fillH, 10, fillH);
        ctx.shadowBlur = 0;
    }
}
