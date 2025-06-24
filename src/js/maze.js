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
        this.pressurePlates = []; // Array of pressure plates {x, y, activated, connectedDoors, timer}
        this.levers = []; // Array of levers {x, y, activated, affectedCells}
        this.startX = 1;
        this.startY = 1;
        this.endX = width - 2;
        this.endY = height - 2;
        
        this.initializeGrid();
    }
    
    initializeGrid() {
        // Initialize grid with all walls
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = 1; // 1 = wall, 0 = floor
            }
        }
    }
    
    generate(complexity = 0.5) {
        this.initializeGrid();
        
        // Recursive backtracking maze generation
        const stack = [];
        const startX = 1;
        const startY = 1;
        
        this.grid[startY][startX] = 0; // Mark start as floor
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
                
                this.grid[wallY][wallX] = 0;
                this.grid[next.y][next.x] = 0;
                
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
        
        // Ensure the puzzle is solvable
        this.ensureSolvability();
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
            // Set start at random floor tile
            const startIndex = Math.floor(Math.random() * floorTiles.length);
            this.startX = floorTiles[startIndex].x;
            this.startY = floorTiles[startIndex].y;
            
            // Set end at tile farthest from start
            let maxDistance = 0;
            let endTile = floorTiles[0];
            
            for (const tile of floorTiles) {
                const distance = Math.abs(tile.x - this.startX) + Math.abs(tile.y - this.startY);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    endTile = tile;
                }
            }
            
            this.endX = endTile.x;
            this.endY = endTile.y;
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
        
        // Check for locked doors (act as walls)
        const door = this.getDoorAt(x, y);
        if (door && !door.unlocked && !door.temporarilyOpen) {
            return true;
        }
        
        return this.grid[y][x] === 1;
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
        return this.treasures.find(treasure => 
            treasure.x === x && treasure.y === y && !treasure.collected
        );
    }
    
    collectTreasure(x, y) {
        const treasure = this.getTreasureAt(x, y);
        if (treasure) {
            treasure.collected = true;
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
            
            // Place corresponding key
            const availableKeySpots = floorTiles.filter(tile => {
                const distanceFromStart = Math.abs(tile.x - this.startX) + Math.abs(tile.y - this.startY);
                const distanceFromEnd = Math.abs(tile.x - this.endX) + Math.abs(tile.y - this.endY);
                const distanceFromDoor = Math.abs(tile.x - doorLocation.x) + Math.abs(tile.y - doorLocation.y);
                
                return distanceFromStart >= 3 && distanceFromEnd >= 5 && 
                       distanceFromDoor >= 8 && !this.hasKeyAt(tile.x, tile.y);
            });
            
            if (availableKeySpots.length > 0) {
                const keySpot = availableKeySpots[Math.floor(Math.random() * availableKeySpots.length)];
                this.keys.push({
                    x: keySpot.x,
                    y: keySpot.y,
                    color: color,
                    collected: false
                });
            }
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
        return this.keys.some(key => key.x === x && key.y === y && !key.collected);
    }
    
    getKeyAt(x, y) {
        return this.keys.find(key => key.x === x && key.y === y && !key.collected);
    }
    
    getDoorAt(x, y) {
        return this.doors.find(door => door.x === x && door.y === y);
    }
    
    collectKey(x, y) {
        const key = this.getKeyAt(x, y);
        if (key) {
            key.collected = true;
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
            
            // Find doors that this plate will control
            const connectedDoors = this.findNearbyDoors(location.x, location.y, 8);
            
            const plate = {
                x: location.x,
                y: location.y,
                activated: false,
                connectedDoors: connectedDoors,
                timer: 0,
                maxTimer: 300 // 5 seconds at 60fps
            };
            
            this.pressurePlates.push(plate);
            console.log('Placed pressure plate at', location.x, location.y, 'with', connectedDoors.length, 'connected doors');
        }
    }
    
    placeLevers() {
        const leverCount = Math.floor((this.width * this.height) / 300); // 1 lever per ~300 tiles
        const locations = this.findGoodFloorTiles();
        
        for (let i = 0; i < leverCount && locations.length > 0; i++) {
            const index = Math.floor(Math.random() * locations.length);
            const location = locations[index];
            locations.splice(index, 1);
            
            // Find cells that this lever will affect
            const affectedCells = this.findAffectedCells(location.x, location.y);
            
            this.levers.push({
                x: location.x,
                y: location.y,
                activated: false,
                affectedCells: affectedCells
            });
        }
    }
    
    findGoodFloorTiles() {
        const tiles = [];
        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (this.grid[y][x] === 0 && // Floor tile
                    !this.hasKeyAt(x, y) && // No key here
                    !this.getTreasureAt(x, y) && // No treasure here
                    Math.abs(x - this.startX) + Math.abs(y - this.startY) > 3 && // Not too close to start
                    Math.abs(x - this.endX) + Math.abs(y - this.endY) > 3) { // Not too close to end
                    tiles.push({ x, y });
                }
            }
        }
        return tiles;
    }
    
    findNearbyDoors(x, y, maxDistance) {
        const nearbyDoors = [];
        for (const door of this.doors) {
            const distance = Math.abs(door.x - x) + Math.abs(door.y - y);
            if (distance <= maxDistance) {
                nearbyDoors.push(door);
            }
        }
        return nearbyDoors;
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
        return this.pressurePlates.find(plate => plate.x === x && plate.y === y);
    }
    
    getLeverAt(x, y) {
        return this.levers.find(lever => lever.x === x && lever.y === y);
    }
    
    activatePressurePlate(x, y) {
        const plate = this.getPressurePlateAt(x, y);
        if (plate && !plate.activated) {
            plate.activated = true;
            plate.timer = plate.maxTimer;
            
            // Open connected doors temporarily
            for (const door of plate.connectedDoors) {
                door.temporarilyOpen = true;
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
    
    updatePressurePlates() {
        for (const plate of this.pressurePlates) {
            if (plate.activated && plate.timer > 0) {
                plate.timer--;
                if (plate.timer <= 0) {
                    plate.activated = false;
                    // Close connected doors
                    for (const door of plate.connectedDoors) {
                        door.temporarilyOpen = false;
                    }
                }
            }
        }
    }
    
    ensureSolvability() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            if (this.isPuzzleSolvable()) {
                console.log(`Key-door puzzle solvable after ${attempts + 1} attempt(s)`);
                return true;
            }
            
            // Regenerate keys and doors
            console.log(`Attempt ${attempts + 1}: Puzzle not solvable, regenerating...`);
            this.placeKeysAndDoors();
            attempts++;
        }
        
        // If we can't create a solvable puzzle, remove all keys and doors
        console.warn('Could not generate solvable key-door puzzle, removing all keys and doors');
        this.keys = [];
        this.doors = [];
        return false;
    }
    
    isPuzzleSolvable() {
        // Check if all keys are reachable and end is reachable with all keys
        const reachableStates = this.getAllReachableStates();
        
        // Check if we can reach the end with all keys
        const allKeyColors = [...new Set(this.keys.map(k => k.color))];
        const endState = this.findStateWithKeys(reachableStates, allKeyColors);
        
        if (!endState) return false;
        
        // Check if end position is reachable in that state
        return endState.reachablePositions.has(`${this.endX},${this.endY}`);
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
        
        while (queue.length > 0) {
            const currentState = queue.shift();
            
            // Find all keys reachable in current state
            const newKeys = this.findReachableKeys(currentState);
            
            for (const newKey of newKeys) {
                const newKeySet = new Set([...currentState.keys, newKey]);
                const keyString = this.keysToString(newKeySet);
                
                if (!visited.has(keyString)) {
                    // Calculate new reachable positions with this key set
                    const newReachable = this.getReachablePositions(this.startX, this.startY, newKeySet);
                    const newState = {
                        keys: newKeySet,
                        reachablePositions: newReachable
                    };
                    
                    visited.set(keyString, newReachable);
                    queue.push(newState);
                }
            }
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
    
    isPositionAccessible(x, y, availableKeys) {
        // Check if it's a wall
        if (this.grid[y][x] === 1) return false;
        
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
        
        for (const key of this.keys) {
            if (key.collected || state.keys.has(key.color)) continue;
            
            const keyPos = `${key.x},${key.y}`;
            if (state.reachablePositions.has(keyPos)) {
                reachableKeys.push(key.color);
            }
        }
        
        return reachableKeys;
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
}