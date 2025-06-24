// Maze generation and collision detection
class Maze {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.torches = []; // Array of torch positions {x, y, side}
        this.treasures = []; // Array of treasure positions {x, y, type, collected}
        this.keys = []; // Array of key positions {x, y, color, collected}
        this.doors = []; // Array of door positions {x, y, color, unlocked}
        this.pressurePlates = []; // Array of pressure plates {x, y, activated, affectedWalls, timer}
        this.levers = []; // Array of levers {x, y, activated, affectedCells}
        this.startX = 1;
        this.startY = 1;
        this.endX = width - 2;
        this.endY = height - 2;
        
        // Performance optimization: Spatial hash maps for O(1) lookups
        this.doorMap = new Map(); // "x,y" -> door object
        this.treasureMap = new Map(); // "x,y" -> treasure object
        this.keyMap = new Map(); // "x,y" -> key object
        this.pressurePlateMap = new Map(); // "x,y" -> pressure plate object
        this.leverMap = new Map(); // "x,y" -> lever object
        
        this.initializeGrid();
    }
    
    // STEP 3: Safe Grid Modification System
    
    modifyGridSafely(x, y, value, context = 'unknown') {
        // Validation wrapper for all grid modifications
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            console.error(`🚨 GRID SAFETY: Invalid coordinates (${x},${y}) in ${context}`);
            return false;
        }
        
        const oldValue = this.grid[y][x];
        this.grid[y][x] = value;
        
        // Track the modification for debugging
        if (context !== 'initialization' && context !== 'generation') {
            console.log(`🛡️ GRID MODIFICATION: (${x},${y}) ${oldValue}→${value} [${context}]`);
        }
        
        // Emergency validation for pressure plate interactions
        if (value === 0) { // Making it a floor
            this.validatePressurePlatePositions();
        }
        
        return true;
    }
    
    isValidGridPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    safeGetGridValue(x, y, defaultValue = 1) {
        if (!this.isValidGridPosition(x, y)) {
            return defaultValue; // Return wall by default for out-of-bounds
        }
        return this.grid[y][x];
    }
    
    initializeGrid() {
        // Initialize grid with all walls
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.modifyGridSafely(x, y, 1, 'initialization'); // 1 = wall, 0 = floor
            }
        }
    }
    
    generate(complexity = 0.5) {
        this.initializeGrid();
        
        // Recursive backtracking maze generation
        const stack = [];
        const startX = 1;
        const startY = 1;
        
        this.modifyGridSafely(startX, startY, 0, 'generation'); // Mark start as floor
        stack.push({ x: startX, y: startY });
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y);
            
            if (neighbors.length > 0) {
                // Choose random neighbor - complexity affects randomness
                let next;
                if (Math.random() < complexity) {
                    // Higher complexity: more random selection
                    next = neighbors[Math.floor(Math.random() * neighbors.length)];
                } else {
                    // Lower complexity: prefer first neighbor (creates wider paths)
                    next = neighbors[0];
                }
                
                // Remove wall between current and next
                const wallX = current.x + (next.x - current.x) / 2;
                const wallY = current.y + (next.y - current.y) / 2;
                
                this.modifyGridSafely(wallX, wallY, 0, 'generation');
                this.modifyGridSafely(next.x, next.y, 0, 'generation');
                
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        
        // Set random start and end positions
        this.setStartAndEnd();
        
        // Place torches along walls
        this.placeTorches();
        
        // Place treasures in accessible locations
        this.placeTreasures();
        
        // Place keys and doors strategically
        this.placeKeysAndDoors();
        
        // Place environmental puzzles
        this.placePressurePlates();
        this.placeLevers();
        
        // Ensure the puzzle is solvable (single attempt with comprehensive internal fallbacks)
        if (!this.ensureSolvability()) {
            console.warn('Solvability failed even with fallbacks - regenerating entire maze');
            // If solvability completely failed, regenerate the entire maze with simpler parameters
            this.generateSimpleMaze();
        }
        
        // Build spatial hash maps for performance
        this.buildSpatialMaps();
        
        // EMERGENCY FIX: Final validation of all pressure plate positions
        this.validatePressurePlatePositions();
        console.log('✅ Maze generation completed with pressure plate validation');
    }
    
    buildSpatialMaps() {
        // EMERGENCY FIX: Validate pressure plates before building maps
        this.validatePressurePlatePositions();
        
        // Clear existing maps
        this.doorMap.clear();
        this.treasureMap.clear();
        this.keyMap.clear();
        this.pressurePlateMap.clear();
        this.leverMap.clear();
        
        // Build hash maps for O(1) lookups
        for (const door of this.doors) {
            this.doorMap.set(`${door.x},${door.y}`, door);
        }
        
        for (const treasure of this.treasures) {
            if (!treasure.collected) {
                this.treasureMap.set(`${treasure.x},${treasure.y}`, treasure);
            }
        }
        
        for (const key of this.keys) {
            if (!key.collected) {
                this.keyMap.set(`${key.x},${key.y}`, key);
            }
        }
        
        // Build pressure plate map (already validated above)
        for (const plate of this.pressurePlates) {
            this.pressurePlateMap.set(`${plate.x},${plate.y}`, plate);
        }
        
        for (const lever of this.levers) {
            this.leverMap.set(`${lever.x},${lever.y}`, lever);
        }
    }
    
    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -2 }, // Up
            { x: 2, y: 0 },  // Right
            { x: 0, y: 2 },  // Down
            { x: -2, y: 0 }  // Left
        ];
        
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            
            if (newX > 0 && newX < this.width - 1 && 
                newY > 0 && newY < this.height - 1 && 
                this.grid[newY][newX] === 1) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }
    
    setStartAndEnd() {
        // Find all floor tiles
        const floorTiles = [];
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === 0) {
                    floorTiles.push({ x, y });
                }
            }
        }
        
        if (floorTiles.length >= 2) {
            // Use more strategic placement to ensure connectivity
            // Start near top-left corner of accessible area
            let startTile = floorTiles[0];
            let minStartScore = Infinity;
            
            for (const tile of floorTiles) {
                const score = tile.x + tile.y; // Prefer top-left
                if (score < minStartScore) {
                    minStartScore = score;
                    startTile = tile;
                }
            }
            
            this.startX = startTile.x;
            this.startY = startTile.y;
            
            // End near bottom-right corner, ensuring maximum distance
            let endTile = floorTiles[0];
            let maxDistance = 0;
            
            for (const tile of floorTiles) {
                const distance = Math.abs(tile.x - this.startX) + Math.abs(tile.y - this.startY);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    endTile = tile;
                }
            }
            
            this.endX = endTile.x;
            this.endY = endTile.y;
            
            // Multiple validation attempts for connectivity
            let connectivityAttempts = 0;
            while (!this.isBasicallyReachable() && connectivityAttempts < 3) {
                console.warn(`Start/End placement attempt ${connectivityAttempts + 1} - trying different positioning`);
                
                if (connectivityAttempts === 0) {
                    // First attempt: opposite corners
                    this.startX = 1;
                    this.startY = 1;
                    this.endX = this.width - 2;
                    this.endY = this.height - 2;
                } else if (connectivityAttempts === 1) {
                    // Second attempt: different corners
                    this.startX = this.width - 2;
                    this.startY = 1;
                    this.endX = 1;
                    this.endY = this.height - 2;
                } else {
                    // Final attempt: center-ish positions
                    this.startX = Math.floor(this.width / 4);
                    this.startY = Math.floor(this.height / 4);
                    this.endX = Math.floor(3 * this.width / 4);
                    this.endY = Math.floor(3 * this.height / 4);
                }
                
                // Ensure these positions are floor tiles
                this.grid[this.startY][this.startX] = 0;
                this.grid[this.endY][this.endX] = 0;
                
                // Create a guaranteed path if needed
                if (connectivityAttempts === 2) {
                    this.createGuaranteedPath();
                }
                
                connectivityAttempts++;
            }
            
            if (!this.isBasicallyReachable()) {
                console.error('Unable to create basic connectivity after multiple attempts');
            }
        }
    }
    
    placeTorches() {
        this.torches = [];
        const minDistance = 8; // Minimum distance between torches
        const torchDensity = 0.15; // Percentage of suitable walls that should have torches
        
        // Find all wall positions that could have torches
        const candidateWalls = [];
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === 1) { // Wall tile
                    // Check if this wall is adjacent to a floor tile
                    const adjacentToFloor = this.hasAdjacentFloor(x, y);
                    if (adjacentToFloor) {
                        candidateWalls.push({ x, y, side: this.getWallSide(x, y) });
                    }
                }
            }
        }
        
        // Place torches with minimum distance constraint
        for (const candidate of candidateWalls) {
            if (Math.random() < torchDensity) {
                // Check distance from existing torches
                let tooClose = false;
                for (const existingTorch of this.torches) {
                    const distance = Math.abs(candidate.x - existingTorch.x) + Math.abs(candidate.y - existingTorch.y);
                    if (distance < minDistance) {
                        tooClose = true;
                        break;
                    }
                }
                
                // Don't place torches too close to start or end
                const distanceFromStart = Math.abs(candidate.x - this.startX) + Math.abs(candidate.y - this.startY);
                const distanceFromEnd = Math.abs(candidate.x - this.endX) + Math.abs(candidate.y - this.endY);
                
                if (!tooClose && distanceFromStart > 3 && distanceFromEnd > 3) {
                    this.torches.push(candidate);
                }
            }
        }
    }
    
    hasAdjacentFloor(x, y) {
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }  // Left
        ];
        
        for (const dir of directions) {
            const checkX = x + dir.x;
            const checkY = y + dir.y;
            if (checkX >= 0 && checkX < this.width && 
                checkY >= 0 && checkY < this.height && 
                this.grid[checkY][checkX] === 0) {
                return true;
            }
        }
        return false;
    }
    
    getWallSide(x, y) {
        // Determine which side of the wall the torch should be on
        // Check which directions have floor tiles
        if (this.isFloor(x, y - 1)) return 'bottom'; // Floor above, torch on bottom
        if (this.isFloor(x + 1, y)) return 'left';   // Floor to right, torch on left
        if (this.isFloor(x, y + 1)) return 'top';    // Floor below, torch on top
        if (this.isFloor(x - 1, y)) return 'right';  // Floor to left, torch on right
        return 'bottom'; // Default
    }
    
    isWall(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true; // Out of bounds is considered a wall
        }
        
        // Check base grid first (fastest check)
        if (this.grid[y][x] === 1) {
            return true;
        }
        
        // Only check doors if base tile is floor - use hash map for O(1) lookup
        const door = this.doorMap.get(`${x},${y}`);
        if (door && !door.unlocked && !door.temporarilyOpen) {
            return true;
        }
        
        return false;
    }
    
    isFloor(x, y) {
        return !this.isWall(x, y);
    }
    
    placeTreasures() {
        this.treasures = [];
        const treasureTypes = ['coin', 'gem', 'chest'];
        const treasureWeights = {
            'coin': 0.6,     // 60% coins (common)
            'gem': 0.3,      // 30% gems (uncommon) 
            'chest': 0.1     // 10% chests (rare)
        };
        
        // Calculate treasure density based on maze size
        const totalFloorTiles = this.countFloorTiles();
        const treasureDensity = Math.max(0.05, Math.min(0.15, 8 / totalFloorTiles)); // 5-15% of floor tiles
        const numTreasures = Math.floor(totalFloorTiles * treasureDensity);
        
        // Find all potential treasure locations (floor tiles)
        const candidateLocations = [];
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === 0) { // Floor tile
                    candidateLocations.push({ x, y });
                }
            }
        }
        
        // Place treasures randomly, avoiding start/end positions
        const minDistanceFromStartEnd = 3;
        let placedTreasures = 0;
        
        while (placedTreasures < numTreasures && candidateLocations.length > 0) {
            const randomIndex = Math.floor(Math.random() * candidateLocations.length);
            const location = candidateLocations[randomIndex];
            
            // Check distance from start and end
            const distanceFromStart = Math.abs(location.x - this.startX) + Math.abs(location.y - this.startY);
            const distanceFromEnd = Math.abs(location.x - this.endX) + Math.abs(location.y - this.endY);
            
            if (distanceFromStart >= minDistanceFromStartEnd && distanceFromEnd >= minDistanceFromStartEnd) {
                // Select treasure type based on weights
                const treasureType = this.selectTreasureType(treasureWeights);
                
                this.treasures.push({
                    x: location.x,
                    y: location.y,
                    type: treasureType,
                    collected: false,
                    value: this.getTreasureValue(treasureType)
                });
                
                placedTreasures++;
            }
            
            // Remove this location from candidates
            candidateLocations.splice(randomIndex, 1);
        }
    }
    
    countFloorTiles() {
        let count = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 0) count++;
            }
        }
        return count;
    }
    
    selectTreasureType(weights) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [type, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (rand <= cumulative) {
                return type;
            }
        }
        return 'coin'; // Fallback
    }
    
    getTreasureValue(type) {
        const values = {
            'coin': 10,
            'gem': 50,
            'chest': 100
        };
        return values[type] || 10;
    }
    
    getTreasureAt(x, y) {
        return this.treasureMap.get(`${x},${y}`);
    }
    
    collectTreasure(x, y) {
        const treasure = this.treasureMap.get(`${x},${y}`);
        if (treasure) {
            treasure.collected = true;
            // Remove from spatial map since it's collected
            this.treasureMap.delete(`${x},${y}`);
            return treasure;
        }
        return null;
    }
    
    placeKeysAndDoors() {
        this.keys = [];
        this.doors = [];
        
        const keyColors = ['red', 'blue', 'green', 'yellow'];
        const maxKeyDoorPairs = Math.min(3, Math.floor(this.width * this.height / 200)); // Scale with maze size
        const numPairs = Math.max(1, maxKeyDoorPairs); // At least 1 pair
        
        // Get all floor tiles for key placement
        const floorTiles = [];
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === 0) {
                    floorTiles.push({ x, y });
                }
            }
        }
        
        // Get potential door locations (floor tiles that could block passages)
        const potentialDoorLocations = this.findStrategicDoorLocations();
        
        for (let i = 0; i < numPairs && potentialDoorLocations.length > 0; i++) {
            const color = keyColors[i % keyColors.length];
            
            // Place door first (more strategic)
            const doorIndex = Math.floor(Math.random() * potentialDoorLocations.length);
            const doorLocation = potentialDoorLocations[doorIndex];
            
            this.doors.push({
                x: doorLocation.x,
                y: doorLocation.y,
                color: color,
                unlocked: false
            });
            
            // Remove this location and nearby ones to avoid clustering
            potentialDoorLocations.splice(doorIndex, 1);
            this.removeNearbyLocations(potentialDoorLocations, doorLocation, 5);
            
            // Place corresponding key with reachability validation
            const availableKeySpots = this.findValidKeyPositions(floorTiles, doorLocation, color);
            
            if (availableKeySpots.length > 0) {
                const keySpot = availableKeySpots[Math.floor(Math.random() * availableKeySpots.length)];
                this.keys.push({
                    x: keySpot.x,
                    y: keySpot.y,
                    color: color,
                    collected: false
                });
            } else {
                // If no valid key position found, remove the door to avoid orphaned doors
                console.warn(`No valid key position found for ${color} door at (${doorLocation.x},${doorLocation.y}) - removing door`);
                this.doors.pop(); // Remove the door we just added
            }
        }
        
        // Final validation: Check for circular dependencies
        if (this.hasCircularDependencies()) {
            console.warn('Circular dependencies detected in key-door placement - simplifying');
            this.resolveCircularDependencies();
        }
    }
    
    findStrategicDoorLocations() {
        const locations = [];
        
        // Look for narrow passages and corridor intersections
        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (this.grid[y][x] === 0) { // Floor tile
                    // Check if this is a strategic chokepoint
                    if (this.isChokepoint(x, y) || this.isCorridorTile(x, y)) {
                        const distanceFromStart = Math.abs(x - this.startX) + Math.abs(y - this.startY);
                        const distanceFromEnd = Math.abs(x - this.endX) + Math.abs(y - this.endY);
                        
                        // Avoid placing doors too close to start/end
                        if (distanceFromStart >= 5 && distanceFromEnd >= 5) {
                            locations.push({ x, y });
                        }
                    }
                }
            }
        }
        
        return locations;
    }
    
    isChokepoint(x, y) {
        // A chokepoint has limited ways to get around it
        const directions = [
            { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
        ];
        
        let openDirections = 0;
        for (const dir of directions) {
            if (this.grid[y + dir.y] && this.grid[y + dir.y][x + dir.x] === 0) {
                openDirections++;
            }
        }
        
        return openDirections === 2; // Corridor tile
    }
    
    isCorridorTile(x, y) {
        // Check if this tile is part of a main corridor
        const horizontal = this.grid[y][x - 1] === 0 && this.grid[y][x + 1] === 0;
        const vertical = this.grid[y - 1][x] === 0 && this.grid[y + 1][x] === 0;
        
        return horizontal || vertical;
    }
    
    removeNearbyLocations(locations, center, minDistance) {
        for (let i = locations.length - 1; i >= 0; i--) {
            const location = locations[i];
            const distance = Math.abs(location.x - center.x) + Math.abs(location.y - center.y);
            if (distance < minDistance) {
                locations.splice(i, 1);
            }
        }
    }
    
    hasKeyAt(x, y) {
        return this.keyMap.has(`${x},${y}`);
    }
    
    getKeyAt(x, y) {
        return this.keyMap.get(`${x},${y}`);
    }
    
    hasTreasureAt(x, y) {
        return this.treasureMap.has(`${x},${y}`);
    }
    
    getDoorAt(x, y) {
        return this.doorMap.get(`${x},${y}`);
    }
    
    collectKey(x, y) {
        const key = this.keyMap.get(`${x},${y}`);
        if (key) {
            key.collected = true;
            // Remove from spatial map since it's collected
            this.keyMap.delete(`${x},${y}`);
            return key;
        }
        return null;
    }
    
    unlockDoor(x, y, keyColor) {
        const door = this.getDoorAt(x, y);
        if (door && door.color === keyColor && !door.unlocked) {
            door.unlocked = true;
            return door;
        }
        return null;
    }
    
    tryUnlockDoor(x, y, playerKeys) {
        const door = this.getDoorAt(x, y);
        if (door && !door.unlocked && playerKeys.includes(door.color)) {
            door.unlocked = true;
            return door;
        }
        return null;
    }
    
    placePressurePlates() {
        const plateCount = Math.max(1, Math.floor((this.width * this.height) / 200)); // 1 plate per ~200 tiles, minimum 1
        const locations = this.findGoodFloorTiles();
        
        for (let i = 0; i < plateCount && locations.length > 0; i++) {
            const index = Math.floor(Math.random() * locations.length);
            const location = locations[index];
            locations.splice(index, 1);
            
            // ROOT CAUSE #6 FIX: Validate the location is still a floor tile
            if (this.safeGetGridValue(location.x, location.y) !== 0) {
                console.warn(`🚨 PLACEMENT FIX: Skipping pressure plate at (${location.x},${location.y}) - not a floor tile`);
                continue; // Skip this location, it's not a floor tile
            }
            
            // Find walls that this plate will control
            const affectedWalls = this.findAffectedWalls(location.x, location.y);
            
            // Only place pressure plate if it has walls to affect
            if (affectedWalls.length > 0) {
                const plate = {
                    x: location.x,
                    y: location.y,
                    activated: false,
                    affectedWalls: affectedWalls,
                    timer: 0,
                    maxTimer: 300 // 5 seconds at 60fps
                };
                
                this.pressurePlates.push(plate);
                
                // IMMEDIATE VALIDATION: Double-check the plate position after placement
                if (this.safeGetGridValue(plate.x, plate.y) !== 0) {
                    console.error(`🚨 CRITICAL: Just placed pressure plate on non-floor at (${plate.x},${plate.y})`);
                    this.pressurePlates.pop(); // Remove the invalid plate immediately
                }
            }
        }
    }
    
    placeLevers() {
        const leverCount = Math.floor((this.width * this.height) / 300); // 1 lever per ~300 tiles
        const locations = this.findGoodFloorTiles();
        
        for (let i = 0; i < leverCount && locations.length > 0; i++) {
            const validLocation = this.findNonConflictingLeverLocation(locations);
            
            if (validLocation) {
                // Remove the selected location and nearby ones
                this.removeNearbyLocations(locations, validLocation, 8);
                
                // Find cells that this lever will affect
                const affectedCells = this.findAffectedCells(validLocation.x, validLocation.y);
                
                // Validate that affected cells don't conflict with pressure plates
                if (!this.leverConflictsWithPressurePlates(affectedCells)) {
                    this.levers.push({
                        x: validLocation.x,
                        y: validLocation.y,
                        activated: false,
                        affectedCells: affectedCells
                    });
                } else {
                    console.log(`Skipping lever at (${validLocation.x},${validLocation.y}) due to pressure plate conflicts`);
                }
            } else {
                console.log('No more valid lever locations available');
                break;
            }
        }
    }
    
    findGoodFloorTiles() {
        const tiles = [];
        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (this.grid[y][x] === 0 && // Floor tile
                    !this.hasKeyAt(x, y) && // No key here
                    !this.getTreasureAt(x, y) && // No treasure here
                    !this.getPressurePlateAt(x, y) && // No pressure plate here
                    !this.getLeverAt(x, y) && // No lever here
                    Math.abs(x - this.startX) + Math.abs(y - this.startY) > 3 && // Not too close to start
                    Math.abs(x - this.endX) + Math.abs(y - this.endY) > 3) { // Not too close to end
                    tiles.push({ x, y });
                }
            }
        }
        return tiles;
    }
    
    findAffectedWalls(plateX, plateY) {
        const walls = [];
        const directions = [
            { x: 0, y: -1, name: 'north' },  // Up
            { x: 1, y: 0, name: 'east' },   // Right  
            { x: 0, y: 1, name: 'south' },  // Down
            { x: -1, y: 0, name: 'west' }   // Left
        ];
        
        // Check walls in all 4 directions from the pressure plate
        for (const dir of directions) {
            const wallX = plateX + dir.x;
            const wallY = plateY + dir.y;
            
            // Only affect walls that are:
            // 1. Actually walls (not already floor)
            // 2. Not boundary walls
            // 3. Would create useful passages
            if (this.isWall(wallX, wallY) && 
                wallX > 0 && wallX < this.width - 1 && 
                wallY > 0 && wallY < this.height - 1 &&
                this.wouldCreateUsefulPassage(wallX, wallY, dir)) {
                
                walls.push({
                    x: wallX,
                    y: wallY,
                    direction: dir.name,
                    originalState: this.grid[wallY][wallX],
                    temporaryFloor: false
                });
            }
        }
        
        return walls;
    }
    
    wouldCreateUsefulPassage(wallX, wallY, direction) {
        // Check if removing this wall would create a meaningful shortcut
        // Look for floor tiles on the opposite side of the wall
        const oppositeX = wallX + direction.x;
        const oppositeY = wallY + direction.y;
        
        // Must have floor on the opposite side to create a passage
        if (oppositeX >= 0 && oppositeX < this.width && 
            oppositeY >= 0 && oppositeY < this.height) {
            return this.grid[oppositeY][oppositeX] === 0; // Floor tile
        }
        
        return false;
    }
    
    findAffectedCells(x, y) {
        const cells = [];
        // Create a small area around the lever that can be toggled between wall/floor
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const cellX = x + dx;
                const cellY = y + dy;
                if (cellX > 0 && cellX < this.width - 1 && 
                    cellY > 0 && cellY < this.height - 1 &&
                    Math.abs(dx) + Math.abs(dy) <= 2) { // Manhattan distance
                    cells.push({ x: cellX, y: cellY, originalState: this.grid[cellY][cellX] });
                }
            }
        }
        return cells;
    }
    
    getPressurePlateAt(x, y) {
        return this.pressurePlateMap.get(`${x},${y}`);
    }
    
    getLeverAt(x, y) {
        return this.leverMap.get(`${x},${y}`);
    }
    
    activatePressurePlate(x, y, particleSystem = null) {
        const plate = this.getPressurePlateAt(x, y);
        if (plate && !plate.activated) {
            plate.activated = true;
            plate.timer = plate.maxTimer;
            
            // Convert affected walls to temporary floors
            for (const wall of plate.affectedWalls) {
                this.grid[wall.y][wall.x] = 0; // Make it a floor
                wall.temporaryFloor = true;
                
                // Create wall opening particle effect
                if (particleSystem) {
                    particleSystem.createWallOpen(
                        wall.x * TILE_SIZE + TILE_SIZE / 2,
                        wall.y * TILE_SIZE + TILE_SIZE / 2
                    );
                }
            }
            return plate;
        }
        return null;
    }
    
    toggleLever(x, y) {
        const lever = this.getLeverAt(x, y);
        if (lever) {
            lever.activated = !lever.activated;
            
            // Toggle affected cells
            for (const cell of lever.affectedCells) {
                if (lever.activated) {
                    // When lever is on, make walls into floors (create passages)
                    if (cell.originalState === 1) {
                        this.grid[cell.y][cell.x] = 0;
                    }
                } else {
                    // When lever is off, restore original state
                    this.grid[cell.y][cell.x] = cell.originalState;
                }
            }
            return lever;
        }
        return null;
    }
    
    updatePressurePlates(particleSystem = null) {
        for (const plate of this.pressurePlates) {
            if (plate.activated && plate.timer > 0) {
                // Create warning particles when time is running low
                if (plate.timer === 60 && particleSystem) { // 1 second warning
                    for (const wall of plate.affectedWalls) {
                        if (wall.temporaryFloor) {
                            particleSystem.createWallClose(
                                wall.x * TILE_SIZE + TILE_SIZE / 2,
                                wall.y * TILE_SIZE + TILE_SIZE / 2
                            );
                        }
                    }
                }
                
                plate.timer--;
                if (plate.timer <= 0) {
                    plate.activated = false;
                    // Restore walls to their original state
                    for (const wall of plate.affectedWalls) {
                        this.grid[wall.y][wall.x] = wall.originalState;
                        wall.temporaryFloor = false;
                    }
                }
            }
        }
    }
    
    ensureSolvability() {
        let attempts = 0;
        const maxAttempts = 15;
        
        // First, ensure basic connectivity (maze structure is sound)
        if (!this.isBasicallyReachable()) {
            console.warn('Maze structure is fundamentally flawed - fixing start/end positions');
            this.setStartAndEnd();
            if (!this.isBasicallyReachable()) {
                console.warn('Still unreachable after fixing positions - force regeneration');
                return false;
            }
        }
        
        while (attempts < maxAttempts) {
            if (this.isPuzzleSolvable()) {
                console.log(`Solvable puzzle found after ${attempts + 1} attempts`);
                
                // EMERGENCY FIX: Validate pressure plates before Phase 2
                this.validatePressurePlatePositions();
                
                // PHASE 2: Attempt to add redundant paths for extra solvability
                if (this.shouldAddRedundantPaths() && attempts < 5) {
                    this.addRedundantSolutionPaths();
                    
                    // EMERGENCY FIX: Validate after adding redundant paths
                    this.validatePressurePlatePositions();
                    
                    // Verify redundant paths maintain solvability
                    if (this.validateMultipleSolutionPaths()) {
                        console.log('Multiple solution paths validated successfully');
                    } else {
                        console.warn('Redundant paths broke solvability - reverting');
                        this.revertToSinglePath();
                        // EMERGENCY FIX: Validate after reversion
                        this.validatePressurePlatePositions();
                    }
                }
                
                return true;
            }
            
            // More aggressive simplification strategy
            if (attempts < 2) {
                this.placeKeysAndDoors();
            } else if (attempts < 4) {
                this.simplifyEnvironmentalPuzzles();
                // EMERGENCY FIX: Validate after puzzle simplification
                this.validatePressurePlatePositions();
                this.placeKeysAndDoors();
            } else if (attempts < 8) {
                this.removeAllPuzzleElements();
                this.placeKeysAndDoorsConservatively();
            } else if (attempts < 12) {
                this.removeAllPuzzleElements();
                this.placeSingleKeyDoorPair();
            } else {
                this.removeAllPuzzleElements();
            }
            
            this.buildKeysAndDoorsMaps();
            // EMERGENCY FIX: Validate after each solvability attempt
            this.validatePressurePlatePositions();
            attempts++;
        }
        
        // Final fallback: completely clean maze with guaranteed connectivity
        this.removeAllPuzzleElements();
        this.buildSpatialMaps();
        // EMERGENCY FIX: Validate after final cleanup
        this.validatePressurePlatePositions();
        
        const finalCheck = this.isPuzzleSolvable();
        const basicCheck = this.isBasicallyReachable();
        
        if (finalCheck || basicCheck) {
            return true;
        } else {
            console.error('CRITICAL: Even clean maze is not solvable');
            console.error(`Start: (${this.startX},${this.startY}), End: (${this.endX},${this.endY})`);
            console.error('Basic maze grid connectivity may be broken');
            return false;
        }
    }
    
    // Generate a very simple, guaranteed solvable maze
    generateSimpleMaze() {
        // Regenerate basic maze structure with lower complexity
        this.initializeGrid();
        
        // Use recursive backtracking with minimal complexity
        const stack = [];
        const startX = 1;
        const startY = 1;
        
        this.modifyGridSafely(startX, startY, 0, 'fallback-generation');
        stack.push({ x: startX, y: startY });
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y);
            
            if (neighbors.length > 0) {
                // Always pick first neighbor for wider paths (complexity = 0)
                const next = neighbors[0];
                
                const wallX = current.x + (next.x - current.x) / 2;
                const wallY = current.y + (next.y - current.y) / 2;
                
                this.modifyGridSafely(wallX, wallY, 0, 'fallback-generation');
                this.modifyGridSafely(next.x, next.y, 0, 'fallback-generation');
                
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        
        // Set simple start and end positions
        this.setStartAndEnd();
        
        // Place minimal elements
        this.torches = [];
        this.treasures = [];
        this.keys = [];
        this.doors = [];
        this.pressurePlates = [];
        this.levers = [];
        
        // Place only torches for visibility
        this.placeTorches();
        
        // Build spatial maps
        this.buildSpatialMaps();
        
        // Verify the simple maze is actually solvable
        if (!this.isBasicallyReachable()) {
            console.error('Generated simple maze is still not reachable - using fallback positions');
            // Force basic connectivity with standard positions
            this.startX = 1;
            this.startY = 1;
            this.endX = this.width - 2;
            this.endY = this.height - 2;
            
            // Ensure these are floor tiles
            this.modifyGridSafely(1, 1, 0, 'fallback-connectivity');
            this.modifyGridSafely(this.width - 2, this.height - 2, 0, 'fallback-connectivity');
        }
    }
    
    // Helper method to remove all puzzle elements
    removeAllPuzzleElements() {
        this.keys = [];
        this.doors = [];
        this.pressurePlates = [];
        this.levers = [];
    }
    
    // Helper method to place just one key-door pair
    placeSingleKeyDoorPair() {
        this.keys = [];
        this.doors = [];
        
        // Find the most obvious corridor location
        const corridors = this.findObviousChokepoints();
        if (corridors.length === 0) {
            return; // No suitable locations
        }
        
        const doorLocation = corridors[0]; // Take the first/best location
        
        // Place red door
        this.doors.push({
            x: doorLocation.x,
            y: doorLocation.y,
            color: 'red',
            unlocked: false
        });
        
        // Find a safe key location very far from the door
        const floorTiles = [];
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === 0) {
                    const distanceFromStart = Math.abs(x - this.startX) + Math.abs(y - this.startY);
                    const distanceFromEnd = Math.abs(x - this.endX) + Math.abs(y - this.endY);
                    const distanceFromDoor = Math.abs(x - doorLocation.x) + Math.abs(y - doorLocation.y);
                    
                    if (distanceFromStart >= 5 && distanceFromEnd >= 8 && distanceFromDoor >= 15) {
                        floorTiles.push({ x, y, distanceFromDoor });
                    }
                }
            }
        }
        
        if (floorTiles.length > 0) {
            // Sort by distance from door (farthest first)
            floorTiles.sort((a, b) => b.distanceFromDoor - a.distanceFromDoor);
            const keyLocation = floorTiles[0];
            
            this.keys.push({
                x: keyLocation.x,
                y: keyLocation.y,
                color: 'red',
                collected: false
            });
        } else {
            // Remove the door if no valid key location
            this.doors = [];
        }
    }
    
    buildKeysAndDoorsMaps() {
        // Clear and rebuild only keys and doors maps
        this.doorMap.clear();
        this.keyMap.clear();
        
        for (const door of this.doors) {
            this.doorMap.set(`${door.x},${door.y}`, door);
        }
        
        for (const key of this.keys) {
            if (!key.collected) {
                this.keyMap.set(`${key.x},${key.y}`, key);
            }
        }
    }
    
    isPuzzleSolvable() {
        // Check if all keys are reachable and end is reachable with all keys
        const allKeyColors = [...new Set(this.keys.map(k => k.color))];
        
        // If no keys exist, check basic reachability including environmental puzzles
        if (allKeyColors.length === 0) {
            // Check multiple pathfinding approaches for keyless mazes
            const basicReachable = this.isBasicallyReachable();
            const withPuzzles = this.getReachablePositions(this.startX, this.startY, new Set()).has(`${this.endX},${this.endY}`);
            const solvable = basicReachable || withPuzzles;
            
            if (!solvable) {
                console.warn(`End not reachable without keys from (${this.startX},${this.startY}) to (${this.endX},${this.endY})`);
            }
            
            return solvable;
        }
        
        // Get all reachable states
        const reachableStates = this.getAllReachableStates();
        
        if (reachableStates.length === 0) {
            console.warn('No reachable states found - fundamental pathfinding issue');
            return false;
        }
        
        // Check if we can collect all keys (intermediate validation)
        for (const keyColor of allKeyColors) {
            const canReachThisKey = reachableStates.some(state => state.keys.has(keyColor));
            
            if (!canReachThisKey) {
                console.warn(`Key ${keyColor} is never reachable`);
                return false;
            }
        }
        
        // Find state with all keys
        const endState = this.findStateWithKeys(reachableStates, allKeyColors);
        
        if (!endState) {
            console.warn(`Could not find state with all keys: ${allKeyColors.join(', ')}`);
            console.warn(`Available states: ${reachableStates.length}`);
            console.warn('State key combinations:', reachableStates.map(s => Array.from(s.keys).join(',')));
            return false;
        }
        
        // Check if end position is reachable in that state
        const endReachable = endState.reachablePositions.has(`${this.endX},${this.endY}`);
        
        if (!endReachable) {
            console.warn(`End position (${this.endX},${this.endY}) not reachable with all keys`);
            console.warn(`Final state has ${endState.reachablePositions.size} reachable positions`);
        }
        
        return endReachable;
    }
    
    getAllReachableStates() {
        // State = { keys: Set of key colors, reachablePositions: Set of "x,y" strings }
        const visited = new Map(); // Map of key combinations to reachable positions
        const queue = [];
        
        // Initial state: no keys, reachable from start
        const initialKeys = new Set();
        const initialReachable = this.getReachablePositions(this.startX, this.startY, initialKeys);
        const initialState = {
            keys: initialKeys,
            reachablePositions: initialReachable
        };
        
        queue.push(initialState);
        visited.set(this.keysToString(initialKeys), initialReachable);
        
        // Track progress to avoid infinite loops with convergence detection
        let iterations = 0;
        const maxIterations = Math.max(200, Math.pow(2, this.keys.length) + 50);
        let lastVisitedSize = 0;
        let stagnantIterations = 0;
        
        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const currentState = queue.shift();
            
            // Find all keys reachable in current state
            const newKeys = this.findReachableKeys(currentState);
            
            // Process each reachable key individually
            for (const newKey of newKeys) {
                const newKeySet = new Set([...currentState.keys, newKey]);
                const keyString = this.keysToString(newKeySet);
                
                if (!visited.has(keyString)) {
                    // Calculate new reachable positions with this key set
                    const newReachable = this.getReachablePositions(this.startX, this.startY, newKeySet);
                    
                    // Validate that this state is genuinely useful
                    if (newReachable.size >= currentState.reachablePositions.size) {
                        const newState = {
                            keys: newKeySet,
                            reachablePositions: newReachable
                        };
                        
                        visited.set(keyString, newReachable);
                        queue.push(newState);
                    }
                }
            }
            
            // Check for convergence (no new states discovered)
            if (visited.size === lastVisitedSize) {
                stagnantIterations++;
                if (stagnantIterations >= 10) {
                    console.log(`State exploration converged after ${iterations} iterations`);
                    break;
                }
            } else {
                stagnantIterations = 0;
                lastVisitedSize = visited.size;
            }
        }
        
        if (iterations >= maxIterations) {
            console.warn(`State exploration hit iteration limit (${maxIterations}) - may have missed some states`);
        }
        
        // Convert visited map to array of states
        const states = [];
        for (const [keyString, positions] of visited.entries()) {
            const keys = this.stringToKeys(keyString);
            states.push({ keys, reachablePositions: positions });
        }
        
        return states;
    }
    
    getReachablePositions(startX, startY, availableKeys) {
        const visited = new Set();
        const queue = [{ x: startX, y: startY }];
        visited.add(`${startX},${startY}`);
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            // Check all four directions
            const directions = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
            ];
            
            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;
                const posKey = `${newX},${newY}`;
                
                if (visited.has(posKey)) continue;
                if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) continue;
                
                // Check if position is accessible
                if (this.isPositionAccessible(newX, newY, availableKeys)) {
                    visited.add(posKey);
                    queue.push({ x: newX, y: newY });
                }
            }
        }
        
        return visited;
    }
    
    isPositionAccessible(x, y, availableKeys, considerPuzzles = true) {
        // Check if it's a wall in the base grid
        if (this.grid[y][x] === 1) {
            // Check if this wall can be opened by environmental puzzles
            if (considerPuzzles) {
                // Check if any pressure plate affects this wall AND the plate is reachable
                for (const plate of this.pressurePlates) {
                    for (const wall of plate.affectedWalls) {
                        if (wall.x === x && wall.y === y) {
                            // Verify the pressure plate itself is reachable
                            if (this.isPuzzleElementReachable(plate.x, plate.y, availableKeys)) {
                                return true;
                            }
                        }
                    }
                }
                
                // Check if any lever affects this cell AND the lever is reachable
                for (const lever of this.levers) {
                    for (const cell of lever.affectedCells) {
                        if (cell.x === x && cell.y === y && cell.originalState === 1) {
                            // Verify the lever itself is reachable
                            if (this.isPuzzleElementReachable(lever.x, lever.y, availableKeys)) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
        
        // Check if there's a door
        const door = this.getDoorAt(x, y);
        if (door) {
            // Door is accessible if we have the key or it's already unlocked
            return door.unlocked || availableKeys.has(door.color);
        }
        
        return true; // Floor tile
    }
    
    findReachableKeys(state) {
        const reachableKeys = [];
        const checkedPositions = new Set();
        
        for (const key of this.keys) {
            if (key.collected || state.keys.has(key.color)) continue;
            
            const posKey = `${key.x},${key.y}`;
            
            // Use cached reachable positions first for efficiency
            if (state.reachablePositions.has(posKey)) {
                reachableKeys.push(key.color);
            } else if (!checkedPositions.has(posKey)) {
                // Only do expensive pathfinding if not in cached positions
                const canReachKey = this.canReachPosition(key.x, key.y, state.keys);
                if (canReachKey) {
                    reachableKeys.push(key.color);
                }
                checkedPositions.add(posKey);
            }
        }
        
        return reachableKeys;
    }
    
    // Helper method to verify a position is truly reachable with given keys
    canReachPosition(targetX, targetY, availableKeys) {
        const visited = new Set();
        const queue = [{ x: this.startX, y: this.startY }];
        visited.add(`${this.startX},${this.startY}`);
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            if (x === targetX && y === targetY) {
                return true;
            }
            
            const directions = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
            ];
            
            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;
                const posKey = `${newX},${newY}`;
                
                if (visited.has(posKey)) continue;
                if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) continue;
                
                if (this.isPositionAccessible(newX, newY, availableKeys)) {
                    visited.add(posKey);
                    queue.push({ x: newX, y: newY });
                }
            }
        }
        
        return false;
    }
    
    // Helper method to verify if a puzzle element (pressure plate or lever) is reachable
    isPuzzleElementReachable(puzzleX, puzzleY, availableKeys) {
        // Use pathfinding without considering puzzles to avoid circular logic
        const visited = new Set();
        const queue = [{ x: this.startX, y: this.startY }];
        visited.add(`${this.startX},${this.startY}`);
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            if (x === puzzleX && y === puzzleY) {
                return true;
            }
            
            const directions = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
            ];
            
            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;
                const posKey = `${newX},${newY}`;
                
                if (visited.has(posKey)) continue;
                if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) continue;
                
                // Check accessibility WITHOUT considering puzzles to avoid infinite recursion
                if (this.isPositionAccessible(newX, newY, availableKeys, false)) {
                    visited.add(posKey);
                    queue.push({ x: newX, y: newY });
                }
            }
        }
        
        return false;
    }
    
    // Find valid key positions with reachability validation
    findValidKeyPositions(floorTiles, doorLocation, keyColor) {
        const validPositions = [];
        
        // Get keys that are already placed (to check for reachability)
        const currentKeys = new Set(this.keys.map(k => k.color));
        
        for (const tile of floorTiles) {
            // Basic distance filtering
            const distanceFromStart = Math.abs(tile.x - this.startX) + Math.abs(tile.y - this.startY);
            const distanceFromEnd = Math.abs(tile.x - this.endX) + Math.abs(tile.y - this.endY);
            const distanceFromDoor = Math.abs(tile.x - doorLocation.x) + Math.abs(tile.y - doorLocation.y);
            
            if (distanceFromStart >= 3 && distanceFromEnd >= 5 && 
                distanceFromDoor >= 8 && !this.hasKeyAt(tile.x, tile.y)) {
                
                // Critical: Verify this key position is reachable WITHOUT the door it unlocks
                if (this.isKeyPositionReachable(tile.x, tile.y, doorLocation, currentKeys)) {
                    validPositions.push(tile);
                }
            }
        }
        
        return validPositions;
    }
    
    // Check if a key position is reachable without using the door it unlocks
    isKeyPositionReachable(keyX, keyY, doorLocation, currentKeys) {
        const visited = new Set();
        const queue = [{ x: this.startX, y: this.startY }];
        visited.add(`${this.startX},${this.startY}`);
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            if (x === keyX && y === keyY) {
                return true;
            }
            
            const directions = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
            ];
            
            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;
                const posKey = `${newX},${newY}`;
                
                if (visited.has(posKey)) continue;
                if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) continue;
                
                // Skip the door we're trying to place a key for
                if (newX === doorLocation.x && newY === doorLocation.y) {
                    continue;
                }
                
                // Check accessibility with current keys but WITHOUT the new door
                if (this.isPositionAccessible(newX, newY, currentKeys)) {
                    visited.add(posKey);
                    queue.push({ x: newX, y: newY });
                }
            }
        }
        
        return false;
    }
    
    // Detect circular dependencies in key-door placement
    hasCircularDependencies() {
        // Build dependency graph: key -> doors it can unlock
        const keyToDoors = new Map();
        const doorToKey = new Map();
        
        for (const door of this.doors) {
            doorToKey.set(`${door.x},${door.y}`, door.color);
        }
        
        for (const key of this.keys) {
            if (!keyToDoors.has(key.color)) {
                keyToDoors.set(key.color, []);
            }
        }
        
        // Check if any key is only reachable through doors that require keys not yet accessible
        for (const key of this.keys) {
            if (this.isKeyCircularlyDependent(key)) {
                console.warn(`Circular dependency detected for ${key.color} key at (${key.x},${key.y})`);
                return true;
            }
        }
        
        return false;
    }
    
    // Check if a specific key has circular dependencies
    isKeyCircularlyDependent(targetKey) {
        // Can we reach this key without using its own color door?
        const availableColors = new Set(this.keys.filter(k => k !== targetKey).map(k => k.color));
        
        // Try to reach the key without its own color
        const visited = new Set();
        const queue = [{ x: this.startX, y: this.startY }];
        visited.add(`${this.startX},${this.startY}`);
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            if (x === targetKey.x && y === targetKey.y) {
                return false; // Key is reachable without circular dependency
            }
            
            const directions = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
            ];
            
            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;
                const posKey = `${newX},${newY}`;
                
                if (visited.has(posKey)) continue;
                if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) continue;
                
                // Check accessibility WITHOUT the target key's color
                if (this.isPositionAccessible(newX, newY, availableColors)) {
                    visited.add(posKey);
                    queue.push({ x: newX, y: newY });
                }
            }
        }
        
        return true; // Key is NOT reachable without its own color - circular dependency!
    }
    
    // Resolve circular dependencies by removing problematic key-door pairs
    resolveCircularDependencies() {
        const problemKeys = [];
        
        // Identify all keys with circular dependencies
        for (const key of this.keys) {
            if (this.isKeyCircularlyDependent(key)) {
                problemKeys.push(key);
            }
        }
        
        // Remove problematic key-door pairs (remove doors first to avoid orphaned keys)
        for (const key of problemKeys) {
            // Remove corresponding door
            this.doors = this.doors.filter(door => door.color !== key.color);
            console.log(`Removed ${key.color} door to resolve circular dependency`);
        }
        
        // Remove the problematic keys
        for (const key of problemKeys) {
            this.keys = this.keys.filter(k => k !== key);
            console.log(`Removed ${key.color} key at (${key.x},${key.y}) to resolve circular dependency`);
        }
        
        // Rebuild spatial maps after changes
        this.buildKeysAndDoorsMaps();
    }
    
    // Create a guaranteed path between start and end positions
    createGuaranteedPath() {
        console.log('Creating guaranteed path between start and end');
        
        // Simple path creation: horizontal then vertical movement
        let currentX = this.startX;
        let currentY = this.startY;
        
        // Horizontal movement toward end
        while (currentX !== this.endX) {
            this.modifyGridSafely(currentX, currentY, 0, 'guaranteed-path'); // Ensure floor
            currentX += currentX < this.endX ? 1 : -1;
        }
        
        // Vertical movement toward end
        while (currentY !== this.endY) {
            this.modifyGridSafely(currentX, currentY, 0, 'guaranteed-path'); // Ensure floor
            currentY += currentY < this.endY ? 1 : -1;
        }
        
        // Ensure end position is floor
        this.modifyGridSafely(this.endX, this.endY, 0, 'guaranteed-path');
        
        console.log(`Guaranteed path created from (${this.startX},${this.startY}) to (${this.endX},${this.endY})`);
        
        // EMERGENCY FIX: Validate pressure plates after creating guaranteed path
        this.validatePressurePlatePositions();
    }
    
    // Find a lever location that doesn't conflict with existing puzzles
    findNonConflictingLeverLocation(locations) {
        for (const location of locations) {
            // Check distance from existing pressure plates
            let conflictsWithPlates = false;
            for (const plate of this.pressurePlates) {
                const distance = Math.abs(location.x - plate.x) + Math.abs(location.y - plate.y);
                if (distance < 8) { // Minimum separation between puzzle types
                    conflictsWithPlates = true;
                    break;
                }
            }
            
            // Check distance from existing levers
            let conflictsWithLevers = false;
            for (const lever of this.levers) {
                const distance = Math.abs(location.x - lever.x) + Math.abs(location.y - lever.y);
                if (distance < 10) { // Minimum separation between levers
                    conflictsWithLevers = true;
                    break;
                }
            }
            
            if (!conflictsWithPlates && !conflictsWithLevers) {
                return location;
            }
        }
        
        return null; // No valid location found
    }
    
    // Check if lever's affected cells conflict with pressure plate walls
    leverConflictsWithPressurePlates(affectedCells) {
        for (const cell of affectedCells) {
            // Check if this cell is controlled by any pressure plate
            for (const plate of this.pressurePlates) {
                for (const wall of plate.affectedWalls) {
                    if (wall.x === cell.x && wall.y === cell.y) {
                        console.log(`Lever cell (${cell.x},${cell.y}) conflicts with pressure plate wall`);
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    findStateWithKeys(states, requiredKeys) {
        for (const state of states) {
            const hasAllKeys = requiredKeys.every(key => state.keys.has(key));
            if (hasAllKeys) {
                return state;
            }
        }
        return null;
    }
    
    keysToString(keySet) {
        return Array.from(keySet).sort().join(',');
    }
    
    stringToKeys(keyString) {
        if (!keyString) return new Set();
        return new Set(keyString.split(','));
    }
    
    // Basic reachability check - ensures start and end are connected
    isBasicallyReachable() {
        const visited = new Set();
        const queue = [{ x: this.startX, y: this.startY }];
        visited.add(`${this.startX},${this.startY}`);
        
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            // If we reached the end, basic connectivity is confirmed
            if (x === this.endX && y === this.endY) {
                return true;
            }
            
            // Check all four directions
            const directions = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
            ];
            
            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;
                const posKey = `${newX},${newY}`;
                
                if (visited.has(posKey)) continue;
                if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) continue;
                
                // Only check basic grid - ignore doors for this test
                if (this.grid[newY][newX] === 0) {
                    visited.add(posKey);
                    queue.push({ x: newX, y: newY });
                }
            }
        }
        
        return false; // End is not reachable
    }
    
    // Conservative key-door placement with fewer pairs and better spacing
    placeKeysAndDoorsConservatively() {
        this.keys = [];
        this.doors = [];
        
        const keyColors = ['red', 'blue', 'green', 'yellow'];
        // Reduce key-door pairs for conservative placement
        const maxKeyDoorPairs = Math.min(1, Math.floor(this.width * this.height / 400)); // Ultra conservative - max 1 pair
        const numPairs = Math.max(1, maxKeyDoorPairs);
        
        // Get all floor tiles for key placement
        const floorTiles = [];
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === 0) {
                    floorTiles.push({ x, y });
                }
            }
        }
        
        // Get potential door locations (only obvious chokepoints)
        const potentialDoorLocations = this.findObviousChokepoints();
        
        if (potentialDoorLocations.length === 0) {
            console.warn('No suitable door locations found - skipping key-door pairs');
            return;
        }
        
        for (let i = 0; i < numPairs && potentialDoorLocations.length > 0; i++) {
            const color = keyColors[i % keyColors.length];
            
            // Place door at the most obvious chokepoint
            const doorLocation = potentialDoorLocations.shift();
            
            this.doors.push({
                x: doorLocation.x,
                y: doorLocation.y,
                color: color,
                unlocked: false
            });
            
            // Remove nearby locations to avoid clustering
            this.removeNearbyLocations(potentialDoorLocations, doorLocation, 8);
            
            // Place corresponding key with very generous spacing
            const availableKeySpots = floorTiles.filter(tile => {
                const distanceFromStart = Math.abs(tile.x - this.startX) + Math.abs(tile.y - this.startY);
                const distanceFromEnd = Math.abs(tile.x - this.endX) + Math.abs(tile.y - this.endY);
                const distanceFromDoor = Math.abs(tile.x - doorLocation.x) + Math.abs(tile.y - doorLocation.y);
                
                return distanceFromStart >= 5 && distanceFromEnd >= 8 && 
                       distanceFromDoor >= 12 && !this.hasKeyAt(tile.x, tile.y); // More conservative spacing
            });
            
            if (availableKeySpots.length > 0) {
                const keySpot = availableKeySpots[Math.floor(Math.random() * availableKeySpots.length)];
                this.keys.push({
                    x: keySpot.x,
                    y: keySpot.y,
                    color: color,
                    collected: false
                });
            } else {
                // Remove the door if no valid key placement found
                this.doors.pop();
            }
        }
    }
    
    // Find only the most obvious chokepoints to avoid complex scenarios
    findObviousChokepoints() {
        const locations = [];
        
        for (let y = 3; y < this.height - 3; y++) {
            for (let x = 3; x < this.width - 3; x++) {
                if (this.grid[y][x] === 0) { // Floor tile
                    // Only select tiles that are clearly in narrow corridors
                    if (this.isObviousCorridor(x, y)) {
                        const distanceFromStart = Math.abs(x - this.startX) + Math.abs(y - this.startY);
                        const distanceFromEnd = Math.abs(x - this.endX) + Math.abs(y - this.endY);
                        
                        // More conservative distance requirements
                        if (distanceFromStart >= 8 && distanceFromEnd >= 8) {
                            locations.push({ x, y });
                        }
                    }
                }
            }
        }
        
        // Sort by distance from center to prefer central chokepoints
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        locations.sort((a, b) => {
            const distA = Math.abs(a.x - centerX) + Math.abs(a.y - centerY);
            const distB = Math.abs(b.x - centerX) + Math.abs(b.y - centerY);
            return distA - distB;
        });
        
        return locations;
    }
    
    // Check if a tile is in an obvious corridor (stricter than before)
    isObviousCorridor(x, y) {
        // Must be a clear horizontal OR vertical corridor
        const horizontal = this.grid[y][x - 1] === 0 && this.grid[y][x + 1] === 0 &&
                          this.grid[y - 1][x] === 1 && this.grid[y + 1][x] === 1;
        const vertical = this.grid[y - 1][x] === 0 && this.grid[y + 1][x] === 0 &&
                        this.grid[y][x - 1] === 1 && this.grid[y][x + 1] === 1;
        
        return horizontal || vertical;
    }
    
    // Simplify environmental puzzles to reduce interference
    simplifyEnvironmentalPuzzles() {
        // Remove pressure plates that affect critical paths
        this.pressurePlates = this.pressurePlates.filter(plate => {
            // Keep only plates that don't affect walls near the start/end or between key-door pairs
            const isNearCritical = plate.affectedWalls.some(wall => {
                const distFromStart = Math.abs(wall.x - this.startX) + Math.abs(wall.y - this.startY);
                const distFromEnd = Math.abs(wall.x - this.endX) + Math.abs(wall.y - this.endY);
                return distFromStart < 10 || distFromEnd < 10;
            });
            return !isNearCritical;
        });
        
        // Reduce number of levers
        if (this.levers.length > 1) {
            this.levers = this.levers.slice(0, 1); // Keep only one lever
        }
        
        // Rebuild spatial maps for environmental puzzles
        this.pressurePlateMap.clear();
        this.leverMap.clear();
        
        for (const plate of this.pressurePlates) {
            this.pressurePlateMap.set(`${plate.x},${plate.y}`, plate);
        }
        
        for (const lever of this.levers) {
            this.leverMap.set(`${lever.x},${lever.y}`, lever);
        }
    }
    
    // EMERGENCY FIX: Pressure Plate Position Validation
    
    validatePressurePlatePositions() {
        const originalCount = this.pressurePlates.length;
        
        // Remove any pressure plates that are now on walls
        this.pressurePlates = this.pressurePlates.filter(plate => {
            if (this.grid[plate.y][plate.x] !== 0) {
                console.warn(`🚨 EMERGENCY FIX: Removing pressure plate at (${plate.x},${plate.y}) - found inside wall`);
                return false;
            }
            return true;
        });
        
        // Log validation results
        const removedCount = originalCount - this.pressurePlates.length;
        if (removedCount > 0) {
            console.warn(`🛠️ Validation removed ${removedCount} pressure plate(s) from walls`);
        }
        
        // Rebuild pressure plate spatial map after removal
        this.pressurePlateMap.clear();
        for (const plate of this.pressurePlates) {
            this.pressurePlateMap.set(`${plate.x},${plate.y}`, plate);
        }
    }
    
    // PHASE 2: Multi-path Strategy Methods
    
    getAccessibleFloorTiles() {
        const floorTiles = [];
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === 0) { // Floor tile
                    floorTiles.push({ x, y });
                }
            }
        }
        
        return floorTiles;
    }
    
    shouldAddRedundantPaths() {
        // Only add redundant paths for medium+ difficulty and larger mazes
        const mazeSize = this.width * this.height;
        const hasEnoughKeys = this.keys.length >= 2;
        const hasEnoughSpace = mazeSize >= 600; // 20x30 or larger
        
        return hasEnoughKeys && hasEnoughSpace;
    }
    
    addRedundantSolutionPaths() {
        console.log('Adding redundant solution paths for extra robustness...');
        
        // Store original state for potential reversion
        this.backupPuzzleState();
        
        // Strategy 1: Add duplicate keys in different locations
        this.addDuplicateKeys();
        
        // Strategy 2: Create alternative paths through environmental puzzles
        this.createAlternativePuzzlePaths();
        
        // Strategy 3: Add bypass routes around critical doors
        this.createBypassRoutes();
        
        this.buildSpatialMaps();
    }
    
    backupPuzzleState() {
        this.backupState = {
            keys: JSON.parse(JSON.stringify(this.keys)),
            doors: JSON.parse(JSON.stringify(this.doors)),
            pressurePlates: JSON.parse(JSON.stringify(this.pressurePlates)),
            levers: JSON.parse(JSON.stringify(this.levers)),
            // CRITICAL FIX: Also backup the grid state
            grid: JSON.parse(JSON.stringify(this.grid))
        };
    }
    
    revertToSinglePath() {
        if (this.backupState) {
            this.keys = this.backupState.keys;
            this.doors = this.backupState.doors;
            this.pressurePlates = this.backupState.pressurePlates;
            this.levers = this.backupState.levers;
            // CRITICAL FIX: Also restore the grid state
            this.grid = this.backupState.grid;
            this.buildSpatialMaps();
            delete this.backupState;
        }
    }
    
    addDuplicateKeys() {
        const duplicateKeys = [];
        
        // For each existing key, try to place a duplicate in a different region
        for (const originalKey of this.keys) {
            if (Math.random() < 0.6) { // 60% chance to duplicate each key
                const duplicateLocation = this.findAlternativeKeyLocation(originalKey);
                if (duplicateLocation) {
                    duplicateKeys.push({
                        x: duplicateLocation.x,
                        y: duplicateLocation.y,
                        color: originalKey.color,
                        collected: false,
                        isDuplicate: true
                    });
                }
            }
        }
        
        this.keys.push(...duplicateKeys);
        console.log(`Added ${duplicateKeys.length} duplicate keys for redundancy`);
    }
    
    findAlternativeKeyLocation(originalKey) {
        const floorTiles = this.getAccessibleFloorTiles();
        
        // Filter for locations in different region from original
        const alternativeLocations = floorTiles.filter(tile => {
            const distanceFromOriginal = Math.abs(tile.x - originalKey.x) + Math.abs(tile.y - originalKey.y);
            const distanceFromStart = Math.abs(tile.x - this.startX) + Math.abs(tile.y - this.startY);
            const distanceFromEnd = Math.abs(tile.x - this.endX) + Math.abs(tile.y - this.endY);
            
            // Must be far from original key but still accessible
            return distanceFromOriginal >= 15 && 
                   distanceFromStart >= 5 && 
                   distanceFromEnd >= 5 &&
                   !this.hasKeyAt(tile.x, tile.y) &&
                   !this.hasTreasureAt(tile.x, tile.y);
        });
        
        return alternativeLocations.length > 0 ? 
               alternativeLocations[Math.floor(Math.random() * alternativeLocations.length)] : 
               null;
    }
    
    createAlternativePuzzlePaths() {
        // Add pressure plates that can open alternative routes
        const alternativeRoutes = this.findPotentialAlternativeRoutes();
        
        for (const route of alternativeRoutes.slice(0, 2)) { // Limit to 2 alternative routes
            this.createPressurePlateRoute(route);
        }
    }
    
    findPotentialAlternativeRoutes() {
        const routes = [];
        
        // Look for wall segments that could become temporary paths
        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (this.grid[y][x] === 1) { // Wall
                    // Check if removing this wall would create a useful shortcut
                    if (this.wouldCreateUsefulShortcut(x, y)) {
                        routes.push({ x, y });
                    }
                }
            }
        }
        
        return routes;
    }
    
    wouldCreateUsefulShortcut(x, y) {
        // STEP 2 FIX: Use pathfinding simulation instead of grid modification
        // Never modify the actual grid during testing
        
        // Check if this creates a meaningful alternative path
        const neighbors = [
            { x: x - 1, y }, { x: x + 1, y },
            { x, y: y - 1 }, { x, y: y + 1 }
        ];
        
        let accessibleNeighbors = 0;
        for (const neighbor of neighbors) {
            // Use simulation: temporarily treat the test position as floor for pathfinding
            if (this.isPositionAccessibleWithSimulation(neighbor.x, neighbor.y, x, y)) {
                accessibleNeighbors++;
            }
        }
        
        // Useful if it connects 2+ separate areas
        return accessibleNeighbors >= 2;
    }
    
    isPositionAccessibleWithSimulation(startX, startY, simulatedFloorX, simulatedFloorY) {
        // BFS pathfinding with simulation (does not modify actual grid)
        if (startX < 0 || startX >= this.width || startY < 0 || startY >= this.height) {
            return false;
        }
        
        // If checking the simulated position itself, treat it as floor
        if (startX === simulatedFloorX && startY === simulatedFloorY) {
            return true;
        }
        
        // If it's normally a wall (but not the simulated floor), it's inaccessible
        if (this.grid[startY][startX] === 1) {
            return false;
        }
        
        // Use simple connectivity check with BFS
        const queue = [{ x: startX, y: startY }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Check all 4 directions
            const directions = [
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 }
            ];
            
            for (const next of directions) {
                if (next.x < 0 || next.x >= this.width || next.y < 0 || next.y >= this.height) {
                    continue;
                }
                
                const nextKey = `${next.x},${next.y}`;
                if (visited.has(nextKey)) {
                    continue;
                }
                
                // Check if this position is accessible in our simulation
                let isAccessible = false;
                if (next.x === simulatedFloorX && next.y === simulatedFloorY) {
                    // Treat simulated position as floor
                    isAccessible = true;
                } else if (this.grid[next.y][next.x] === 0) {
                    // Normal floor tile
                    isAccessible = true;
                }
                
                if (isAccessible) {
                    visited.add(nextKey);
                    queue.push(next);
                    
                    // If we can reach a reasonable distance, consider it accessible
                    if (visited.size > 5) {
                        return true;
                    }
                }
            }
        }
        
        return visited.size > 1; // At least some connectivity
    }
    
    createPressurePlateRoute(route) {
        // Find a good location for the pressure plate that controls this route
        const plateLocation = this.findPressurePlateLocation();
        
        // SAFETY CHECK: Verify the location is still a floor tile
        if (plateLocation && this.grid[plateLocation.y][plateLocation.x] === 0) {
            const pressurePlate = {
                x: plateLocation.x,
                y: plateLocation.y,
                activated: false,
                affectedWalls: [{
                    x: route.x,
                    y: route.y,
                    originalState: this.grid[route.y][route.x],
                    temporaryFloor: false
                }],
                timer: 0,
                duration: 180, // 3 seconds
                isAlternativeRoute: true
            };
            
            this.pressurePlates.push(pressurePlate);
        }
    }
    
    findPressurePlateLocation() {
        const floorTiles = this.getAccessibleFloorTiles();
        
        // Find locations that are accessible but not too close to other puzzle elements
        const suitableLocations = floorTiles.filter(tile => {
            const distanceFromStart = Math.abs(tile.x - this.startX) + Math.abs(tile.y - this.startY);
            const distanceFromEnd = Math.abs(tile.x - this.endX) + Math.abs(tile.y - this.endY);
            
            return distanceFromStart >= 8 && 
                   distanceFromEnd >= 8 &&
                   !this.hasKeyAt(tile.x, tile.y) &&
                   !this.getPressurePlateAt(tile.x, tile.y);
        });
        
        return suitableLocations.length > 0 ? 
               suitableLocations[Math.floor(Math.random() * suitableLocations.length)] : 
               null;
    }
    
    createBypassRoutes() {
        // For critical doors, try to create alternative paths that bypass them
        const criticalDoors = this.doors.filter(door => this.isDoorCritical(door));
        
        for (const door of criticalDoors.slice(0, 1)) { // Limit to 1 bypass route
            this.createDoorBypass(door);
        }
    }
    
    isDoorCritical(door) {
        // A door is critical if it's the only path to the end
        // Temporarily remove the door and check if end is still reachable
        const doorKey = `${door.x},${door.y}`;
        this.doorMap.delete(doorKey);
        
        const stillReachable = this.isPositionAccessible(this.endX, this.endY, new Set());
        
        // Restore door
        this.doorMap.set(doorKey, door);
        
        return !stillReachable;
    }
    
    createDoorBypass(door) {
        // Try to find a path around the door using environmental puzzles
        const bypassWalls = this.findWallsNearDoor(door);
        
        if (bypassWalls.length > 0) {
            const bypassWall = bypassWalls[0];
            const leverLocation = this.findLeverLocation();
            
            // SAFETY CHECK: Verify the location is still a floor tile
            if (leverLocation && this.grid[leverLocation.y][leverLocation.x] === 0) {
                const lever = {
                    x: leverLocation.x,
                    y: leverLocation.y,
                    activated: false,
                    affectedCells: [{
                        x: bypassWall.x,
                        y: bypassWall.y,
                        originalState: this.grid[bypassWall.y][bypassWall.x]
                    }],
                    isDoorBypass: true
                };
                
                this.levers.push(lever);
            }
        }
    }
    
    findWallsNearDoor(door) {
        const walls = [];
        const searchRadius = 3;
        
        for (let y = door.y - searchRadius; y <= door.y + searchRadius; y++) {
            for (let x = door.x - searchRadius; x <= door.x + searchRadius; x++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    if (this.grid[y][x] === 1 && !(x === door.x && y === door.y)) {
                        walls.push({ x, y });
                    }
                }
            }
        }
        
        return walls;
    }
    
    findLeverLocation() {
        const floorTiles = this.getAccessibleFloorTiles();
        
        const suitableLocations = floorTiles.filter(tile => {
            const distanceFromStart = Math.abs(tile.x - this.startX) + Math.abs(tile.y - this.startY);
            return distanceFromStart >= 6 &&
                   !this.hasKeyAt(tile.x, tile.y) &&
                   !this.getLeverAt(tile.x, tile.y);
        });
        
        return suitableLocations.length > 0 ? 
               suitableLocations[Math.floor(Math.random() * suitableLocations.length)] : 
               null;
    }
    
    validateMultipleSolutionPaths() {
        console.log('Validating multiple solution paths...');
        
        // Test 1: Ensure original solution still works
        if (!this.isPuzzleSolvable()) {
            console.warn('Original solution path broken after adding redundancy');
            return false;
        }
        
        // Test 2: Check that we have actually created alternatives
        const hasAlternatives = this.countDistinctSolutionPaths() > 1;
        
        // Test 3: Verify no infinite loops or deadlocks were created
        const hasDeadlocks = this.detectPotentialDeadlocks();
        
        console.log(`Multiple paths validation: alternatives=${hasAlternatives}, deadlocks=${hasDeadlocks}`);
        
        return hasAlternatives && !hasDeadlocks;
    }
    
    countDistinctSolutionPaths() {
        // Simplified path counting - check if duplicate keys provide real alternatives
        let distinctPaths = 1; // Always at least one path
        
        // Count keys that have duplicates in different regions
        const keyColors = new Set(this.keys.map(k => k.color));
        for (const color of keyColors) {
            const keysOfColor = this.keys.filter(k => k.color === color);
            if (keysOfColor.length > 1) {
                // Check if they're in different regions (rough estimate)
                const avgDistance = this.calculateAverageDistance(keysOfColor);
                if (avgDistance > 10) {
                    distinctPaths++;
                }
            }
        }
        
        // Count alternative puzzle routes
        const alternativeRoutes = this.pressurePlates.filter(p => p.isAlternativeRoute).length;
        distinctPaths += alternativeRoutes;
        
        return distinctPaths;
    }
    
    calculateAverageDistance(keys) {
        if (keys.length < 2) return 0;
        
        let totalDistance = 0;
        let pairs = 0;
        
        for (let i = 0; i < keys.length; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                totalDistance += Math.abs(keys[i].x - keys[j].x) + Math.abs(keys[i].y - keys[j].y);
                pairs++;
            }
        }
        
        return pairs > 0 ? totalDistance / pairs : 0;
    }
    
    detectPotentialDeadlocks() {
        // Check for circular dependencies in the enhanced puzzle system
        // This is a simplified check for obvious problems
        
        // Check if any door requires a key that's behind itself
        for (const door of this.doors) {
            const requiredKey = this.keys.find(k => k.color === door.color && !k.collected);
            if (requiredKey) {
                // Check if key is accessible without the door
                const availableColors = new Set(this.keys.filter(k => k.color !== door.color).map(k => k.color));
                if (!this.isPositionAccessible(requiredKey.x, requiredKey.y, availableColors, true)) {
                    return true; // Potential deadlock detected
                }
            }
        }
        
        return false;
    }
}