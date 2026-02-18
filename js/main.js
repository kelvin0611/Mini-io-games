// js/main.js
import { globals } from './utils/global.js';
import { Assets } from './utils/assets.js';
import { AudioEngine } from './utils/audio.js';
import { API } from './utils/api.js'; 
import SliceGame from './games/SliceGame.js';
import BeatGame from './games/BeatGame.js';
import SnakeGame from './games/SnakeGame.js';

// Initialize Globals
globals.canvas = document.getElementById('gameCanvas');
globals.ctx = globals.canvas.getContext('2d');

// DPI scaling for crisp canvas rendering
function resize() {
    const container = document.getElementById('game-container');
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size (CSS pixels)
    globals.canvas.style.width = container.offsetWidth + 'px';
    globals.canvas.style.height = container.offsetHeight + 'px';
    
    // Set actual size (memory pixels) for crisp rendering
    globals.canvas.width = container.offsetWidth * dpr;
    globals.canvas.height = container.offsetHeight * dpr;
    
    // Scale context to match device pixel ratio
    globals.ctx.scale(dpr, dpr);
    
    globals.w = container.offsetWidth;
    globals.h = container.offsetHeight;
    
    const miniCanvas = document.getElementById('minimap-canvas');
    if (miniCanvas) {
        miniCanvas.width = 150;
        miniCanvas.height = 150;
    }
}
window.addEventListener('resize', resize);
resize();

Assets.load();

// Theme Toggle Logic
const themeBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

themeBtn.onclick = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeBtn.innerText = next === 'dark' ? '☀' : '☾';
};
themeBtn.innerText = savedTheme === 'dark' ? '☀' : '☾';

// Maps numeric game IDs to the database strings
const GAME_MAP = { 1: 'slice-io', 2: 'beat-io', 3: 'snek-io' };

let currentUser = null; 

const GameManager = {
    state: 'LOBBY',
    currentGame: null,
    currentId: 0,
    lastFrameTime: performance.now(),
    deltaTime: 0,
    
    // --- Auth & Profile Logic ---
    async initAuth() {
        try {
            const user = await API.getProfile();
            this.setLoggedIn(user);
        } catch (e) {
            console.log("Not logged in.");
        }
    },

    setLoggedIn(user) {
        currentUser = user;
        
        // 顯示新的 HUD
        const hud = document.getElementById('user-badge');
        hud.classList.remove('hidden');
        hud.style.display = 'flex';
        
        // 隱藏登錄按鈕
        document.getElementById('btn-show-login').style.display = 'none';
        document.getElementById('auth-modal').style.display = 'none';

        // 填充數據
        document.getElementById('player-name').innerText = user.username;
        document.getElementById('player-level').innerText = `Lv.${user.level}`;
        
        // 計算並更新 XP 條
        const progress = (user.totalXp % 100); 
        document.getElementById('player-xp-bar').style.width = `${progress}%`;
    },

    setLoggedOut() {
        currentUser = null;
        document.getElementById('user-badge').classList.add('hidden');
        document.getElementById('user-badge').style.display = 'none';
        document.getElementById('btn-show-login').style.display = 'block';
    },

    // --- Leaderboard Logic ---
    
    switchLbTab(gameIdStr, btnElement) {
        // 更新按鈕樣式
        document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        
        // 加載數據
        this.showLeaderboard(gameIdStr);
    },

    async showLeaderboard(gameIdStr = 'slice-io') {
        document.getElementById('leaderboard-modal').style.display = 'flex';
        const lbContent = document.getElementById('lb-content');
        lbContent.innerHTML = '<div class="loading-text">Fetching Data...</div>';
        
        try {
            const data = await API.getLeaderboard(gameIdStr);
            
            if (!data.leaderboard || data.leaderboard.length === 0) {
                lbContent.innerHTML = '<div style="text-align:center; padding:20px; color:#aaa;">No scores yet. Be the first!</div>';
                return;
            }
            
            let html = '';
            data.leaderboard.forEach((entry, index) => {
                const rank = index + 1;
                let rankClass = '';
                let rankDisplay = `#${rank}`;

                if (rank === 1) { rankClass = 'rank-1'; rankDisplay = '🥇 1ST'; }
                if (rank === 2) { rankClass = 'rank-2'; rankDisplay = '🥈 2ND'; }
                if (rank === 3) { rankClass = 'rank-3'; rankDisplay = '🥉 3RD'; }

                html += `
                    <div class="lb-row">
                        <span class="${rankClass}">${rankDisplay}</span>
                        <span style="color: #fff;">${entry.username}</span>
                        <span style="color: var(--accent-magenta); font-family:'Orbitron'">${entry.score}</span>
                    </div>
                `;
            });
            lbContent.innerHTML = html;
        } catch (e) {
            lbContent.innerHTML = `<div style="text-align:center; color:#ff3838;">Failed to load. Is server running?</div>`;
        }
    },

    loadLobby() {
        this.state = 'LOBBY';
        if(this.currentGame) {
            if(this.currentGame.destroy) this.currentGame.destroy();
            this.currentGame = null;
        }
        document.getElementById('lobby-screen').style.display = 'flex';
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('sidebar').classList.add('hidden-sidebar'); 
        document.getElementById('ioMessage').style.opacity = 0;
        document.getElementById('feedbackMessage').style.opacity = 0;
        document.getElementById('snake-ui').style.display = 'none';
        document.getElementById('ai-roast-box').style.display = 'none';
        
        AudioEngine.stopMusic();
    },

    loadGame(id) {
        this.currentId = id;
        document.getElementById('lobby-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('sidebar').classList.remove('hidden-sidebar'); 
        
        resize();
        this.lastFrameTime = performance.now(); // Reset frame timing when loading new game

        if (id === 1) this.currentGame = new SliceGame();
        if (id === 2) this.currentGame = new BeatGame();
        if (id === 3) this.currentGame = new SnakeGame();
    },

    restart() {
        this.loadGame(this.currentId);
    },

    // --- Score Submission ---
    async showOverlay(type, title, desc, callback) {
        const ov = document.getElementById('game-overlay');
        ov.style.display = 'flex';
        document.getElementById('ov-title').innerText = title;
        document.getElementById('ov-desc').innerHTML = desc;
        
        const btn = document.getElementById('btn-action');
        btn.innerText = type === 'START' ? 'START' : 'RETRY';
        btn.onclick = () => {
            ov.style.display = 'none';
            if(callback) callback();
        };
        
        if (type === 'END') {
            const finalScore = this.currentGame?.score || 0;
            document.getElementById('ov-score').style.display = 'block';
            document.getElementById('ov-score').innerText = "SCORE: " + finalScore;

            console.log("嘗試提交分數:", finalScore, "當前用戶:", currentUser);

            // Submit Score if logged in
            if (currentUser && finalScore > 0) {
                const gameStr = GAME_MAP[this.currentId];
                try {
                    console.log("正在發送請求到後端...");
                    const result = await API.submitScore(gameStr, finalScore, 60); 
                    
                    console.log("✅ 分數提交成功!", result);
                    
                    if (result.isNewBest) this.showFloatingMessage("NEW HIGH SCORE!", "#f1c40f");
                    if (result.levelUp) {
                        setTimeout(() => this.showFloatingMessage("LEVEL UP!", "#00ffe1"), 1500);
                        document.getElementById('player-level').innerText = `Lv.${result.level}`;
                    }
                } catch (e) {
                    console.error("❌ 分數保存失敗:", e); 
                    alert("保存失敗: " + e.message);
                }
            } else if (!currentUser) {
                console.log("用戶未登錄，跳過保存");
                document.getElementById('ov-desc').innerHTML = "Login to save your high scores!<br>" + desc;
            }
        } else {
            document.getElementById('ov-score').style.display = 'none';
        }
    },

    showFloatingMessage(text, color = '#ff00de') {
        const el = document.getElementById('ioMessage');
        el.innerText = text;
        el.style.color = color;
        el.style.opacity = 1;
        el.style.transform = 'translate(-50%, -50%) scale(1.2)';
        setTimeout(() => {
            el.style.opacity = 0;
            el.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 1500);
    },

    loop() {
        const now = performance.now();
        this.deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = now;
        
        // Cap deltaTime to prevent huge jumps (max 0.05s = 20fps minimum)
        if (this.deltaTime > 0.05) this.deltaTime = 0.05;
        
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const grad = globals.ctx.createRadialGradient(globals.w/2, globals.h/2, 0, globals.w/2, globals.h/2, globals.w);
        if (isLight) {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, '#e0e0e5');
        } else {
            grad.addColorStop(0, '#2b2b35');
            grad.addColorStop(1, '#0f0f12');
        }
        globals.ctx.fillStyle = grad;
        globals.ctx.fillRect(0, 0, globals.w, globals.h);

        if (this.currentGame) {
            if (this.currentGame.update) this.currentGame.update(this.deltaTime);
            if (this.currentGame.draw) this.currentGame.draw();
        }
        requestAnimationFrame(() => this.loop());
    }
};

// --- DOM Event Listeners for Auth UI ---
document.getElementById('btn-show-login').onclick = () => {
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('auth-error').innerText = '';
};

document.getElementById('btn-login').onclick = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    const errorEl = document.getElementById('auth-error');
    try {
        await API.login(email, pass);
        errorEl.innerText = '✓ Login successful!';
        errorEl.style.color = '#00ff00';
        document.getElementById('auth-email').value = '';
        document.getElementById('auth-pass').value = '';
        setTimeout(() => {
            GameManager.initAuth();
            document.getElementById('auth-modal').style.display = 'none';
        }, 500);
    } catch (e) {
        errorEl.innerText = e.message;
        errorEl.style.color = '#ff3838';
    }
};

document.getElementById('btn-register').onclick = async () => {
    const email = document.getElementById('auth-email').value;
    const user = document.getElementById('auth-user').value;
    const pass = document.getElementById('auth-pass').value;
    const errorEl = document.getElementById('auth-error');
    try {
        if (!email || !user || !pass) {
            throw new Error('All fields required');
        }
        await API.register(email, user, pass);
        errorEl.innerText = '✓ Account created! Logging in...';
        errorEl.style.color = '#00ff00';
        document.getElementById('auth-email').value = '';
        document.getElementById('auth-user').value = '';
        document.getElementById('auth-pass').value = '';
        setTimeout(() => {
            GameManager.initAuth();
            document.getElementById('auth-modal').style.display = 'none';
        }, 500);
    } catch (e) {
        errorEl.innerText = e.message;
        errorEl.style.color = '#ff3838';
    }
};

document.getElementById('btn-logout').onclick = async () => {
    await API.logout();
    GameManager.setLoggedOut();
};

window.gameManager = GameManager;

GameManager.initAuth();
GameManager.loop();
