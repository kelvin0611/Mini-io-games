import { globals } from '../utils/global.js';
import { Input } from '../utils/input.js';
import { Assets } from '../utils/assets.js';
import { AudioEngine } from '../utils/audio.js';

export default class SliceGame {
    constructor() {
        this.state = 'WAITING'; 
        this.entities = [];
        this.particles = []; 
        this.trail = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gravity = 0.2;
        this.lastSpawn = 0;
        
        window.gameManager.showOverlay('START', 'SLICE.IO', 'Mouse/Touch to slice.<br>Avoid Bombs!', () => this.start());
    }
    
    start() {
        this.state = 'PLAYING';
        this.entities = [];
        this.particles = [];
    }

    destroy() { this.state = 'DEAD'; }

    spawn() {
        if (Date.now() - this.lastSpawn < (1500 - this.level * 100)) return;
        this.lastSpawn = Date.now();

        const isBomb = Math.random() < 0.15 + (this.level * 0.05);
        const size = 30; 
        
        this.entities.push({
            x: globals.w/2 + (Math.random()-0.5) * (globals.w*0.8),
            y: globals.h + 50,
            vx: (Math.random()-0.5) * 6,
            vy: -(Math.random() * 5 + 10),
            type: isBomb ? 'BOMB' : 'FRUIT',
            img: isBomb ? Assets.bomb : (Math.random() > 0.5 ? Assets.fruit_apple : Assets.fruit_banana),
            angle: 0,
            vRot: (Math.random()-0.5)*0.2,
            active: true,
            size: size
        });
    }

    update() {
        if (this.state !== 'PLAYING') return;
        this.level = 1 + Math.floor(this.score / 50);
        document.getElementById('levelDisplay').innerText = "LVL: " + this.level;
        document.getElementById('scoreDisplay').innerText = "SCORE: " + this.score;
        this.spawn();

        this.entities.forEach(e => {
            e.x += e.vx; e.y += e.vy;
            e.vy += this.gravity;
            e.angle += e.vRot;
            if(e.y > globals.h + 60 && e.active) {
                e.active = false;
                if(e.type === 'FRUIT') {
                    this.lives--;
                    window.gameManager.showFloatingMessage("MISS!", "#ff3838");
                    if(this.lives <= 0) window.gameManager.showOverlay('END', 'GAME OVER', '', ()=>window.gameManager.restart());
                }
            }
        });

        if (Input.isDown) this.trail.push({x: Input.x, y: Input.y, t: 10});
        for(let i=this.trail.length-1; i>=0; i--) {
            this.trail[i].t--;
            if(this.trail[i].t <= 0) this.trail.splice(i, 1);
        }

        if (Input.isDown && this.trail.length > 1) {
            const p2 = this.trail[this.trail.length-1];
            this.entities.forEach(e => {
                if(!e.active) return;
                const dist = Math.sqrt(Math.pow(e.x - p2.x, 2) + Math.pow(e.y - p2.y, 2));
                if (dist < e.size * 1.5) {
                    e.active = false;
                    if(e.type === 'BOMB') {
                        AudioEngine.playSFX('boom');
                        window.gameManager.showOverlay('END', 'EXPLODED!', '', ()=>window.gameManager.restart());
                        this.state = 'DEAD';
                    } else {
                        this.score += 10;
                        AudioEngine.playSFX('slice');
                        for (let i = 0; i < 10; i++) {
                            this.particles.push({
                                x: e.x, y: e.y,
                                vx: (Math.random() - 0.5) * 10,
                                vy: (Math.random() - 0.5) * 10,
                                life: 1, size: Math.random() * 5 + 2, color: 'rgba(255, 255, 255, 0.8)'
                            });
                        }
                    }
                }
            });
        }

        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
    }

    draw() {
        this.entities.forEach(e => {
            if(!e.active) return;
            globals.ctx.save();
            globals.ctx.translate(e.x, e.y);
            globals.ctx.rotate(e.angle);
            globals.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            globals.ctx.shadowBlur = 10;
            globals.ctx.drawImage(e.img, -24, -24, 48, 48); 
            globals.ctx.restore();
        });

        globals.ctx.shadowBlur = 15; globals.ctx.shadowColor = '#00ffe1'; globals.ctx.strokeStyle = '#fff'; globals.ctx.lineWidth = 4; globals.ctx.lineCap = 'round';
        globals.ctx.beginPath();
        if(this.trail.length > 0) globals.ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for(let p of this.trail) globals.ctx.lineTo(p.x, p.y);
        globals.ctx.stroke(); globals.ctx.shadowBlur = 0;

        this.particles.forEach(p => {
            globals.ctx.globalAlpha = p.life; globals.ctx.fillStyle = p.color;
            globals.ctx.beginPath(); globals.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); globals.ctx.fill();
        });
        globals.ctx.globalAlpha = 1;
    }
}
