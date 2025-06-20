// Renderer class for drawing game objects
class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    render(maze, player, camera) {
        const bounds = camera.getVisibleBounds();
        
        // Render maze tiles
        this.renderMaze(maze, camera, bounds);
        
        // Render start and end positions
        this.renderSpecialTiles(maze, camera);
        
        // Render player
        this.renderPlayer(player, camera);
    }
    
    renderMaze(maze, camera, bounds) {
        for (let y = bounds.startY; y < bounds.endY; y++) {
            for (let x = bounds.startX; x < bounds.endX; x++) {
                const worldX = x * TILE_SIZE;
                const worldY = y * TILE_SIZE;
                const screenPos = camera.worldToScreen(worldX, worldY);
                
                // Only render if tile is visible on screen
                if (screenPos.x < -TILE_SIZE || screenPos.x > camera.viewWidth ||
                    screenPos.y < -TILE_SIZE || screenPos.y > camera.viewHeight) {
                    continue;
                }
                
                if (maze.isWall(x, y)) {
                    this.ctx.fillStyle = COLORS.WALL;
                } else {
                    this.ctx.fillStyle = COLORS.FLOOR;
                }
                
                this.ctx.fillRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
                
                // Draw grid lines for better visibility
                if (!maze.isWall(x, y)) {
                    this.ctx.strokeStyle = '#ddd';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    
    renderSpecialTiles(maze, camera) {
        // Render start position
        const startWorldX = maze.startX * TILE_SIZE;
        const startWorldY = maze.startY * TILE_SIZE;
        const startScreenPos = camera.worldToScreen(startWorldX, startWorldY);
        
        this.ctx.fillStyle = COLORS.START;
        this.ctx.fillRect(startScreenPos.x + 4, startScreenPos.y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        
        // Render end position
        const endWorldX = maze.endX * TILE_SIZE;
        const endWorldY = maze.endY * TILE_SIZE;
        const endScreenPos = camera.worldToScreen(endWorldX, endWorldY);
        
        this.ctx.fillStyle = COLORS.END;
        this.ctx.fillRect(endScreenPos.x + 4, endScreenPos.y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }
    
    renderPlayer(player, camera) {
        const renderPos = player.getRenderPosition();
        const worldX = renderPos.x * TILE_SIZE;
        const worldY = renderPos.y * TILE_SIZE;
        const screenPos = camera.worldToScreen(worldX, worldY);
        
        // Draw player as a circle
        this.ctx.fillStyle = COLORS.PLAYER;
        this.ctx.beginPath();
        this.ctx.arc(
            screenPos.x + TILE_SIZE / 2,
            screenPos.y + TILE_SIZE / 2,
            TILE_SIZE / 3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Add a white outline
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}