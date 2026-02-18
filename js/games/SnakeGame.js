import { globals } from '../utils/global.js';
import { Input } from '../utils/input.js';

const SNAKE_CONFIG = {
    mapSize: 4000,
    baseSpeed: 4, 
    boostSpeed: 8,
    turnSpeed: 0.12,
    baseRadius: 10, 
    gridSize: 50,
    botCount: 15,
    maxFood: 800
};

class GeminiAnnouncer {
    constructor() {
        this.box = document.getElementById('commentary-box');
        this.roastBox = document.getElementById('ai-roast-box');
        this.apiKey = ""; 
    }
    async triggerCommentary(eventType, detail) { if (!this.apiKey) return; }
    async generateRoast(score, killerName) {
        this.roastBox.style.display = 'flex';
        if (!this.apiKey) {
            this.roastBox.innerHTML = `<div style="color:#aaa;">(AI Analysis Unavailable - No Key)</div>`;
            return;
        }
    }
}
const announcer = new GeminiAnnouncer();

class SnakeParticle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 3 + 2;
        this.life = 1.0;
        this.velX = (Math.random() - 0.5) * 4;
        this.velY = (Math.random() - 0.5) * 4;
    }
    update() {
        this.x += this.velX; this.y += this.velY;
        this.life -= 0.03;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Food {
    constructor(x, y, value = 1, color = null) {
        this.x = x || (Math.random()-0.5) * SNAKE_CONFIG.mapSize;
        this.y = y || (Math.random()-0.5) * SNAKE_CONFIG.mapSize;
        this.value = value;
        this.radius = 5 + (value * 0.5); 
        this.color = color || `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
    }
    draw(ctx) {
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Snake {
    constructor(isPlayer = false, name = "Bot") {
        this.isPlayer = isPlayer;
        this.name = name;
        this.dead = false;
        this.x = (Math.random()-0.5) * (SNAKE_CONFIG.mapSize/2);
        this.y = (Math.random()-0.5) * (SNAKE_CONFIG.mapSize/2);
        this.angle = Math.random() * Math.PI * 2;
        this.speed = SNAKE_CONFIG.baseSpeed;
        this.turnSpeed = SNAKE_CONFIG.turnSpeed;
        this.score = 10; 
        this.accel = false; 
        this.color = isPlayer ? '#00ffcc' : `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
        
        this.path = [];
        for(let i=0; i<30; i++) this.path.push({x: this.x, y: this.y});
        this.targetAngle = this.angle;
        this.aiTimer = 0;
    }

    get radius() { return SNAKE_CONFIG.baseRadius + Math.sqrt(this.score) * 0.5; }

    update(foods, allSnakes) {
        if (this.dead) return;

        if (this.isPlayer) {
            const dx = Input.x - globals.w/2;
            const dy = Input.y - globals.h/2;
            this.turnTo(Math.atan2(dy, dx));
            this.accel = Input.isDown;
        } else {
            this.handleBotAI(foods, allSnakes);
        }

        if (this.accel && this.score > 15) {
            this.speed = SNAKE_CONFIG.boostSpeed;
            if(Math.random() < 0.2) {
                this.score -= 1; 
                const tail = this.path[this.path.length-1];
                foods.push(new Food(tail.x, tail.y, 1, this.color));
            }
        } else {
            this.speed = SNAKE_CONFIG.baseSpeed;
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        const lim = SNAKE_CONFIG.mapSize / 2;
        if(this.x < -lim || this.x > lim || this.y < -lim || this.y > lim) {
            this.dead = true;
            return;
        }

        this.path.unshift({x: this.x, y: this.y});
        const maxLen = this.score * 5;
        const pointsNeeded = maxLen / (this.speed * 0.5);
        while (this.path.length > pointsNeeded) this.path.pop();
    }

    handleBotAI(foods, allSnakes) {
        this.aiTimer++;
        const others = allSnakes.filter(s => s !== this && !s.dead);

        const lookAheadDist = this.radius * 4 + 50; 
        const lookX = this.x + Math.cos(this.angle) * lookAheadDist;
        const lookY = this.y + Math.sin(this.angle) * lookAheadDist;
        
        let dangerDetected = false;
        let avoidanceAngle = 0;

        const limit = SNAKE_CONFIG.mapSize / 2 - 150;
        if (lookX < -limit || lookX > limit || lookY < -limit || lookY > limit) {
            dangerDetected = true;
            if (lookX < -limit) avoidanceAngle = 0;
            else if (lookX > limit) avoidanceAngle = Math.PI;
            else if (lookY < -limit) avoidanceAngle = Math.PI / 2;
            else if (lookY > limit) avoidanceAngle = -Math.PI / 2;
        }

        if (!dangerDetected) {
            for (let other of others) {
                const d = Math.hypot(this.x - other.x, this.y - other.y);
                if (d > 600) continue; 

                const skip = 3;
                for (let i = 0; i < other.path.length; i+=skip) {
                    const pt = other.path[i];
                    const distToLook = Math.hypot(lookX - pt.x, lookY - pt.y);
                    
                    if (distToLook < other.radius + this.radius + 20) {
                        dangerDetected = true;
                        const dx = lookX - this.x;
                        const dy = lookY - this.y;
                        const ox = pt.x - this.x;
                        const oy = pt.y - this.y;
                        const cross = dx * oy - dy * ox;
                        
                        avoidanceAngle = this.angle + (cross > 0 ? -Math.PI/1.5 : Math.PI/1.5);
                        break;
                    }
                }
                if (dangerDetected) break;
            }
        }

        if (dangerDetected) {
            this.turnTo(avoidanceAngle);
            this.accel = false;
            return;
        }

        let targetFound = false;
        if (!targetFound) {
            this.accel = false; 
            if (this.aiTimer % 5 === 0) {
                let bestFood = null;
                let bestScore = -Infinity;
                
                for(let i=0; i<20; i++) {
                    const f = foods[Math.floor(Math.random() * foods.length)];
                    if (!f) continue;
                    const d = Math.hypot(this.x - f.x, this.y - f.y);
                    if (d > 500) continue; 

                    const angleToFood = Math.atan2(f.y - this.y, f.x - this.x);
                    let angleDiff = angleToFood - this.angle;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                    if (Math.abs(angleDiff) < Math.PI / 1.5) {
                        const score = (500 - d) + (100 - Math.abs(angleDiff) * 50);
                        if (score > bestScore) {
                            bestScore = score;
                            bestFood = f;
                        }
                    }
                }

                if (bestFood) {
                    this.targetAngle = Math.atan2(bestFood.y - this.y, bestFood.x - this.x);
                } else if (Math.random() < 0.02) {
                    this.targetAngle += (Math.random() - 0.5) * 2;
                }
            }
        }
        this.turnTo(this.targetAngle);
    }

    turnTo(target) {
        let diff = target - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        if (Math.abs(diff) < this.turnSpeed) this.angle = target;
        else this.angle += Math.sign(diff) * this.turnSpeed;
    }

    checkCollision(other) {
        if(this.dead || other.dead) return false;
        if(this === other) return false;
        
        const r = this.radius;
        for(let i=0; i<other.path.length; i+=4) {
            const p = other.path[i];
            if(Math.hypot(this.x - p.x, this.y - p.y) < r + other.radius - 5) {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        if (this.dead) return;
        const r = this.radius;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if(this.isPlayer) {
            ctx.shadowBlur = 15; ctx.shadowColor = this.color;
        }

        for(let i=this.path.length-1; i>=0; i-=2) {
            const p = this.path[i];
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(p.x, p.y, r, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        const eyeOff = r * 0.6;
        const eyeSize = r * 0.35;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + Math.cos(this.angle-0.6)*eyeOff, this.y + Math.sin(this.angle-0.6)*eyeOff, eyeSize, 0, Math.PI*2);
        ctx.arc(this.x + Math.cos(this.angle+0.6)*eyeOff, this.y + Math.sin(this.angle+0.6)*eyeOff, eyeSize, 0, Math.PI*2);
        ctx.fill();
    }
}

export default class SnakeGame {
    constructor() {
        this.state = 'WAITING';
        this.score = 10;
        this.player = null;
        this.bots = [];
        this.foods = [];
        this.particles = [];
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.miniCtx = document.getElementById('minimap-canvas').getContext('2d');
        
        document.getElementById('snake-ui').style.display = 'block';
        window.gameManager.showOverlay('START', 'SNEK.IO', 'Mouse to Move. Click to Boost.<br>Eat food, kill bots!', () => this.start());
    }

    start() {
        this.state = 'PLAYING';
        this.player = new Snake(true, "You");
        this.bots = [];
        this.foods = [];
        this.particles = [];
        
        for(let i=0; i<SNAKE_CONFIG.botCount; i++) {
            this.bots.push(new Snake(false, "Bot " + (i+1)));
        }
        for(let i=0; i<SNAKE_CONFIG.maxFood; i++) {
            this.foods.push(new Food());
        }
        announcer.generateRoast(0, "Game Start"); 
    }

    destroy() {
        document.getElementById('snake-ui').style.display = 'none';
        document.getElementById('ai-roast-box').style.display = 'none';
    }

    update() {
        if (this.state !== 'PLAYING') return;

        if(!this.player.dead) {
            this.player.update(this.foods, this.bots);
            this.camera.x += (this.player.x - this.camera.x) * 0.1;
            this.camera.y += (this.player.y - this.camera.y) * 0.1;
            this.score = Math.floor(this.player.score);
            document.getElementById('scoreDisplay').innerText = "LENGTH: " + this.score;
        }

        this.bots.forEach(b => b.update(this.foods, [this.player, ...this.bots]));

        const allSnakes = [this.player, ...this.bots].filter(s => !s.dead);
        
        allSnakes.forEach(snake => {
            for(let i=this.foods.length-1; i>=0; i--) {
                const f = this.foods[i];
                if(Math.abs(snake.x - f.x) < snake.radius + f.radius + 10) {
                    if(Math.hypot(snake.x - f.x, snake.y - f.y) < snake.radius + f.radius) {
                        snake.score += f.value;
                        this.foods.splice(i, 1);
                    }
                }
            }
        });

        allSnakes.forEach(s1 => {
            allSnakes.forEach(s2 => {
                if(s1 !== s2 && s1.checkCollision(s2)) {
                    s1.dead = true;
                    for(let i=0; i<s1.path.length; i+=3) {
                        const p = s1.path[i];
                        this.foods.push(new Food(p.x, p.y, 2, s1.color));
                    }
                    for(let i=0; i<20; i++) {
                        this.particles.push(new SnakeParticle(s1.x, s1.y, s1.color));
                    }
                    
                    if(s1 === this.player) {
                        window.gameManager.showOverlay('END', 'GAME OVER', '', ()=>window.gameManager.restart());
                        announcer.generateRoast(this.score, s2.name);
                        this.state = 'DEAD';
                    }
                }
            });
        });

        while(this.foods.length < SNAKE_CONFIG.maxFood) this.foods.push(new Food());
        this.bots = this.bots.filter(b => !b.dead);
        if(this.bots.length < SNAKE_CONFIG.botCount) this.bots.push(new Snake(false, "Bot"));

        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const ctx = globals.ctx;
        
        ctx.fillStyle = isLight ? '#e0e0e0' : '#1a1a2e';
        ctx.fillRect(0, 0, globals.w, globals.h);

        ctx.save();
        ctx.translate(globals.w/2 - this.camera.x, globals.h/2 - this.camera.y);

        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        const startX = Math.floor((this.camera.x - globals.w/2) / gridSize) * gridSize;
        const endX = startX + globals.w + gridSize;
        const startY = Math.floor((this.camera.y - globals.h/2) / gridSize) * gridSize;
        const endY = startY + globals.h + gridSize;

        ctx.beginPath();
        for(let x = startX; x < endX; x+=gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
        for(let y = startY; y < endY; y+=gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
        ctx.stroke();

        ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 5;
        ctx.strokeRect(-SNAKE_CONFIG.mapSize/2, -SNAKE_CONFIG.mapSize/2, SNAKE_CONFIG.mapSize, SNAKE_CONFIG.mapSize);

        this.foods.forEach(f => {
            if(Math.abs(f.x - this.camera.x) < globals.w/2 + 50 && Math.abs(f.y - this.camera.y) < globals.h/2 + 50) f.draw(ctx);
        });
        this.particles.forEach(p => p.draw(ctx));
        this.bots.forEach(b => b.draw(ctx));
        if(this.player) this.player.draw(ctx);

        ctx.restore();
        this.drawMinimap();
    }

    drawMinimap() {
        const mCtx = this.miniCtx;
        mCtx.clearRect(0,0,150,150);
        mCtx.fillStyle = 'rgba(0,0,0,0.5)';
        mCtx.fillRect(0,0,150,150);
        
        const scale = 150 / SNAKE_CONFIG.mapSize;
        const off = 75;

        mCtx.fillStyle = '#aaa';
        this.bots.forEach(b => {
            mCtx.beginPath(); mCtx.arc(b.x*scale + off, b.y*scale + off, 2, 0, Math.PI*2); mCtx.fill();
        });
        if(this.player && !this.player.dead) {
            mCtx.fillStyle = '#00ffcc';
            mCtx.beginPath(); mCtx.arc(this.player.x*scale + off, this.player.y*scale + off, 4, 0, Math.PI*2); mCtx.fill();
        }
    }
}
