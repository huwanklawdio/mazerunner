// Mini-map component for displaying explored areas
class MiniMap {
    constructor(canvas, maze) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.maze = maze;
        this.size = 120; // Mini-map size in pixels
        this.scale = this.size / Math.max(maze.width, maze.height);
        
        // Explored areas tracking
        this.explored = new Set();
        this.viewRadius = 2; // How far player can "see"
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        // Position mini-map in bottom-left corner
        this.canvas.style.position = 'absolute';
        this.canvas.style.bottom = '20px';
        this.canvas.style.left = '20px';
        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;
        this.canvas.style.border = '2px solid #fff';
        this.canvas.style.background = 'rgba(0, 0, 0, 0.8)';
        this.canvas.style.zIndex = '10';
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        
        // Add to game container
        document.querySelector('.game-container').appendChild(this.canvas);
    }
    
    updateExplored(playerX, playerY) {
        // Add areas around player to explored set
        for (let dy = -this.viewRadius; dy <= this.viewRadius; dy++) {
            for (let dx = -this.viewRadius; dx <= this.viewRadius; dx++) {
                const x = playerX + dx;
                const y = playerY + dy;
                
                if (x >= 0 && x < this.maze.width && y >= 0 && y < this.maze.height) {
                    this.explored.add(`${x},${y}`);
                }
            }
        }
    }
    
    render(player) {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.size, this.size);
        
        // Update explored areas
        this.updateExplored(player.x, player.y);
        
        // Draw maze (only explored areas)
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                const key = `${x},${y}`;
                
                if (this.explored.has(key)) {
                    const screenX = x * this.scale;
                    const screenY = y * this.scale;
                    const size = Math.max(1, this.scale);
                    
                    if (this.maze.isWall(x, y)) {
                        this.ctx.fillStyle = '#444';
                    } else {
                        this.ctx.fillStyle = '#ccc';
                    }
                    
                    this.ctx.fillRect(screenX, screenY, size, size);
                }
            }
        }
        
        // Draw start position (if explored)
        if (this.explored.has(`${this.maze.startX},${this.maze.startY}`)) {
            this.ctx.fillStyle = '#5cb85c';
            const startX = this.maze.startX * this.scale;
            const startY = this.maze.startY * this.scale;
            const size = Math.max(2, this.scale);
            this.ctx.fillRect(startX, startY, size, size);
        }
        
        // Draw end position (if explored)
        if (this.explored.has(`${this.maze.endX},${this.maze.endY}`)) {
            this.ctx.fillStyle = '#d9534f';
            const endX = this.maze.endX * this.scale;
            const endY = this.maze.endY * this.scale;
            const size = Math.max(2, this.scale);
            this.ctx.fillRect(endX, endY, size, size);
        }
        
        // Draw player position
        this.ctx.fillStyle = '#4a90e2';
        const playerX = player.x * this.scale;
        const playerY = player.y * this.scale;
        const playerSize = Math.max(2, this.scale * 1.5);
        
        this.ctx.beginPath();
        this.ctx.arc(
            playerX + this.scale / 2,
            playerY + this.scale / 2,
            playerSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Add white outline to player
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw mini-map border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.size, this.size);
        
        // Add mini-map label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('MAP', this.size / 2, this.size - 5);
    }
    
    reset() {
        // Clear explored areas for new game
        this.explored.clear();
    }
    
    // Toggle mini-map visibility
    toggle() {
        if (this.canvas.style.display === 'none') {
            this.canvas.style.display = 'block';
            return true;
        } else {
            this.canvas.style.display = 'none';
            return false;
        }
    }
}