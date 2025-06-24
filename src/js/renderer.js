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
        
        // Render torches
        this.renderTorches(maze, camera);
        
        // Render treasures
        this.renderTreasures(maze, camera);
        
        // Render keys and doors
        this.renderKeys(maze, camera);
        this.renderDoors(maze, camera);
        
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
        // Base stone wall color
        this.ctx.fillStyle = COLORS.WALL;
        this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        
        // Stone texture pattern based on grid position
        const pattern = (gridX * 7 + gridY * 13) % 5;
        
        // Stone blocks and mortar
        this.ctx.fillStyle = COLORS.WALL_DARK;
        
        // Horizontal mortar lines
        this.ctx.fillRect(x, y + 10, TILE_SIZE, 2);
        this.ctx.fillRect(x, y + 22, TILE_SIZE, 2);
        
        // Vertical mortar lines based on pattern
        if (pattern < 3) {
            this.ctx.fillRect(x + 15, y, 2, 12);
            this.ctx.fillRect(x + 15, y + 12, 2, 10);
        } else {
            this.ctx.fillRect(x + 10, y, 2, 10);
            this.ctx.fillRect(x + 20, y + 12, 2, 12);
        }
        
        // Moss patches
        if ((gridX * 3 + gridY * 5) % 7 === 0) {
            this.ctx.fillStyle = COLORS.WALL_MOSS;
            this.ctx.fillRect(x + 2, y + 2, 6, 4);
            this.ctx.fillRect(x + 4, y + 6, 3, 2);
        }
        
        // Cracks
        if ((gridX * 11 + gridY * 7) % 13 === 0) {
            this.ctx.strokeStyle = COLORS.WALL_DARK;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 8, y + 5);
            this.ctx.lineTo(x + 12, y + 15);
            this.ctx.lineTo(x + 10, y + 25);
            this.ctx.stroke();
        }
        
        // Light edge (3D effect)
        this.ctx.fillStyle = COLORS.WALL_LIGHT;
        this.ctx.fillRect(x, y, TILE_SIZE, 1);
        this.ctx.fillRect(x, y, 1, TILE_SIZE);
        
        // Dark edge (depth)
        this.ctx.fillStyle = COLORS.WALL_DARK;
        this.ctx.fillRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE);
        this.ctx.fillRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1);
    }
    
    renderFloorTile(x, y, gridX, gridY) {
        // Base cobblestone color
        this.ctx.fillStyle = COLORS.FLOOR;
        this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        
        // Cobblestone pattern
        const pattern = (gridX * 13 + gridY * 7) % 4;
        
        // Stone variations
        this.ctx.fillStyle = COLORS.FLOOR_DARK;
        if (pattern === 0) {
            // Top-left stone
            this.ctx.fillRect(x + 2, y + 2, 12, 12);
            this.ctx.fillRect(x + 16, y + 16, 14, 14);
        } else if (pattern === 1) {
            // Top-right stone
            this.ctx.fillRect(x + 16, y + 2, 14, 12);
            this.ctx.fillRect(x + 2, y + 16, 12, 14);
        } else if (pattern === 2) {
            // Center stone
            this.ctx.fillRect(x + 8, y + 8, 16, 16);
        }
        
        // Light stones
        this.ctx.fillStyle = COLORS.FLOOR_LIGHT;
        if (pattern === 3) {
            this.ctx.fillRect(x + 4, y + 4, 10, 10);
            this.ctx.fillRect(x + 18, y + 18, 10, 10);
        }
        
        // Mortar lines
        this.ctx.strokeStyle = COLORS.FLOOR_DARK;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y);
        this.ctx.lineTo(x + 15, y + TILE_SIZE);
        this.ctx.moveTo(x, y + 15);
        this.ctx.lineTo(x + TILE_SIZE, y + 15);
        this.ctx.stroke();
        
        // Occasional debris/dirt
        if ((gridX * 17 + gridY * 23) % 11 === 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(x + 20, y + 22, 3, 2);
            this.ctx.fillRect(x + 24, y + 24, 2, 2);
        }
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
    
    renderTorches(maze, camera) {
        for (const torch of maze.torches) {
            const worldX = torch.x * TILE_SIZE;
            const worldY = torch.y * TILE_SIZE;
            const screenPos = camera.worldToScreen(worldX, worldY);
            
            // Only render if torch is visible on screen
            if (screenPos.x < -TILE_SIZE || screenPos.x > camera.viewWidth ||
                screenPos.y < -TILE_SIZE || screenPos.y > camera.viewHeight) {
                continue;
            }
            
            this.drawTorch(screenPos.x, screenPos.y, torch.side);
        }
    }
    
    drawTorch(x, y, side) {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        
        // Calculate torch position based on wall side
        let torchX = x + TILE_SIZE / 2;
        let torchY = y + TILE_SIZE / 2;
        
        // Offset torch position based on wall side
        switch (side) {
            case 'top':
                torchY = y + 8;
                break;
            case 'bottom':
                torchY = y + TILE_SIZE - 8;
                break;
            case 'left':
                torchX = x + 8;
                break;
            case 'right':
                torchX = x + TILE_SIZE - 8;
                break;
        }
        
        // Draw torch bracket (metal holder)
        ctx.fillStyle = '#696969';
        ctx.fillRect(torchX - 2, torchY - 8, 4, 16);
        
        // Draw torch handle (wood)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(torchX - 1, torchY - 6, 2, 12);
        
        // Draw flame base (always visible)
        const flameFlicker = Math.sin(time * 8) * 2;
        ctx.fillStyle = COLORS.FIRE_OUTER;
        ctx.beginPath();
        ctx.ellipse(torchX, torchY - 8 + flameFlicker, 4, 6 + flameFlicker, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw flame middle
        ctx.fillStyle = COLORS.FIRE_MID;
        ctx.beginPath();
        ctx.ellipse(torchX, torchY - 10 + flameFlicker, 3, 5 + flameFlicker, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw flame core
        ctx.fillStyle = COLORS.FIRE_CORE;
        ctx.beginPath();
        ctx.ellipse(torchX, torchY - 12 + flameFlicker, 2, 3 + flameFlicker * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        const glowIntensity = 0.5 + 0.3 * Math.sin(time * 4);
        ctx.fillStyle = `rgba(255, 149, 0, ${glowIntensity * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(torchX, torchY - 8, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderTreasures(maze, camera) {
        const time = Date.now() / 1000;
        
        for (const treasure of maze.treasures) {
            if (treasure.collected) continue;
            
            const worldX = treasure.x * TILE_SIZE;
            const worldY = treasure.y * TILE_SIZE;
            const screenPos = camera.worldToScreen(worldX, worldY);
            
            // Only render if treasure is visible on screen
            if (screenPos.x < -TILE_SIZE || screenPos.x > camera.viewWidth ||
                screenPos.y < -TILE_SIZE || screenPos.y > camera.viewHeight) {
                continue;
            }
            
            this.drawTreasure(screenPos.x, screenPos.y, treasure.type, time);
        }
    }
    
    drawTreasure(x, y, type, time) {
        const ctx = this.ctx;
        const centerX = x + TILE_SIZE / 2;
        const centerY = y + TILE_SIZE / 2;
        
        // Add gentle bobbing animation
        const bobOffset = Math.sin(time * 2) * 1;
        const adjustedY = centerY + bobOffset;
        
        // Add glow effect
        const glowIntensity = 0.3 + 0.2 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(255, 237, 78, ${glowIntensity})`;
        ctx.beginPath();
        ctx.arc(centerX, adjustedY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        switch (type) {
            case 'coin':
                this.drawCoin(centerX, adjustedY, time);
                break;
            case 'gem':
                this.drawGem(centerX, adjustedY, time);
                break;
            case 'chest':
                this.drawTreasureChest(centerX, adjustedY, time);
                break;
        }
    }
    
    drawCoin(x, y, time) {
        const ctx = this.ctx;
        const rotation = time * 2; // Spinning animation
        const coinWidth = Math.abs(Math.cos(rotation)) * 8 + 2; // Perspective effect
        
        // Outer ring (gold)
        ctx.fillStyle = COLORS.TREASURE_GOLD;
        ctx.beginPath();
        ctx.ellipse(x, y, coinWidth, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner ring (darker gold)
        ctx.fillStyle = '#b8860b';
        ctx.beginPath();
        ctx.ellipse(x, y, coinWidth * 0.7, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Center highlight
        ctx.fillStyle = COLORS.TREASURE_GOLD;
        ctx.beginPath();
        ctx.ellipse(x, y, coinWidth * 0.3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawGem(x, y, time) {
        const ctx = this.ctx;
        const sparkle = Math.sin(time * 4) * 0.3 + 0.7; // Sparkling effect
        const gemColors = [COLORS.TREASURE_GEM_RED, COLORS.TREASURE_GEM_BLUE, COLORS.TREASURE_GEM_GREEN];
        const colorIndex = Math.floor(time * 0.5) % gemColors.length;
        
        ctx.save();
        ctx.globalAlpha = sparkle;
        
        // Gem body (diamond shape)
        ctx.fillStyle = gemColors[colorIndex];
        ctx.beginPath();
        ctx.moveTo(x, y - 6);      // Top
        ctx.lineTo(x + 4, y - 2);  // Top right
        ctx.lineTo(x + 3, y + 4);  // Bottom right
        ctx.lineTo(x, y + 6);      // Bottom
        ctx.lineTo(x - 3, y + 4);  // Bottom left
        ctx.lineTo(x - 4, y - 2);  // Top left
        ctx.closePath();
        ctx.fill();
        
        // Gem highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - 1, y - 4);
        ctx.lineTo(x + 1, y - 4);
        ctx.lineTo(x, y - 1);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    drawTreasureChest(x, y, time) {
        const ctx = this.ctx;
        const bob = Math.sin(time * 1.5) * 0.5;
        const chestY = y + bob;
        
        // Chest base
        ctx.fillStyle = COLORS.TREASURE_CHEST;
        ctx.fillRect(x - 8, chestY, 16, 10);
        
        // Chest lid
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(x - 8, chestY - 6, 16, 6);
        
        // Chest lock
        ctx.fillStyle = COLORS.TREASURE_GOLD;
        ctx.fillRect(x - 2, chestY - 3, 4, 4);
        
        // Metal bands
        ctx.fillStyle = '#696969';
        ctx.fillRect(x - 8, chestY + 2, 16, 1);
        ctx.fillRect(x - 8, chestY + 6, 16, 1);
        
        // Sparkles around chest
        const sparkleCount = 6;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + time * 2;
            const sparkleX = x + Math.cos(angle) * 12;
            const sparkleY = chestY + Math.sin(angle) * 8;
            
            ctx.fillStyle = COLORS.TREASURE_GOLD;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderKeys(maze, camera) {
        const time = Date.now() / 1000;
        
        for (const key of maze.keys) {
            if (key.collected) continue;
            
            const worldX = key.x * TILE_SIZE;
            const worldY = key.y * TILE_SIZE;
            const screenPos = camera.worldToScreen(worldX, worldY);
            
            // Only render if key is visible on screen
            if (screenPos.x < -TILE_SIZE || screenPos.x > camera.viewWidth ||
                screenPos.y < -TILE_SIZE || screenPos.y > camera.viewHeight) {
                continue;
            }
            
            this.drawKey(screenPos.x, screenPos.y, key.color, time);
        }
    }
    
    renderDoors(maze, camera) {
        for (const door of maze.doors) {
            const worldX = door.x * TILE_SIZE;
            const worldY = door.y * TILE_SIZE;
            const screenPos = camera.worldToScreen(worldX, worldY);
            
            // Only render if door is visible on screen
            if (screenPos.x < -TILE_SIZE || screenPos.x > camera.viewWidth ||
                screenPos.y < -TILE_SIZE || screenPos.y > camera.viewHeight) {
                continue;
            }
            
            this.drawDoor(screenPos.x, screenPos.y, door.color, door.unlocked);
        }
    }
    
    drawKey(x, y, color, time) {
        const ctx = this.ctx;
        const centerX = x + TILE_SIZE / 2;
        const centerY = y + TILE_SIZE / 2;
        
        // Bobbing animation
        const bobOffset = Math.sin(time * 3) * 2;
        const adjustedY = centerY + bobOffset;
        
        // Glow effect
        const glowIntensity = 0.4 + 0.3 * Math.sin(time * 4);
        ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.4})`;
        ctx.beginPath();
        ctx.arc(centerX, adjustedY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Get key color
        const keyColor = this.getKeyColor(color);
        
        // Key body (circular part)
        ctx.fillStyle = keyColor;
        ctx.beginPath();
        ctx.arc(centerX - 2, adjustedY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Key stem
        ctx.fillStyle = keyColor;
        ctx.fillRect(centerX + 2, adjustedY - 1, 6, 2);
        
        // Key teeth
        ctx.fillRect(centerX + 6, adjustedY - 3, 2, 2);
        ctx.fillRect(centerX + 8, adjustedY + 1, 2, 2);
        
        // Key highlight
        ctx.fillStyle = COLORS.KEY_GLOW;
        ctx.beginPath();
        ctx.arc(centerX - 3, adjustedY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawDoor(x, y, color, unlocked) {
        const ctx = this.ctx;
        
        if (unlocked) {
            // Draw unlocked door as open doorway with frame
            ctx.fillStyle = COLORS.DOOR_FRAME;
            ctx.fillRect(x, y, 4, TILE_SIZE);
            ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);
            ctx.fillRect(x, y, TILE_SIZE, 4);
            ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
        } else {
            // Draw locked door
            const doorColor = this.getDoorColor(color);
            
            // Door background
            ctx.fillStyle = doorColor;
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            
            // Door frame
            ctx.fillStyle = COLORS.DOOR_FRAME;
            ctx.fillRect(x, y, TILE_SIZE, 4);
            ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
            ctx.fillRect(x, y, 4, TILE_SIZE);
            ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);
            
            // Door panels
            ctx.fillStyle = this.getDoorColor(color + '_dark');
            ctx.fillRect(x + 6, y + 6, 8, 10);
            ctx.fillRect(x + 18, y + 6, 8, 10);
            ctx.fillRect(x + 6, y + 18, 8, 10);
            ctx.fillRect(x + 18, y + 18, 8, 10);
            
            // Door handle
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE - 8, y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Lock indicator (small keyhole)
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 2, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    getKeyColor(color) {
        const colors = {
            'red': COLORS.KEY_RED,
            'blue': COLORS.KEY_BLUE,
            'green': COLORS.KEY_GREEN,
            'yellow': COLORS.KEY_YELLOW
        };
        return colors[color] || COLORS.KEY_YELLOW;
    }
    
    getDoorColor(color) {
        const colors = {
            'red': COLORS.DOOR_RED,
            'blue': COLORS.DOOR_BLUE,
            'green': COLORS.DOOR_GREEN,
            'yellow': COLORS.DOOR_YELLOW,
            'red_dark': '#5a0000',
            'blue_dark': '#0c0c47',
            'green_dark': '#003200',
            'yellow_dark': '#8b7500'
        };
        return colors[color] || COLORS.DOOR_YELLOW;
    }
    
    renderPlayer(player, camera) {
        const renderPos = player.getRenderPosition();
        const worldX = renderPos.x * TILE_SIZE;
        const worldY = renderPos.y * TILE_SIZE;
        const screenPos = camera.worldToScreen(worldX, worldY);
        
        const centerX = screenPos.x + TILE_SIZE / 2;
        const centerY = screenPos.y + TILE_SIZE / 2;
        
        // Draw animated person sprite
        this.drawPersonSprite(centerX, centerY, player.facing, player.animationFrame, player.isMoving);
    }
    
    drawPersonSprite(x, y, facing, frame, isMoving) {
        const size = 24;
        const bodyHeight = 14;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(x - size/2 + 2, y + size/2 - 2, size - 4, 4);
        
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
        
        // Knight Helmet
        this.ctx.fillStyle = COLORS.ARMOR_DARK;
        this.ctx.fillRect(x - 6, bodyY - bodyHeight/2 - 10, 12, 8);
        
        // Helmet highlights
        this.ctx.fillStyle = COLORS.ARMOR_LIGHT;
        this.ctx.fillRect(x - 5, bodyY - bodyHeight/2 - 9, 2, 6);
        this.ctx.fillRect(x + 3, bodyY - bodyHeight/2 - 9, 2, 6);
        
        // Visor slot
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - 4, bodyY - bodyHeight/2 - 7, 8, 2);
        
        // Eyes through visor
        if (facing !== 'up') {
            this.ctx.fillStyle = '#fff';
            if (facing === 'down') {
                this.ctx.fillRect(x - 3, bodyY - bodyHeight/2 - 7, 2, 2);
                this.ctx.fillRect(x + 1, bodyY - bodyHeight/2 - 7, 2, 2);
            } else if (facing === 'left') {
                this.ctx.fillRect(x - 2, bodyY - bodyHeight/2 - 7, 2, 2);
            } else if (facing === 'right') {
                this.ctx.fillRect(x, bodyY - bodyHeight/2 - 7, 2, 2);
            }
        }
        
        // Chest armor
        this.ctx.fillStyle = COLORS.ARMOR_BASE;
        this.ctx.fillRect(x - 6, bodyY - bodyHeight/2, 12, bodyHeight);
        
        // Chest plate highlight
        this.ctx.fillStyle = COLORS.ARMOR_LIGHT;
        this.ctx.fillRect(x - 5, bodyY - bodyHeight/2 + 1, 3, bodyHeight - 2);
        
        // Chest emblem
        this.ctx.fillStyle = COLORS.ARMOR_ACCENT;
        this.ctx.fillRect(x - 1, bodyY - bodyHeight/2 + 3, 2, 3);
        
        // Arms (with armor)
        this.ctx.fillStyle = COLORS.ARMOR_DARK;
        
        if (facing === 'right' || facing === 'left') {
            // Side view arms
            this.ctx.fillRect(x - 7, bodyY - 2, 4, 6 + Math.abs(armSwing/2));
            this.ctx.fillRect(x + 3, bodyY - 2, 4, 6 + Math.abs(armSwing/2));
        } else {
            // Front/back view arms
            this.ctx.fillRect(x - 8, bodyY - 2 + armSwing, 5, 7);
            this.ctx.fillRect(x + 3, bodyY - 2 - armSwing, 5, 7);
        }
        
        // Sword on back (visible from behind and sides)
        if (facing === 'up' || facing === 'left' || facing === 'right') {
            // Sword handle
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x + 2, bodyY - bodyHeight/2 - 12, 3, 6);
            
            // Sword guard
            this.ctx.fillStyle = COLORS.ARMOR_ACCENT;
            this.ctx.fillRect(x - 1, bodyY - bodyHeight/2 - 7, 7, 2);
            
            // Sword blade (partial)
            this.ctx.fillStyle = COLORS.ARMOR_LIGHT;
            this.ctx.fillRect(x + 3, bodyY - bodyHeight/2 - 6, 2, 4);
        }
        
        // Leg armor
        this.ctx.fillStyle = COLORS.ARMOR_DARK;
        
        if (facing === 'right' || facing === 'left') {
            // Side view legs
            this.ctx.fillRect(x - 4 + legOffset, bodyY + bodyHeight/2, 4, 8);
            this.ctx.fillRect(x - legOffset, bodyY + bodyHeight/2, 4, 8);
            
            // Knee plates
            this.ctx.fillStyle = COLORS.ARMOR_BASE;
            this.ctx.fillRect(x - 3 + legOffset, bodyY + bodyHeight/2 + 2, 2, 2);
            this.ctx.fillRect(x + 1 - legOffset, bodyY + bodyHeight/2 + 2, 2, 2);
        } else {
            // Front/back view legs
            this.ctx.fillRect(x - 4 + legOffset, bodyY + bodyHeight/2, 3, 8);
            this.ctx.fillRect(x + 1 - legOffset, bodyY + bodyHeight/2, 3, 8);
            
            // Knee plates
            this.ctx.fillStyle = COLORS.ARMOR_BASE;
            this.ctx.fillRect(x - 3 + legOffset, bodyY + bodyHeight/2 + 2, 2, 2);
            this.ctx.fillRect(x + 1 - legOffset, bodyY + bodyHeight/2 + 2, 2, 2);
        }
        
        // Metal boots
        this.ctx.fillStyle = COLORS.ARMOR_DARK;
        if (facing === 'right' || facing === 'left') {
            this.ctx.fillRect(x - 4 + legOffset, bodyY + bodyHeight/2 + 7, 5, 3);
            this.ctx.fillRect(x - 1 - legOffset, bodyY + bodyHeight/2 + 7, 5, 3);
        } else {
            this.ctx.fillRect(x - 3 + legOffset, bodyY + bodyHeight/2 + 7, 4, 3);
            this.ctx.fillRect(x - 1 - legOffset, bodyY + bodyHeight/2 + 7, 4, 3);
        }
        
        // Boot highlights
        this.ctx.fillStyle = COLORS.ARMOR_BASE;
        if (facing === 'right' || facing === 'left') {
            this.ctx.fillRect(x - 3 + legOffset, bodyY + bodyHeight/2 + 7, 1, 2);
            this.ctx.fillRect(x - legOffset, bodyY + bodyHeight/2 + 7, 1, 2);
        } else {
            this.ctx.fillRect(x - 2 + legOffset, bodyY + bodyHeight/2 + 7, 1, 2);
            this.ctx.fillRect(x - legOffset, bodyY + bodyHeight/2 + 7, 1, 2);
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