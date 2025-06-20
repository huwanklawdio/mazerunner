// Maze generation and collision detection
class Maze {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
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