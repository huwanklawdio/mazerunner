// Camera class for viewport management
class Camera {
    constructor(viewWidth, viewHeight) {
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.followSpeed = 5; // Camera follow speed
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }
    
    update(targetX, targetY) {
        // Center camera on target
        this.targetX = targetX - this.viewWidth / 2;
        this.targetY = targetY - this.viewHeight / 2;
        
        // Clamp camera to world bounds
        this.targetX = clamp(this.targetX, 0, MAP_WIDTH - this.viewWidth);
        this.targetY = clamp(this.targetY, 0, MAP_HEIGHT - this.viewHeight);
        
        // Smooth camera movement with deadzone to prevent micro-movements
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        // Only move if difference is significant enough
        const threshold = 0.5;
        if (Math.abs(dx) > threshold) {
            this.x += dx * this.followSpeed * 0.016; // Assuming 60 FPS
        } else {
            this.x = this.targetX; // Snap to target if very close
        }
        
        if (Math.abs(dy) > threshold) {
            this.y += dy * this.followSpeed * 0.016;
        } else {
            this.y = this.targetY; // Snap to target if very close
        }
    }
    
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
    
    getVisibleBounds() {
        const startX = Math.floor(this.x / TILE_SIZE);
        const startY = Math.floor(this.y / TILE_SIZE);
        const endX = Math.ceil((this.x + this.viewWidth) / TILE_SIZE);
        const endY = Math.ceil((this.y + this.viewHeight) / TILE_SIZE);
        
        return {
            startX: Math.max(0, startX),
            startY: Math.max(0, startY),
            endX: Math.min(GRID_WIDTH, endX),
            endY: Math.min(GRID_HEIGHT, endY)
        };
    }
}