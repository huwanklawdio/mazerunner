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
        
        // Idle breathing animation properties
        this.idleTime = 0;
        this.breathingAmplitude = 0.6; // Pixels - very subtle travel length
        this.breathingFrequency = 1.8; // Quicker breathing (keys use 3)
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
        this.idleTime = 0;
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
            this.idleTime = 0; // Reset idle timer when moving
            
            return { success: true, newX, newY };
        }
        
        return false;
    }
    
    handlePressurePlateActivation(maze, particleSystem = null) {
        // Check for pressure plate activation at current position
        const plate = maze.getPressurePlateAt(this.x, this.y);
        if (plate && !plate.activated) {
            const activated = maze.activatePressurePlate(this.x, this.y, particleSystem);
            if (activated) {
                return activated;
            }
        }
        return null;
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
                this.animationFrame = (this.animationFrame + 1) % 5; // 5 sprite frames
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
            this.idleTime += deltaTime / 1000; // Track idle time in seconds
        }
    }
    
    getRenderPosition() {
        if (this.isMoving) {
            // Interpolate between current and target position
            const renderX = this.x + (this.targetX - this.x) * this.interpolation;
            const renderY = this.y + (this.targetY - this.y) * this.interpolation;
            return { x: renderX, y: renderY };
        }
        
        // Apply subtle breathing animation when idle
        if (this.isIdle && this.idleTime > 0) {
            const breathingOffset = Math.sin(this.idleTime * this.breathingFrequency) * this.breathingAmplitude;
            return { 
                x: this.x, 
                y: this.y + breathingOffset * 0.1 // Very subtle vertical movement
            };
        }
        
        return { x: this.x, y: this.y };
    }
}