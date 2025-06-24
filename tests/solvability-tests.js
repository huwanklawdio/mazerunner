// Comprehensive Solvability Test Suite for All Difficulty Levels

class SolvabilityTestSuite {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.startTime = 0;
        this.difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
        this.testCount = 0;
        this.totalTests = 0;
    }
    
    async runAllTests() {
        console.log('🔍 Starting Comprehensive Solvability Tests...');
        this.startTime = performance.now();
        
        try {
            // Test each difficulty level
            for (const difficulty of this.difficulties) {
                await this.testDifficultyLevel(difficulty);
            }
            
            // Test edge cases
            await this.testEdgeCases();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            this.errors.push(`Critical test failure: ${error.message}`);
            this.generateTestReport();
        }
    }
    
    async testDifficultyLevel(difficulty) {
        console.log(`\n🎯 Testing ${difficulty} Difficulty Level...`);
        
        const config = DIFFICULTY_LEVELS[difficulty];
        const testRuns = 10; // Test multiple maze generations
        
        let unsolvableCount = 0;
        let generationFailures = 0;
        let avgGenerationTime = 0;
        
        for (let i = 0; i < testRuns; i++) {
            this.testCount++;
            const testStartTime = performance.now();
            
            try {
                // Create maze with specific difficulty
                const maze = new Maze(config.gridWidth, config.gridHeight);
                maze.generate(config.complexity);
                
                const generationTime = performance.now() - testStartTime;
                avgGenerationTime += generationTime;
                
                // Test solvability
                const isSolvable = maze.isPuzzleSolvable();
                
                if (!isSolvable) {
                    unsolvableCount++;
                    console.warn(`❌ Unsolvable maze generated for ${difficulty} (run ${i + 1})`);
                    this.logMazeDebugInfo(maze, difficulty, i + 1);
                }
                
                // Test basic reachability
                const basicReachable = maze.isBasicallyReachable();
                if (!basicReachable) {
                    generationFailures++;
                    console.error(`🚨 Basic unreachable maze in ${difficulty} (run ${i + 1})`);
                }
                
                // Validate key-door relationships
                this.validateKeyDoorRelationships(maze, difficulty, i + 1);
                
                await this.wait(10); // Brief pause between tests
                
            } catch (error) {
                generationFailures++;
                this.errors.push(`${difficulty} generation failed (run ${i + 1}): ${error.message}`);
            }
        }
        
        avgGenerationTime /= testRuns;
        
        // Log results for this difficulty
        const successRate = ((testRuns - unsolvableCount) / testRuns * 100).toFixed(1);
        console.log(`📊 ${difficulty} Results:`);
        console.log(`   Solvable: ${testRuns - unsolvableCount}/${testRuns} (${successRate}%)`);
        console.log(`   Generation failures: ${generationFailures}`);
        console.log(`   Avg generation time: ${avgGenerationTime.toFixed(2)}ms`);
        
        this.logTest(`${difficulty} Solvability`, 
                    unsolvableCount === 0 && generationFailures === 0 ? 'PASS' : 'FAIL',
                    `${successRate}% solvable, ${generationFailures} failures, ${avgGenerationTime.toFixed(2)}ms avg`);
    }
    
    validateKeyDoorRelationships(maze, difficulty, runNumber) {
        // Check for circular dependencies
        const circularDeps = this.findCircularDependencies(maze);
        if (circularDeps.length > 0) {
            console.warn(`⚠️ Circular dependencies found in ${difficulty} run ${runNumber}:`, circularDeps);
        }
        
        // Check key accessibility without doors
        const inaccessibleKeys = this.findInaccessibleKeys(maze);
        if (inaccessibleKeys.length > 0) {
            console.warn(`⚠️ Inaccessible keys in ${difficulty} run ${runNumber}:`, inaccessibleKeys);
        }
        
        // Check if doors block critical paths
        const criticalBlocks = this.findCriticalBlocks(maze);
        if (criticalBlocks.length > 0) {
            console.warn(`⚠️ Critical path blocks in ${difficulty} run ${runNumber}:`, criticalBlocks);
        }
    }
    
    findCircularDependencies(maze) {
        const dependencies = [];
        
        for (const door of maze.doors) {
            // Find key for this door
            const key = maze.keys.find(k => k.color === door.color);
            if (!key) continue;
            
            // Check if key is only accessible through this door
            const keyReachableWithoutDoor = this.isPositionReachableWithoutDoor(
                maze, key.x, key.y, door.x, door.y
            );
            
            if (!keyReachableWithoutDoor) {
                dependencies.push({
                    door: `${door.color} door at (${door.x},${door.y})`,
                    key: `${key.color} key at (${key.x},${key.y})`
                });
            }
        }
        
        return dependencies;
    }
    
    findInaccessibleKeys(maze) {
        const inaccessible = [];
        
        // Check each key's accessibility from start without any doors
        for (const key of maze.keys) {
            const reachable = this.isPositionReachableWithoutDoors(maze, key.x, key.y);
            if (!reachable) {
                inaccessible.push(`${key.color} key at (${key.x},${key.y})`);
            }
        }
        
        return inaccessible;
    }
    
    findCriticalBlocks(maze) {
        const blocks = [];
        
        // Check if removing each door still allows end access
        for (const door of maze.doors) {
            const endReachableWithoutDoor = this.isPositionReachableWithoutDoor(
                maze, maze.endX, maze.endY, door.x, door.y
            );
            
            if (!endReachableWithoutDoor) {
                blocks.push(`${door.color} door at (${door.x},${door.y}) blocks critical path`);
            }
        }
        
        return blocks;
    }
    
    isPositionReachableWithoutDoors(maze, targetX, targetY) {
        const visited = new Set();
        const queue = [{ x: maze.startX, y: maze.startY }];
        visited.add(`${maze.startX},${maze.startY}`);
        
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
                if (newX < 0 || newX >= maze.width || newY < 0 || newY >= maze.height) continue;
                
                // Only check basic grid - ignore all doors
                if (maze.grid[newY][newX] === 0) {
                    visited.add(posKey);
                    queue.push({ x: newX, y: newY });
                }
            }
        }
        
        return false;
    }
    
    isPositionReachableWithoutDoor(maze, targetX, targetY, doorX, doorY) {
        const visited = new Set();
        const queue = [{ x: maze.startX, y: maze.startY }];
        visited.add(`${maze.startX},${maze.startY}`);
        
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
                if (newX < 0 || newX >= maze.width || newY < 0 || newY >= maze.height) continue;
                
                // Skip the specific door we're testing
                if (newX === doorX && newY === doorY) continue;
                
                // Check if position is accessible (ignore the specific door)
                if (maze.grid[newY][newX] === 0) {
                    const otherDoor = maze.doors.find(d => d.x === newX && d.y === newY && !(d.x === doorX && d.y === doorY));
                    if (!otherDoor || otherDoor.unlocked) {
                        visited.add(posKey);
                        queue.push({ x: newX, y: newY });
                    }
                }
            }
        }
        
        return false;
    }
    
    logMazeDebugInfo(maze, difficulty, runNumber) {
        console.log(`🔍 Debug info for ${difficulty} run ${runNumber}:`);
        console.log(`   Start: (${maze.startX}, ${maze.startY})`);
        console.log(`   End: (${maze.endX}, ${maze.endY})`);
        console.log(`   Keys: ${maze.keys.length}`);
        console.log(`   Doors: ${maze.doors.length}`);
        console.log(`   Pressure plates: ${maze.pressurePlates.length}`);
        console.log(`   Levers: ${maze.levers.length}`);
        
        if (maze.keys.length > 0) {
            console.log(`   Key colors: ${maze.keys.map(k => k.color).join(', ')}`);
        }
    }
    
    async testEdgeCases() {
        console.log('\\n🧪 Testing Edge Cases...');
        
        // Test very small maze
        await this.testSmallMaze();
        
        // Test very large maze
        await this.testLargeMaze();
        
        // Test maze with no keys/doors
        await this.testSimpleMaze();
    }
    
    async testSmallMaze() {
        try {
            const maze = new Maze(10, 8);
            maze.generate(0.3);
            
            const isSolvable = maze.isPuzzleSolvable();
            this.logTest('Small Maze (10x8)', isSolvable ? 'PASS' : 'FAIL', 
                        `Maze ${isSolvable ? 'is' : 'is not'} solvable`);
        } catch (error) {
            this.errors.push(`Small maze test failed: ${error.message}`);
        }
    }
    
    async testLargeMaze() {
        try {
            const maze = new Maze(60, 45);
            maze.generate(0.8);
            
            const isSolvable = maze.isPuzzleSolvable();
            this.logTest('Large Maze (60x45)', isSolvable ? 'PASS' : 'FAIL', 
                        `Maze ${isSolvable ? 'is' : 'is not'} solvable`);
        } catch (error) {
            this.errors.push(`Large maze test failed: ${error.message}`);
        }
    }
    
    async testSimpleMaze() {
        try {
            const maze = new Maze(20, 15);
            maze.generate(0.2);
            
            // Remove all keys and doors to test basic pathfinding
            maze.keys = [];
            maze.doors = [];
            maze.buildSpatialMaps();
            
            const isSolvable = maze.isPuzzleSolvable();
            this.logTest('Simple Maze (no puzzles)', isSolvable ? 'PASS' : 'FAIL', 
                        `Basic pathfinding ${isSolvable ? 'works' : 'fails'}`);
        } catch (error) {
            this.errors.push(`Simple maze test failed: ${error.message}`);
        }
    }
    
    // Utility methods
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    logTest(testName, status, details) {
        this.testResults.push({
            name: testName,
            status,
            details,
            timestamp: performance.now() - this.startTime
        });
    }
    
    generateTestReport() {
        const totalTime = performance.now() - this.startTime;
        const passCount = this.testResults.filter(t => t.status === 'PASS').length;
        const failCount = this.testResults.filter(t => t.status === 'FAIL').length;
        
        console.log('\\n' + '='.repeat(60));
        console.log('🔍 SOLVABILITY TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`Tests Passed: ${passCount}`);
        console.log(`Tests Failed: ${failCount}`);
        console.log(`Errors: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\\n❌ ERRORS:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('\\n📊 TEST RESULTS:');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`  ${icon} ${result.name}: ${result.details}`);
        });
        
        const overallStatus = failCount === 0 && this.errors.length === 0 ? 'PASSED' : 'FAILED';
        console.log(`\\n🎯 OVERALL RESULT: ${overallStatus}`);
        
        if (overallStatus === 'PASSED') {
            console.log('🎉 All mazes are now consistently solvable across all difficulty levels!');
        } else {
            console.log('⚠️ Some mazes still have solvability issues that need addressing.');
        }
        
        console.log('='.repeat(60));
    }
}

// Export for use in test runner
if (typeof window !== 'undefined') {
    window.SolvabilityTestSuite = SolvabilityTestSuite;
}