// Critical Validation Tests - Essential functionality checks
// These tests must pass for the game to function correctly

class CriticalValidationTests {
    constructor() {
        this.results = [];
        this.criticalFailures = [];
    }
    
    async runCriticalTests() {
        console.log('🚨 CRITICAL VALIDATION TESTS');
        console.log('Testing essential functionality that could break gameplay...\n');
        
        try {
            // Test 1: Spatial hash accuracy
            await this.testSpatialHashAccuracy();
            
            // Test 2: Collection system integrity
            await this.testCollectionSystemIntegrity();
            
            // Test 3: Collision detection accuracy
            await this.testCollisionDetectionAccuracy();
            
            // Test 4: Environmental puzzle mechanics
            await this.testEnvironmentalPuzzleMechanics();
            
            // Test 5: Particle system doesn't crash
            await this.testParticleSystemStability();
            
            this.generateCriticalReport();
            
        } catch (error) {
            this.criticalFailures.push(`CRITICAL SYSTEM FAILURE: ${error.message}`);
            this.generateCriticalReport();
        }
    }
    
    async testSpatialHashAccuracy() {
        console.log('🔍 Testing Spatial Hash Accuracy (CRITICAL)...');
        
        // Create test maze
        const maze = new Maze(20, 20);
        maze.generate(0.5);
        
        let passCount = 0;
        let totalTests = 0;
        
        // Test every position in the maze
        for (let y = 0; y < maze.height; y++) {
            for (let x = 0; x < maze.width; x++) {
                totalTests += 4; // Test doors, treasures, keys, pressure plates
                
                // Test door lookup
                const hashDoor = maze.getDoorAt(x, y);
                const linearDoor = maze.doors.find(d => d.x === x && d.y === y);
                if (hashDoor === linearDoor) passCount++;
                else {
                    this.criticalFailures.push(
                        `Door hash mismatch at ${x},${y}: hash=${!!hashDoor}, linear=${!!linearDoor}`
                    );
                }
                
                // Test treasure lookup
                const hashTreasure = maze.getTreasureAt(x, y);
                const linearTreasure = maze.treasures.find(t => 
                    t.x === x && t.y === y && !t.collected
                );
                if (hashTreasure === linearTreasure) passCount++;
                else {
                    this.criticalFailures.push(
                        `Treasure hash mismatch at ${x},${y}: hash=${!!hashTreasure}, linear=${!!linearTreasure}`
                    );
                }
                
                // Test key lookup
                const hashKey = maze.getKeyAt(x, y);
                const linearKey = maze.keys.find(k => 
                    k.x === x && k.y === y && !k.collected
                );
                if (hashKey === linearKey) passCount++;
                else {
                    this.criticalFailures.push(
                        `Key hash mismatch at ${x},${y}: hash=${!!hashKey}, linear=${!!linearKey}`
                    );
                }
                
                // Test pressure plate lookup
                const hashPlate = maze.getPressurePlateAt(x, y);
                const linearPlate = maze.pressurePlates.find(p => 
                    p.x === x && p.y === y
                );
                if (hashPlate === linearPlate) passCount++;
                else {
                    this.criticalFailures.push(
                        `Pressure plate hash mismatch at ${x},${y}: hash=${!!hashPlate}, linear=${!!linearPlate}`
                    );
                }
            }
        }
        
        const accuracy = (passCount / totalTests) * 100;
        console.log(`✅ Spatial Hash Accuracy: ${accuracy.toFixed(2)}% (${passCount}/${totalTests})`);
        
        if (accuracy < 100) {
            this.criticalFailures.push(
                `Spatial hash accuracy below 100%: ${accuracy.toFixed(2)}%`
            );
        }
        
        this.results.push({
            test: 'Spatial Hash Accuracy',
            status: accuracy === 100 ? 'PASS' : 'FAIL',
            details: `${accuracy.toFixed(2)}% accuracy`
        });
    }
    
    async testCollectionSystemIntegrity() {
        console.log('💎 Testing Collection System Integrity (CRITICAL)...');
        
        const maze = new Maze(30, 30);
        maze.generate(0.7);
        
        const initialTreasures = maze.treasures.filter(t => !t.collected).length;
        const initialKeys = maze.keys.filter(k => !k.collected).length;
        
        let treasuresCollected = 0;
        let keysCollected = 0;
        let collectionErrors = [];
        
        // Test treasure collection
        for (const treasure of [...maze.treasures]) { // Copy array
            if (!treasure.collected) {
                const beforeCount = maze.treasures.filter(t => !t.collected).length;
                const collected = maze.collectTreasure(treasure.x, treasure.y);
                const afterCount = maze.treasures.filter(t => !t.collected).length;
                
                if (collected) {
                    treasuresCollected++;
                    
                    // Verify treasure is marked as collected
                    if (!treasure.collected) {
                        collectionErrors.push(`Treasure at ${treasure.x},${treasure.y} not marked as collected`);
                    }
                    
                    // Verify treasure removed from hash
                    const hashCheck = maze.getTreasureAt(treasure.x, treasure.y);
                    if (hashCheck) {
                        collectionErrors.push(`Treasure at ${treasure.x},${treasure.y} still in hash after collection`);
                    }
                } else {
                    collectionErrors.push(`Failed to collect treasure at ${treasure.x},${treasure.y}`);
                }
                
                // Only test a few treasures to avoid timeout
                if (treasuresCollected >= 3) break;
            }
        }
        
        // Test key collection
        for (const key of [...maze.keys]) { // Copy array
            if (!key.collected) {
                const collected = maze.collectKey(key.x, key.y);
                
                if (collected) {
                    keysCollected++;
                    
                    // Verify key is marked as collected
                    if (!key.collected) {
                        collectionErrors.push(`Key at ${key.x},${key.y} not marked as collected`);
                    }
                    
                    // Verify key removed from hash
                    const hashCheck = maze.getKeyAt(key.x, key.y);
                    if (hashCheck) {
                        collectionErrors.push(`Key at ${key.x},${key.y} still in hash after collection`);
                    }
                } else {
                    collectionErrors.push(`Failed to collect key at ${key.x},${key.y}`);
                }
                
                // Only test a few keys
                if (keysCollected >= 2) break;
            }
        }
        
        console.log(`✅ Collection System: ${treasuresCollected} treasures, ${keysCollected} keys collected`);
        
        if (collectionErrors.length > 0) {
            this.criticalFailures.push(...collectionErrors);
        }
        
        this.results.push({
            test: 'Collection System Integrity',
            status: collectionErrors.length === 0 ? 'PASS' : 'FAIL',
            details: `${treasuresCollected} treasures, ${keysCollected} keys collected successfully`
        });
    }
    
    async testCollisionDetectionAccuracy() {
        console.log('🚧 Testing Collision Detection Accuracy (CRITICAL)...');
        
        const maze = new Maze(25, 25);
        maze.generate(0.6);
        
        let collisionTests = 0;
        let collisionErrors = [];
        
        // Test wall collision detection
        for (let y = 1; y < maze.height - 1; y++) {
            for (let x = 1; x < maze.width - 1; x++) {
                collisionTests++;
                
                const isWallOptimized = maze.isWall(x, y);
                const isWallOriginal = this.originalIsWall(maze, x, y);
                
                if (isWallOptimized !== isWallOriginal) {
                    collisionErrors.push(
                        `Wall detection mismatch at ${x},${y}: optimized=${isWallOptimized}, original=${isWallOriginal}`
                    );
                }
                
                // Don't test every single position to avoid timeout
                if (collisionTests >= 200) break;
            }
            if (collisionTests >= 200) break;
        }
        
        const accuracy = ((collisionTests - collisionErrors.length) / collisionTests) * 100;
        console.log(`✅ Collision Detection: ${accuracy.toFixed(2)}% accuracy (${collisionTests} tests)`);
        
        if (collisionErrors.length > 0) {
            this.criticalFailures.push(...collisionErrors.slice(0, 5)); // Show first 5 errors
        }
        
        this.results.push({
            test: 'Collision Detection Accuracy',
            status: collisionErrors.length === 0 ? 'PASS' : 'FAIL',
            details: `${accuracy.toFixed(2)}% accuracy across ${collisionTests} positions`
        });
    }
    
    // Original isWall implementation for comparison
    originalIsWall(maze, x, y) {
        if (x < 0 || x >= maze.width || y < 0 || y >= maze.height) {
            return true;
        }
        
        // Check base grid first
        if (maze.grid[y][x] === 1) {
            return true;
        }
        
        // Check for locked doors using linear search (original method)
        const door = maze.doors.find(d => d.x === x && d.y === y);
        if (door && !door.unlocked && !door.temporarilyOpen) {
            return true;
        }
        
        return false;
    }
    
    async testEnvironmentalPuzzleMechanics() {
        console.log('⚙️ Testing Environmental Puzzle Mechanics (CRITICAL)...');
        
        const maze = new Maze(40, 30);
        maze.generate(0.8);
        
        let puzzleErrors = [];
        let platesActivated = 0;
        let leversToggled = 0;
        
        // Test pressure plates
        for (const plate of maze.pressurePlates) {
            if (platesActivated >= 3) break; // Test a few plates
            
            const beforeWalls = plate.affectedWalls.map(w => maze.grid[w.y][w.x]);
            const result = maze.activatePressurePlate(plate.x, plate.y);
            
            if (result) {
                platesActivated++;
                
                // Verify plate is marked as activated
                if (!plate.activated) {
                    puzzleErrors.push(`Pressure plate at ${plate.x},${plate.y} not marked as activated`);
                }
                
                // Verify walls changed state
                let wallsChanged = false;
                for (let i = 0; i < plate.affectedWalls.length; i++) {
                    const wall = plate.affectedWalls[i];
                    const currentState = maze.grid[wall.y][wall.x];
                    if (currentState !== beforeWalls[i]) {
                        wallsChanged = true;
                        break;
                    }
                }
                
                if (!wallsChanged && plate.affectedWalls.length > 0) {
                    puzzleErrors.push(`Pressure plate at ${plate.x},${plate.y} didn't change wall states`);
                }
            } else {
                puzzleErrors.push(`Failed to activate pressure plate at ${plate.x},${plate.y}`);
            }
        }
        
        // Test levers
        for (const lever of maze.levers) {
            if (leversToggled >= 2) break; // Test a few levers
            
            const beforeState = lever.activated;
            const result = maze.toggleLever(lever.x, lever.y);
            
            if (result) {
                leversToggled++;
                
                // Verify lever state changed
                if (lever.activated === beforeState) {
                    puzzleErrors.push(`Lever at ${lever.x},${lever.y} state didn't change`);
                }
            } else {
                puzzleErrors.push(`Failed to toggle lever at ${lever.x},${lever.y}`);
            }
        }
        
        console.log(`✅ Environmental Puzzles: ${platesActivated} plates activated, ${leversToggled} levers toggled`);
        
        if (puzzleErrors.length > 0) {
            this.criticalFailures.push(...puzzleErrors);
        }
        
        this.results.push({
            test: 'Environmental Puzzle Mechanics',
            status: puzzleErrors.length === 0 ? 'PASS' : 'FAIL',
            details: `${platesActivated} pressure plates, ${leversToggled} levers tested successfully`
        });
    }
    
    async testParticleSystemStability() {
        console.log('🎆 Testing Particle System Stability (CRITICAL)...');
        
        const particleSystem = new ParticleSystem();
        let particleErrors = [];
        let particlesCreated = 0;
        let crashDetected = false;
        
        try {
            // Create various particle types rapidly
            for (let i = 0; i < 100; i++) {
                particleSystem.createWallCollision(i * 10, i * 10, 'up');
                particleSystem.createTorchFlame(i * 5, i * 5);
                particleSystem.createTreasureCollection(i * 15, i * 15, 'coin');
                particlesCreated += 3;
                
                // Update particles periodically
                if (i % 10 === 0) {
                    particleSystem.update(16);
                }
            }
            
            // Stress test with maximum particles
            for (let i = 0; i < 200; i++) {
                particleSystem.createVictoryEffect(Math.random() * 1000, Math.random() * 1000);
            }
            
            // Update system multiple times
            for (let frame = 0; frame < 100; frame++) {
                particleSystem.update(16);
            }
            
            // Verify pool is working
            if (particleSystem.pool.length === 0) {
                particleErrors.push('No particles returned to pool after stress test');
            }
            
            // Verify particle limit is enforced
            if (particleSystem.particles.length > particleSystem.maxParticles) {
                particleErrors.push(
                    `Particle limit exceeded: ${particleSystem.particles.length} > ${particleSystem.maxParticles}`
                );
            }
            
        } catch (error) {
            crashDetected = true;
            particleErrors.push(`Particle system crashed: ${error.message}`);
        }
        
        console.log(`✅ Particle System: ${particlesCreated} particles created, system ${crashDetected ? 'CRASHED' : 'stable'}`);
        
        if (particleErrors.length > 0) {
            this.criticalFailures.push(...particleErrors);
        }
        
        this.results.push({
            test: 'Particle System Stability',
            status: !crashDetected && particleErrors.length === 0 ? 'PASS' : 'FAIL',
            details: `${particlesCreated} particles created, ${particleSystem.pool.length} in pool`
        });
    }
    
    generateCriticalReport() {
        const passCount = this.results.filter(r => r.status === 'PASS').length;
        const totalTests = this.results.length;
        const hasCriticalFailures = this.criticalFailures.length > 0;
        
        console.log('\n' + '='.repeat(60));
        console.log('🚨 CRITICAL VALIDATION REPORT');
        console.log('='.repeat(60));
        console.log(`Tests Passed: ${passCount}/${totalTests}`);
        console.log(`Critical Failures: ${this.criticalFailures.length}`);
        
        if (hasCriticalFailures) {
            console.log('\n❌ CRITICAL FAILURES (GAME BREAKING):');
            this.criticalFailures.forEach((failure, index) => {
                console.log(`  ${index + 1}. ${failure}`);
            });
        }
        
        console.log('\n📊 TEST RESULTS:');
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`  ${icon} ${result.test}: ${result.details}`);
        });
        
        const overallStatus = passCount === totalTests && !hasCriticalFailures ? 'SAFE TO DEPLOY' : 'NEEDS FIXES';
        const statusIcon = overallStatus === 'SAFE TO DEPLOY' ? '🟢' : '🔴';
        
        console.log(`\n${statusIcon} OVERALL STATUS: ${overallStatus}`);
        
        if (overallStatus === 'SAFE TO DEPLOY') {
            console.log('✅ All critical systems validated - performance optimizations are safe!');
        } else {
            console.log('⚠️  Critical issues detected - review failures before deployment!');
        }
        
        console.log('='.repeat(60));
    }
}

// Export for use in test runner
if (typeof window !== 'undefined') {
    window.CriticalValidationTests = CriticalValidationTests;
}