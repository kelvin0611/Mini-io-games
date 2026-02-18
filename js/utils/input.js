import { globals } from './global.js';

export const Input = {
    x: 0, y: 0, isDown: false, keys: {},
    update(e) {
        if (!globals.canvas) return;
        const rect = globals.canvas.getBoundingClientRect();
        if(e.type.includes('touch')) {
            this.x = e.touches[0].clientX - rect.left;
            this.y = e.touches[0].clientY - rect.top;
            this.isDown = true;
        } else {
            this.x = e.clientX - rect.left;
            this.y = e.clientY - rect.top;
            this.isDown = e.buttons === 1;
        }
    },
    keyDown(e) { this.keys[e.code] = true; },
    keyUp(e) { this.keys[e.code] = false; }
};

['mousemove','mousedown','mouseup','touchmove','touchstart','touchend'].forEach(evt => 
    window.addEventListener(evt, e => Input.update(e))
);
window.addEventListener('keydown', e => Input.keyDown(e));
window.addEventListener('keyup', e => Input.keyUp(e));
