// Particle system for visual effects

class Particle {
    constructor(x = 0, y = 0, vx = 0, vy = 0, life = 1000, color = '#fff', size = 1) {
        this.init(x, y, vx, vy, life, color, size);
    }
    
    init(x, y, vx, vy, life, color, size) {
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
        this.active = true;
    }
    
    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.gravity = 0;
        this.friction = 0.98;
        this.alpha = 1;
    }
    
    update(deltaTime) {
        if (!this.active) return false;
        
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
        
        if (this.life <= 0) {
            this.active = false;
            return false;
        }
        
        return true;
    }
    
    render(ctx, camera) {
        if (!this.active) return;
        
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
        this.pool = [];
        this.maxParticles = 500; // Limit total particles for performance
        this.maxPoolSize = 200;  // Limit pool size to prevent memory bloat
    }
    
    getParticle() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return new Particle();
    }
    
    releaseParticle(particle) {
        if (this.pool.length < this.maxPoolSize) {
            particle.reset();
            this.pool.push(particle);
        }
    }
    
    createParticle(x, y, vx, vy, life, color, size) {
        // Enforce particle limit for performance
        if (this.particles.length >= this.maxParticles) {
            return null;
        }
        
        const particle = this.getParticle();
        particle.init(x, y, vx, vy, life, color, size);
        this.particles.push(particle);
        return particle;
    }
    
    // Check if we can create more particles (for batch operations)
    canCreateParticles(count = 1) {
        return this.particles.length + count <= this.maxParticles;
    }
    
    // Wall collision particles - stone debris
    createWallCollision(x, y, direction) {
        const particleCount = 8;
        const baseSpeed = 2;
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(particleCount)) {
            return; // Skip creation if would exceed limit
        }
        
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
            
            const particle = this.createParticle(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                vx,
                vy,
                300 + Math.random() * 200, // 300-500ms life
                Math.random() > 0.5 ? COLORS.WALL : COLORS.WALL_DARK,
                1 + Math.random() * 1.5 // Small stone debris
            );
            
            if (particle) {
                particle.gravity = 0.2;
                particle.friction = 0.95;
            }
        }
    }
    
    // Victory celebration - gold sparkles
    createVictoryEffect(x, y) {
        const particleCount = 50;
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(particleCount)) {
            return; // Skip creation if would exceed limit
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.2;
            const speed = 2 + Math.random() * 4;
            
            const particle = this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                1000 + Math.random() * 1000, // 1-2s life
                Math.random() > 0.5 ? COLORS.END : COLORS.END_GLOW,
                2 + Math.random() * 3
            );
            
            if (particle) {
                particle.gravity = -0.1; // Float upward
                particle.friction = 0.98;
            }
        }
    }
    
    // Torch flame particles
    createTorchFlame(x, y) {
        // Create 2-3 particles per frame for continuous effect
        const particleCount = 2 + Math.floor(Math.random() * 2);
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(particleCount)) {
            return; // Skip creation if would exceed limit
        }
        
        for (let i = 0; i < particleCount; i++) {
            const offsetX = (Math.random() - 0.5) * 8;
            const particle = this.createParticle(
                x + offsetX,
                y,
                (Math.random() - 0.5) * 0.5,
                -1 - Math.random() * 1.5, // Upward velocity
                400 + Math.random() * 400, // 400-800ms life
                this.getFlameColor(Math.random()),
                3 + Math.random() * 2
            );
            
            if (particle) {
                particle.gravity = -0.05; // Slight upward force
                particle.friction = 0.99;
            }
        }
    }
    
    // Treasure collection particles
    createTreasureCollection(x, y, treasureType) {
        const particleCount = treasureType === 'chest' ? 20 : (treasureType === 'gem' ? 15 : 10);
        let color = COLORS.TREASURE_GOLD;
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(particleCount)) {
            return; // Skip creation if would exceed limit
        }
        
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
            
            const particle = this.createParticle(
                x + (Math.random() - 0.5) * 8,
                y + (Math.random() - 0.5) * 8,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1, // Upward bias
                800 + Math.random() * 400, // 800-1200ms life
                color,
                2 + Math.random() * 3
            );
            
            if (particle) {
                particle.gravity = -0.05; // Float upward
                particle.friction = 0.98;
            }
        }
    }
    
    // Key collection particles
    createKeyCollection(x, y, keyColor) {
        const particleCount = 12;
        const colors = {
            'red': COLORS.KEY_RED,
            'blue': COLORS.KEY_BLUE,
            'green': COLORS.KEY_GREEN,
            'yellow': COLORS.KEY_YELLOW
        };
        const color = colors[keyColor] || COLORS.KEY_YELLOW;
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(particleCount)) {
            return; // Skip creation if would exceed limit
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.3;
            const speed = 1.5 + Math.random() * 2;
            
            const particle = this.createParticle(
                x + (Math.random() - 0.5) * 6,
                y + (Math.random() - 0.5) * 6,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 0.5, // Slight upward bias
                600 + Math.random() * 400, // 600-1000ms life
                color,
                2 + Math.random() * 2
            );
            
            if (particle) {
                particle.gravity = -0.02; // Float upward gently
                particle.friction = 0.98;
            }
        }
    }
    
    // Door unlock particles
    createDoorUnlock(x, y, doorColor) {
        const particleCount = 15;
        const sparkleCount = 8;
        const totalParticles = particleCount + sparkleCount;
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(totalParticles)) {
            return; // Skip creation if would exceed limit
        }
        
        const colors = {
            'red': COLORS.DOOR_RED,
            'blue': COLORS.DOOR_BLUE,
            'green': COLORS.DOOR_GREEN,
            'yellow': COLORS.DOOR_YELLOW
        };
        const color = colors[doorColor] || COLORS.DOOR_YELLOW;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.4;
            const speed = 2 + Math.random() * 3;
            
            const particle = this.createParticle(
                x + (Math.random() - 0.5) * 16,
                y + (Math.random() - 0.5) * 16,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                800 + Math.random() * 600, // 800-1400ms life
                color,
                3 + Math.random() * 3
            );
            
            if (particle) {
                particle.gravity = 0.1; // Fall down
                particle.friction = 0.95;
            }
        }
        
        // Add some sparkle particles
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            const particle = this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                400 + Math.random() * 300,
                COLORS.KEY_GLOW,
                1 + Math.random() * 2
            );
            
            if (particle) {
                particle.gravity = 0;
                particle.friction = 0.99;
            }
        }
    }
    
    // Portal effect for start/end positions
    createPortalEffect(x, y, color) {
        // Check if we can create particles before starting
        if (!this.canCreateParticles(1)) {
            return; // Skip creation if would exceed limit
        }
        
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 10;
        
        const particle = this.createParticle(
            x + Math.cos(angle) * radius,
            y + Math.sin(angle) * radius,
            -Math.cos(angle) * 0.5,
            -Math.sin(angle) * 0.5,
            1000 + Math.random() * 500,
            color,
            2 + Math.random() * 2
        );
        
        if (particle) {
            particle.gravity = 0;
            particle.friction = 0.98;
        }
    }
    
    // Footstep dust (enhance existing effect)
    createFootstepDust(x, y, direction) {
        const particleCount = 3;
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(particleCount)) {
            return; // Skip creation if would exceed limit
        }
        
        for (let i = 0; i < particleCount; i++) {
            let vx = (Math.random() - 0.5) * 1;
            let vy = Math.random() * 0.5 + 0.5;
            
            // Adjust based on movement direction
            if (direction === 'left') vx += 1;
            else if (direction === 'right') vx -= 1;
            else if (direction === 'up') vy += 1;
            else if (direction === 'down') vy -= 1;
            
            const particle = this.createParticle(
                x + (Math.random() - 0.5) * 10,
                y + 5,
                vx,
                vy,
                300 + Math.random() * 200,
                COLORS.FLOOR_DARK,
                2 + Math.random() * 2
            );
            
            if (particle) {
                particle.gravity = 0.1;
                particle.friction = 0.95;
            }
        }
    }
    
    getFlameColor(t) {
        if (t < 0.3) return COLORS.FIRE_CORE;
        else if (t < 0.6) return COLORS.FIRE_MID;
        else return COLORS.FIRE_OUTER;
    }
    
    update(deltaTime) {
        // Update all particles and remove dead ones using object pooling
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            if (!particle.update(deltaTime)) {
                // Remove dead particle and return to pool
                this.particles.splice(i, 1);
                this.releaseParticle(particle);
            }
        }
    }
    
    createWallOpen(x, y) {
        // Magical wall opening effect - cyan sparkles
        const particleCount = 15;
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(particleCount)) {
            return; // Skip creation if would exceed limit
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const colors = ['#00ffff', '#40e0d0', '#00ced1', '#5f9ea0'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.createParticle(
                x + (Math.random() - 0.5) * TILE_SIZE,
                y + (Math.random() - 0.5) * TILE_SIZE,
                vx, vy,
                800 + Math.random() * 400, // 0.8-1.2 seconds
                color,
                2 + Math.random() * 2
            );
        }
    }
    
    createWallClose(x, y) {
        // Warning effect when wall is about to close - red sparks
        const particleCount = 10;
        
        // Check if we can create particles before starting
        if (!this.canCreateParticles(particleCount)) {
            return; // Skip creation if would exceed limit
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const colors = ['#ff4444', '#ff6666', '#ffaaaa'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.createParticle(
                x + (Math.random() - 0.5) * TILE_SIZE,
                y + (Math.random() - 0.5) * TILE_SIZE,
                vx, vy,
                600 + Math.random() * 200, // 0.6-0.8 seconds
                color,
                1 + Math.random() * 1.5
            );
        }
    }
    
    render(ctx, camera) {
        this.particles.forEach(particle => particle.render(ctx, camera));
    }
    
    clear() {
        this.particles = [];
    }
}