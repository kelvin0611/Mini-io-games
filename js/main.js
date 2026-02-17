// js/main.js
import { globals } from './utils/globals.js';
import { Assets } from './utils/assets.js';
import { AudioEngine } from './utils/audio.js';
import { API } from './utils/api.js'; 
import SliceGame from './games/SliceGame.js';
import BeatGame from './games/BeatGame.js';
import SnakeGame from './games/SnakeGame.js';

// Initialize Globals
globals.canvas = document.getElementById('gameCanvas');
globals.ctx = globals.canvas.getContext('2d');

function resize() {
    const container = document.getElementById('game-container');
    globals.w = globals.canvas.width = container.offsetWidth;
    globals.h = globals.canvas.height = container.offsetHeight;
    
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
        document.getElementById('user-badge').style.display = 'flex';
        document.getElementById('btn-show-login').style.display = 'none';
        document.getElementById('player-name').innerText = user.username;
        document.getElementById('player-level').innerText = `Lv.${user.level}`;
        document.getElementById('auth-modal').style.display = 'none';
    },

    setLoggedOut() {
        currentUser = null;
        document.getElementById('user-badge').style.display = 'none';
        document.getElementById('btn-show-login').style.display = 'block';
    },

    // --- Leaderboard Logic ---
    async showLeaderboard(gameIdStr) {
        document.getElementById('leaderboard-modal').style.display = 'flex';
        const lbContent = document.getElementById('lb-content');
        lbContent.innerHTML = '<div style="text-align:center; color:#aaa;">Fetching from server...</div>';
        
        try {
            const data = await API.getLeaderboard(gameIdStr);
            if (data.leaderboard.length === 0) {
                lbContent.innerHTML = '<div style="text-align:center; color:#aaa;">No scores yet. Be the first!</div>';
                return;
            }
            
            let html = '';
            data.leaderboard.forEach(entry => {
                html += `
                    <div class="lb-row">
                        <span>#${entry.rank} ${entry.username}</span>
                        <span>${entry.score}</span>
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
        
        setTimeout(resize, 100);

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

            // Submit Score if logged in
            if (currentUser && finalScore > 0) {
                const gameStr = GAME_MAP[this.currentId];
                try {
                    const result = await API.submitScore(gameStr, finalScore, 60); 
                    
                    if (result.isNewBest) this.showFloatingMessage("NEW HIGH SCORE!", "#f1c40f");
                    if (result.levelUp) {
                        setTimeout(() => this.showFloatingMessage("LEVEL UP!", "#00ffe1"), 1500);
                        document.getElementById('player-level').innerText = `Lv.${result.level}`;
                    }
                } catch (e) {
                    console.error("Failed to save score:", e);
                }
            } else if (!currentUser) {
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
            this.currentGame.update();
            this.currentGame.draw();
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
    try {
        await API.login(email, pass);
        GameManager.initAuth(); 
    } catch (e) {
        document.getElementById('auth-error').innerText = e.message;
    }
};

document.getElementById('btn-register').onclick = async () => {
    const email = document.getElementById('auth-email').value;
    const user = document.getElementById('auth-user').value;
    const pass = document.getElementById('auth-pass').value;
    try {
        await API.register(email, user, pass);
        GameManager.initAuth();
    } catch (e) {
        document.getElementById('auth-error').innerText = e.message;
    }
};

document.getElementById('btn-logout').onclick = async () => {
    await API.logout();
    GameManager.setLoggedOut();
};

window.gameManager = GameManager;

GameManager.initAuth();
GameManager.loop();
