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
        
        // Render direction hint
        this.renderDirectionHint(maze, player, camera);
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
                    this.renderWallTile(screenPos.x, screenPos.y, x, y);
                } else {
                    this.renderFloorTile(screenPos.x, screenPos.y, x, y);
                }
            }
        }
    }
    
    renderWallTile(x, y, gridX, gridY) {
        // Base wall color
        this.ctx.fillStyle = COLORS.WALL;
        this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        
        // Add texture pattern based on grid position
        const pattern = (gridX + gridY) % 3;
        
        // Dark accent lines
        this.ctx.fillStyle = COLORS.WALL_DARK;
        if (pattern === 0) {
            // Vertical lines
            this.ctx.fillRect(x + 8, y, 2, TILE_SIZE);
            this.ctx.fillRect(x + 22, y, 2, TILE_SIZE);
        } else if (pattern === 1) {
            // Horizontal lines
            this.ctx.fillRect(x, y + 8, TILE_SIZE, 2);
            this.ctx.fillRect(x, y + 22, TILE_SIZE, 2);
        } else {
            // Corner accents
            this.ctx.fillRect(x, y, 8, 8);
            this.ctx.fillRect(x + 24, y + 24, 8, 8);
        }
        
        // Light highlights
        this.ctx.fillStyle = COLORS.WALL_LIGHT;
        this.ctx.fillRect(x, y, TILE_SIZE, 2);
        this.ctx.fillRect(x, y, 2, TILE_SIZE);
    }
    
    renderFloorTile(x, y, gridX, gridY) {
        // Base floor color
        this.ctx.fillStyle = COLORS.FLOOR;
        this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        
        // Subtle checkerboard pattern
        if ((gridX + gridY) % 2 === 0) {
            this.ctx.fillStyle = COLORS.FLOOR_DARK;
            this.ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
        
        // Grid lines
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
    }
    
    renderSpecialTiles(maze, camera) {
        // Render start position with glow effect
        const startWorldX = maze.startX * TILE_SIZE;
        const startWorldY = maze.startY * TILE_SIZE;
        const startScreenPos = camera.worldToScreen(startWorldX, startWorldY);
        
        // Glow effect
        this.ctx.fillStyle = COLORS.START_GLOW;
        this.ctx.fillRect(startScreenPos.x + 2, startScreenPos.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        
        // Main start tile
        this.ctx.fillStyle = COLORS.START;
        this.ctx.fillRect(startScreenPos.x + 6, startScreenPos.y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
        
        // Render end position with glow effect
        const endWorldX = maze.endX * TILE_SIZE;
        const endWorldY = maze.endY * TILE_SIZE;
        const endScreenPos = camera.worldToScreen(endWorldX, endWorldY);
        
        // Animated glow effect
        const time = Date.now() / 1000;
        const glowIntensity = 0.7 + 0.3 * Math.sin(time * 3);
        
        this.ctx.fillStyle = COLORS.END_GLOW;
        this.ctx.globalAlpha = glowIntensity;
        this.ctx.fillRect(endScreenPos.x + 2, endScreenPos.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        this.ctx.globalAlpha = 1.0;
        
        // Main end tile
        this.ctx.fillStyle = COLORS.END;
        this.ctx.fillRect(endScreenPos.x + 6, endScreenPos.y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
    }
    
    renderPlayer(player, camera) {
        const renderPos = player.getRenderPosition();
        const worldX = renderPos.x * TILE_SIZE;
        const worldY = renderPos.y * TILE_SIZE;
        const screenPos = camera.worldToScreen(worldX, worldY);
        
        const centerX = screenPos.x + TILE_SIZE / 2;
        const centerY = screenPos.y + TILE_SIZE / 2;
        
        // Movement trail effect (if moving)
        if (player.isMoving) {
            const trailAlpha = 0.2 * (1 - player.interpolation);
            const trailX = screenPos.x + (player.x - player.targetX) * TILE_SIZE * player.interpolation + TILE_SIZE / 2;
            const trailY = screenPos.y + (player.y - player.targetY) * TILE_SIZE * player.interpolation + TILE_SIZE / 2;
            
            this.ctx.fillStyle = `rgba(74, 144, 226, ${trailAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(trailX, trailY, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw animated person sprite
        this.drawPersonSprite(centerX, centerY, player.facing, player.animationFrame, player.isMoving);
    }
    
    drawPersonSprite(x, y, facing, frame, isMoving) {
        const size = 20;
        const headSize = 6;
        const bodyHeight = 12;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - size/2 + 2, y + size/2 - 2, size, 3);
        
        // Calculate walking animation offset
        let walkOffset = 0;
        let armSwing = 0;
        let legOffset = 0;
        
        if (isMoving) {
            walkOffset = Math.sin(frame * Math.PI / 2) * 1;
            armSwing = Math.sin(frame * Math.PI / 2) * 2;
            legOffset = Math.sin(frame * Math.PI / 2) * 2;
        }
        
        // Body position
        const bodyY = y + walkOffset;
        
        // Head
        this.ctx.fillStyle = '#ffdbac'; // Skin color
        this.ctx.beginPath();
        this.ctx.arc(x, bodyY - bodyHeight/2 - headSize/2, headSize/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Hair
        this.ctx.fillStyle = '#8B4513'; // Brown hair
        this.ctx.beginPath();
        this.ctx.arc(x, bodyY - bodyHeight/2 - headSize/2 - 1, headSize/2 + 1, Math.PI, Math.PI * 2);
        this.ctx.fill();
        
        // Body
        this.ctx.fillStyle = COLORS.PLAYER;
        this.ctx.fillRect(x - 4, bodyY - bodyHeight/2, 8, bodyHeight);
        
        // Arms
        this.ctx.strokeStyle = '#ffdbac';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        if (facing === 'right' || facing === 'left') {
            // Side view arms
            this.ctx.beginPath();
            this.ctx.moveTo(x - 4, bodyY - 2);
            this.ctx.lineTo(x - 8, bodyY + 2 + armSwing);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + 4, bodyY - 2);
            this.ctx.lineTo(x + 8, bodyY + 2 - armSwing);
            this.ctx.stroke();
        } else {
            // Front/back view arms
            this.ctx.beginPath();
            this.ctx.moveTo(x - 4, bodyY - 2);
            this.ctx.lineTo(x - 6, bodyY + 4 + armSwing);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + 4, bodyY - 2);
            this.ctx.lineTo(x + 6, bodyY + 4 - armSwing);
            this.ctx.stroke();
        }
        
        // Legs
        this.ctx.strokeStyle = '#4169E1'; // Blue pants
        this.ctx.lineWidth = 4;
        
        if (facing === 'right' || facing === 'left') {
            // Side view legs
            this.ctx.beginPath();
            this.ctx.moveTo(x - 2, bodyY + bodyHeight/2);
            this.ctx.lineTo(x - 2 + legOffset, bodyY + bodyHeight/2 + 8);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + 2, bodyY + bodyHeight/2);
            this.ctx.lineTo(x + 2 - legOffset, bodyY + bodyHeight/2 + 8);
            this.ctx.stroke();
        } else {
            // Front/back view legs
            this.ctx.beginPath();
            this.ctx.moveTo(x - 2, bodyY + bodyHeight/2);
            this.ctx.lineTo(x - 2 + legOffset, bodyY + bodyHeight/2 + 8);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + 2, bodyY + bodyHeight/2);
            this.ctx.lineTo(x + 2 - legOffset, bodyY + bodyHeight/2 + 8);
            this.ctx.stroke();
        }
        
        // Eyes (direction-dependent)
        this.ctx.fillStyle = '#000';
        if (facing === 'up') {
            // Back view - no eyes visible
        } else if (facing === 'down') {
            // Front view - both eyes
            this.ctx.fillRect(x - 2, bodyY - bodyHeight/2 - headSize/2, 1, 1);
            this.ctx.fillRect(x + 1, bodyY - bodyHeight/2 - headSize/2, 1, 1);
        } else if (facing === 'left') {
            // Left profile
            this.ctx.fillRect(x - 1, bodyY - bodyHeight/2 - headSize/2, 1, 1);
        } else if (facing === 'right') {
            // Right profile
            this.ctx.fillRect(x + 1, bodyY - bodyHeight/2 - headSize/2, 1, 1);
        }
        
        // Feet
        this.ctx.fillStyle = '#654321'; // Brown shoes
        if (facing === 'right' || facing === 'left') {
            this.ctx.fillRect(x - 4 + legOffset, bodyY + bodyHeight/2 + 7, 4, 2);
            this.ctx.fillRect(x - legOffset, bodyY + bodyHeight/2 + 7, 4, 2);
        } else {
            this.ctx.fillRect(x - 3 + legOffset, bodyY + bodyHeight/2 + 7, 3, 2);
            this.ctx.fillRect(x - legOffset, bodyY + bodyHeight/2 + 7, 3, 2);
        }
    }
    
    renderDirectionHint(maze, player, camera) {
        // Calculate direction from player to exit
        const playerPos = player.getRenderPosition();
        const dx = maze.endX - playerPos.x;
        const dy = maze.endY - playerPos.y;
        
        // Calculate angle in radians
        const angle = Math.atan2(dy, dx);
        
        // Compass position (top-right corner)
        const compassX = camera.viewWidth - 60;
        const compassY = 60;
        const compassRadius = 30;
        const arrowLength = 20;
        
        // Draw compass background with gradient effect
        this.ctx.fillStyle = COLORS.COMPASS_BG;
        this.ctx.beginPath();
        this.ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw compass border
        this.ctx.strokeStyle = COLORS.COMPASS_BORDER;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add compass markings (N, S, E, W)
        this.ctx.fillStyle = '#888';
        this.ctx.font = '10px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('N', compassX, compassY - 20);
        this.ctx.fillText('S', compassX, compassY + 25);
        this.ctx.fillText('E', compassX + 20, compassY + 3);
        this.ctx.fillText('W', compassX - 20, compassY + 3);
        
        // Draw direction arrow
        this.ctx.strokeStyle = COLORS.END;
        this.ctx.fillStyle = COLORS.END;
        this.ctx.lineWidth = 3;
        
        // Arrow tip position
        const arrowTipX = compassX + Math.cos(angle) * arrowLength;
        const arrowTipY = compassY + Math.sin(angle) * arrowLength;
        
        // Draw arrow line
        this.ctx.beginPath();
        this.ctx.moveTo(compassX, compassY);
        this.ctx.lineTo(arrowTipX, arrowTipY);
        this.ctx.stroke();
        
        // Draw arrow head
        const arrowHeadSize = 6;
        const arrowHeadAngle1 = angle + Math.PI * 0.8;
        const arrowHeadAngle2 = angle - Math.PI * 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(arrowTipX, arrowTipY);
        this.ctx.lineTo(
            arrowTipX + Math.cos(arrowHeadAngle1) * arrowHeadSize,
            arrowTipY + Math.sin(arrowHeadAngle1) * arrowHeadSize
        );
        this.ctx.lineTo(
            arrowTipX + Math.cos(arrowHeadAngle2) * arrowHeadSize,
            arrowTipY + Math.sin(arrowHeadAngle2) * arrowHeadSize
        );
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add distance text
        const distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${distance}`, compassX, compassY + 50);
        this.ctx.fillText('EXIT', compassX, compassY + 65);
    }
}