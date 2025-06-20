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
        
        // Animation properties
        this.facing = 'down'; // 'up', 'down', 'left', 'right'
        this.animationFrame = 0;
        this.animationTime = 0;
        this.animationSpeed = 8; // Frames per second
        this.isIdle = true;
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.interpolation = 0;
        this.facing = 'down';
        this.animationFrame = 0;
        this.animationTime = 0;
        this.isIdle = true;
    }
    
    move(dx, dy, maze) {
        // Don't allow new movement while already moving
        if (this.isMoving) {
            return false;
        }
        
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        // Update facing direction
        if (dx > 0) this.facing = 'right';
        else if (dx < 0) this.facing = 'left';
        else if (dy > 0) this.facing = 'down';
        else if (dy < 0) this.facing = 'up';
        
        // Check if the new position is valid (not a wall)
        if (maze.isFloor(newX, newY)) {
            this.targetX = newX;
            this.targetY = newY;
            this.isMoving = true;
            this.isIdle = false;
            this.interpolation = 0;
            this.animationFrame = 0;
            return true;
        }
        
        return false;
    }
    
    update(deltaTime, maze) {
        // Update animation
        this.animationTime += deltaTime / 1000;
        
        if (this.isMoving) {
            // Update interpolation for smooth movement
            this.interpolation += (this.moveSpeed * deltaTime) / 1000;
            
            // Animate walking while moving
            const frameTime = 1 / this.animationSpeed;
            if (this.animationTime >= frameTime) {
                this.animationFrame = (this.animationFrame + 1) % 4; // 4 walking frames
                this.animationTime = 0;
            }
            
            if (this.interpolation >= 1) {
                // Movement complete
                this.interpolation = 1;
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
                this.isIdle = true;
                this.animationFrame = 0; // Reset to idle frame
            }
        } else {
            // Idle animation (subtle breathing effect)
            this.animationFrame = 0;
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