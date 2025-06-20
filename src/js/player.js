// Player class for movement and position
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.moveSpeed = 8; // Grid cells per second
        this.interpolation = 0;
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.interpolation = 0;
    }
    
    move(dx, dy, maze) {
        // Don't allow new movement while already moving
        if (this.isMoving) {
            return false;
        }
        
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        // Check if the new position is valid (not a wall)
        if (maze.isFloor(newX, newY)) {
            this.targetX = newX;
            this.targetY = newY;
            this.isMoving = true;
            this.interpolation = 0;
            return true;
        }
        
        return false;
    }
    
    update(deltaTime, maze) {
        if (this.isMoving) {
            // Update interpolation for smooth movement
            this.interpolation += (this.moveSpeed * deltaTime) / 1000;
            
            if (this.interpolation >= 1) {
                // Movement complete
                this.interpolation = 1;
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            }
        }
    }
    
    getRenderPosition() {
        if (this.isMoving) {
            // Interpolate between current and target position
            const renderX = this.x + (this.targetX - this.x) * this.interpolation;
            const renderY = this.y + (this.targetY - this.y) * this.interpolation;
            return { x: renderX, y: renderY };
        }
        
        return { x: this.x, y: this.y };
    }
}