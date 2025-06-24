// Particle system for visual effects

class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx; // velocity x
        this.vy = vy; // velocity y
        this.life = life; // lifetime in ms
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.gravity = 0;
        this.friction = 0.98;
        this.alpha = 1;
    }
    
    update(deltaTime) {
        // Update position
        this.x += this.vx * (deltaTime / 16);
        this.y += this.vy * (deltaTime / 16);
        
        // Apply physics
        this.vy += this.gravity * (deltaTime / 16);
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update life
        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);
        
        return this.life > 0;
    }
    
    render(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    // Wall collision particles - stone debris
    createWallCollision(x, y, direction) {
        const particleCount = 8;
        const baseSpeed = 2;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI / 4) * i + Math.random() * (Math.PI / 8);
            const speed = baseSpeed + Math.random() * 2;
            
            // Adjust angle based on collision direction
            let finalAngle = angle;
            if (direction === 'left') finalAngle = Math.PI - angle;
            else if (direction === 'up') finalAngle = -Math.PI/2 + (angle - Math.PI) * 0.5;
            else if (direction === 'down') finalAngle = Math.PI/2 + (angle - Math.PI) * 0.5;
            
            const vx = Math.cos(finalAngle) * speed;
            const vy = Math.sin(finalAngle) * speed;
            
            const particle = new Particle(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                vx,
                vy,
                300 + Math.random() * 200, // 300-500ms life
                Math.random() > 0.5 ? COLORS.WALL : COLORS.WALL_DARK,
                1 + Math.random() * 1.5 // Small stone debris
            );
            
            particle.gravity = 0.2;
            particle.friction = 0.95;
            
            this.particles.push(particle);
        }
    }
    
    // Victory celebration - gold sparkles
    createVictoryEffect(x, y) {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.2;
            const speed = 2 + Math.random() * 4;
            
            const particle = new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                1000 + Math.random() * 1000, // 1-2s life
                Math.random() > 0.5 ? COLORS.END : COLORS.END_GLOW,
                2 + Math.random() * 3
            );
            
            particle.gravity = -0.1; // Float upward
            particle.friction = 0.98;
            
            this.particles.push(particle);
        }
    }
    
    // Torch flame particles
    createTorchFlame(x, y) {
        // Create 2-3 particles per frame for continuous effect
        const particleCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < particleCount; i++) {
            const offsetX = (Math.random() - 0.5) * 8;
            const particle = new Particle(
                x + offsetX,
                y,
                (Math.random() - 0.5) * 0.5,
                -1 - Math.random() * 1.5, // Upward velocity
                400 + Math.random() * 400, // 400-800ms life
                this.getFlameColor(Math.random()),
                3 + Math.random() * 2
            );
            
            particle.gravity = -0.05; // Slight upward force
            particle.friction = 0.99;
            
            this.particles.push(particle);
        }
    }
    
    // Treasure collection particles
    createTreasureCollection(x, y, treasureType) {
        const particleCount = treasureType === 'chest' ? 20 : (treasureType === 'gem' ? 15 : 10);
        let color = COLORS.TREASURE_GOLD;
        
        // Set color based on treasure type
        if (treasureType === 'gem') {
            const gemColors = [COLORS.TREASURE_GEM_RED, COLORS.TREASURE_GEM_BLUE, COLORS.TREASURE_GEM_GREEN];
            color = gemColors[Math.floor(Math.random() * gemColors.length)];
        } else if (treasureType === 'chest') {
            color = COLORS.TREASURE_GOLD;
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 1 + Math.random() * 3;
            
            const particle = new Particle(
                x + (Math.random() - 0.5) * 8,
                y + (Math.random() - 0.5) * 8,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1, // Upward bias
                800 + Math.random() * 400, // 800-1200ms life
                color,
                2 + Math.random() * 3
            );
            
            particle.gravity = -0.05; // Float upward
            particle.friction = 0.98;
            
            this.particles.push(particle);
        }
    }
    
    // Portal effect for start/end positions
    createPortalEffect(x, y, color) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 10;
        
        const particle = new Particle(
            x + Math.cos(angle) * radius,
            y + Math.sin(angle) * radius,
            -Math.cos(angle) * 0.5,
            -Math.sin(angle) * 0.5,
            1000 + Math.random() * 500,
            color,
            2 + Math.random() * 2
        );
        
        particle.gravity = 0;
        particle.friction = 0.98;
        
        this.particles.push(particle);
    }
    
    // Footstep dust (enhance existing effect)
    createFootstepDust(x, y, direction) {
        const particleCount = 3;
        
        for (let i = 0; i < particleCount; i++) {
            let vx = (Math.random() - 0.5) * 1;
            let vy = Math.random() * 0.5 + 0.5;
            
            // Adjust based on movement direction
            if (direction === 'left') vx += 1;
            else if (direction === 'right') vx -= 1;
            else if (direction === 'up') vy += 1;
            else if (direction === 'down') vy -= 1;
            
            const particle = new Particle(
                x + (Math.random() - 0.5) * 10,
                y + 5,
                vx,
                vy,
                300 + Math.random() * 200,
                COLORS.FLOOR_DARK,
                2 + Math.random() * 2
            );
            
            particle.gravity = 0.1;
            particle.friction = 0.95;
            
            this.particles.push(particle);
        }
    }
    
    getFlameColor(t) {
        if (t < 0.3) return COLORS.FIRE_CORE;
        else if (t < 0.6) return COLORS.FIRE_MID;
        else return COLORS.FIRE_OUTER;
    }
    
    update(deltaTime) {
        // Update all particles and remove dead ones
        this.particles = this.particles.filter(particle => particle.update(deltaTime));
    }
    
    render(ctx, camera) {
        this.particles.forEach(particle => particle.render(ctx, camera));
    }
    
    clear() {
        this.particles = [];
    }
}