// Helper to generate simple placeholder pixel art data URIs
function createPixelArt(color, type) {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    
    if (type === 'fruit') {
        x.fillStyle = color;
        x.beginPath(); x.arc(16,16,12,0,Math.PI*2); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.arc(12,12,4,0,Math.PI*2); x.fill();
        x.fillStyle = '#4cd137'; x.fillRect(14,2,4,6); 
    } else if (type === 'bomb') {
        x.fillStyle = '#111'; x.beginPath(); x.arc(16,18,10,0,Math.PI*2); x.fill();
        x.fillStyle = '#fa0'; x.fillRect(14,4,4,6); 
        x.fillStyle = '#ff3838'; x.fillRect(14,0,4,4); 
    } else if (type === 'note') {
        const grad = x.createLinearGradient(0,0,0,32);
        grad.addColorStop(0, color); grad.addColorStop(1, '#000');
        x.fillStyle = grad;
        x.fillRect(4,4,24,24);
        x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(4,4,24,24);
    }
    return c.toDataURL();
}

export const Assets = {
    fruit_apple: new Image(),
    fruit_banana: new Image(),
    bomb: new Image(),
    note: new Image(),
    
    load() {
        this.fruit_apple.src = createPixelArt('#ff3838', 'fruit'); 
        this.fruit_banana.src = createPixelArt('#ffeaa7', 'fruit'); 
        this.bomb.src = createPixelArt('#000', 'bomb'); 
        this.note.src = createPixelArt('#00ffe1', 'note');
    }
};