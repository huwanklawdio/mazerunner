// Maze generation and collision detection
class Maze {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.torches = []; // Array of torch positions {x, y, side}
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
        return this.grid[y][x] === 1;
    }
    
    isFloor(x, y) {
        return !this.isWall(x, y);
    }
}