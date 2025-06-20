// Retro gaming circular mini-map component
class MiniMap {
    constructor(canvas, maze) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.maze = maze;
        this.size = 140; // Circular mini-map diameter
        this.radius = this.size / 2;
        this.scale = (this.size * 0.7) / Math.max(maze.width, maze.height); // Scale for circular view
        
        // Explored areas tracking
        this.explored = new Set();
        this.viewRadius = 3; // How far player can "see"
        
        // Rotation and animation
        this.currentRotation = 0;
        this.targetRotation = 0;
        this.rotationSpeed = 0.1; // Smooth rotation interpolation
        this.glowPhase = 0; // For pulsing glow animation
        
        // Retro colors
        this.colors = {
            background: '#0a0a0a',
            wall: '#00ffff',
            floor: '#001a33',
            player: '#ff00ff',
            playerCenter: '#ffffff',
            start: '#00ff00',
            end: '#ff0033',
            borderGlow: '#00ffff',
            crossHair: '#33ff33',
            scanlines: 'rgba(0, 255, 255, 0.1)'
        };
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        // Position circular mini-map in bottom-left corner
        this.canvas.style.position = 'absolute';
        this.canvas.style.bottom = '20px';
        this.canvas.style.left = '20px';
        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;
        this.canvas.style.borderRadius = '50%';
        this.canvas.style.border = 'none';
        this.canvas.style.background = 'transparent';
        this.canvas.style.zIndex = '10';
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        
        // Disable image smoothing for pixelated retro effect
        this.ctx.imageSmoothingEnabled = false;
        
        // Add to game container
        document.querySelector('.game-container').appendChild(this.canvas);
    }
    
    updateExplored(playerX, playerY) {
        // Add circular area around player to explored set
        for (let dy = -this.viewRadius; dy <= this.viewRadius; dy++) {
            for (let dx = -this.viewRadius; dx <= this.viewRadius; dx++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.viewRadius) {
                    const x = playerX + dx;
                    const y = playerY + dy;
                    
                    if (x >= 0 && x < this.maze.width && y >= 0 && y < this.maze.height) {
                        this.explored.add(`${x},${y}`);
                    }
                }
            }
        }
    }
    
    updateRotation(player) {
        // Convert player facing direction to rotation angle
        const faceToAngle = {
            'up': -Math.PI / 2,
            'down': Math.PI / 2,
            'left': Math.PI,
            'right': 0
        };
        
        this.targetRotation = faceToAngle[player.facing] || 0;
        
        // Smooth rotation interpolation
        let rotDiff = this.targetRotation - this.currentRotation;
        
        // Handle angle wrapping (shortest path)
        if (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        if (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
        
        this.currentRotation += rotDiff * this.rotationSpeed;
    }
    
    rotatePoint(x, y, centerX, centerY, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = x - centerX;
        const dy = y - centerY;
        
        return {
            x: centerX + dx * cos - dy * sin,
            y: centerY + dx * sin + dy * cos
        };
    }
    
    render(player) {
        // Update glow animation (no rotation)
        this.glowPhase += 0.05;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Update explored areas
        this.updateExplored(player.x, player.y);
        
        // Save context for clipping
        this.ctx.save();
        
        // Create circular clipping mask
        this.ctx.beginPath();
        this.ctx.arc(this.radius, this.radius, this.radius - 4, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Fill background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.size, this.size);
        
        // Draw crosshair grid
        this.drawCrossHair();
        
        // Draw static maze (no rotation)
        this.drawStaticMaze(player);
        
        // Draw scanlines for retro effect
        this.drawScanlines();
        
        // Restore context (remove clipping)
        this.ctx.restore();
        
        // Draw glowing border
        this.drawGlowingBorder();
        
        // Draw radar label
        this.drawLabel();
    }
    
    drawCrossHair() {
        this.ctx.strokeStyle = this.colors.crossHair;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        // Horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(10, this.radius);
        this.ctx.lineTo(this.size - 10, this.radius);
        this.ctx.stroke();
        
        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(this.radius, 10);
        this.ctx.lineTo(this.radius, this.size - 10);
        this.ctx.stroke();
        
        // Circular grid lines
        for (let r = 20; r < this.radius; r += 25) {
            this.ctx.beginPath();
            this.ctx.arc(this.radius, this.radius, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawStaticMaze(player) {
        const centerX = this.radius;
        const centerY = this.radius;
        
        // Draw explored maze tiles (no rotation)
        for (let y = 0; y < this.maze.height; y++) {
            for (let x = 0; x < this.maze.width; x++) {
                const key = `${x},${y}`;
                
                if (this.explored.has(key)) {
                    // Calculate relative position to player (no rotation)
                    const relX = (x - player.x) * this.scale;
                    const relY = (y - player.y) * this.scale;
                    
                    const screenX = centerX + relX;
                    const screenY = centerY + relY;
                    
                    // Check if point is within visible circle
                    const distFromCenter = Math.sqrt(
                        Math.pow(screenX - centerX, 2) + 
                        Math.pow(screenY - centerY, 2)
                    );
                    
                    if (distFromCenter < this.radius - 5) {
                        const pixelSize = Math.max(2, this.scale);
                        
                        if (this.maze.isWall(x, y)) {
                            this.ctx.fillStyle = this.colors.wall;
                        } else {
                            this.ctx.fillStyle = this.colors.floor;
                        }
                        
                        // Draw pixelated tiles
                        this.ctx.fillRect(
                            Math.floor(screenX - pixelSize/2),
                            Math.floor(screenY - pixelSize/2),
                            pixelSize,
                            pixelSize
                        );
                    }
                }
            }
        }
        
        // Draw start position (if explored)
        if (this.explored.has(`${this.maze.startX},${this.maze.startY}`)) {
            const relX = (this.maze.startX - player.x) * this.scale;
            const relY = (this.maze.startY - player.y) * this.scale;
            
            const screenX = centerX + relX;
            const screenY = centerY + relY;
            
            const distFromCenter = Math.sqrt(
                Math.pow(screenX - centerX, 2) + 
                Math.pow(screenY - centerY, 2)
            );
            
            if (distFromCenter < this.radius - 5) {
                this.ctx.fillStyle = this.colors.start;
                const size = Math.max(3, this.scale);
                this.ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
            }
        }
        
        // Draw end position (if explored)
        if (this.explored.has(`${this.maze.endX},${this.maze.endY}`)) {
            const relX = (this.maze.endX - player.x) * this.scale;
            const relY = (this.maze.endY - player.y) * this.scale;
            
            const screenX = centerX + relX;
            const screenY = centerY + relY;
            
            const distFromCenter = Math.sqrt(
                Math.pow(screenX - centerX, 2) + 
                Math.pow(screenY - centerY, 2)
            );
            
            if (distFromCenter < this.radius - 5) {
                this.ctx.fillStyle = this.colors.end;
                const size = Math.max(4, this.scale);
                this.ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
            }
        }
        
        // Draw player at center (always visible)
        this.ctx.fillStyle = this.colors.player;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Player center dot
        this.ctx.fillStyle = this.colors.playerCenter;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawScanlines() {
        this.ctx.strokeStyle = this.colors.scanlines;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.2;
        
        // Horizontal scanlines
        for (let y = 0; y < this.size; y += 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.size, y);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawGlowingBorder() {
        const glowIntensity = 0.7 + 0.3 * Math.sin(this.glowPhase);
        
        // Outer glow rings
        for (let i = 0; i < 5; i++) {
            this.ctx.strokeStyle = this.colors.borderGlow;
            this.ctx.globalAlpha = glowIntensity * (0.3 - i * 0.05);
            this.ctx.lineWidth = 2 + i;
            
            this.ctx.beginPath();
            this.ctx.arc(this.radius, this.radius, this.radius - 2 - i, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Main border
        this.ctx.strokeStyle = this.colors.borderGlow;
        this.ctx.globalAlpha = 1.0;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(this.radius, this.radius, this.radius - 3, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawLabel() {
        this.ctx.fillStyle = this.colors.borderGlow;
        this.ctx.font = 'bold 8px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.globalAlpha = 0.8;
        this.ctx.fillText('RADAR', this.radius, this.size - 8);
        this.ctx.globalAlpha = 1.0;
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