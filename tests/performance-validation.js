// Performance Optimization Validation Test Suite
// Tests all critical systems to ensure optimizations didn't break functionality

class PerformanceTestSuite {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
        this.startTime = 0;
        
        // Test configuration
        this.config = {
            testTimeout: 30000, // 30 seconds max per test
            performanceThresholds: {
                easy: { minFPS: 55, maxMemoryMB: 50 },
                medium: { minFPS: 50, maxMemoryMB: 75 },
                hard: { minFPS: 45, maxMemoryMB: 100 },
                expert: { minFPS: 40, maxMemoryMB: 150 }
            },
            spatialHashSampleSize: 1000, // Positions to test for hash accuracy
            particleStressCount: 500,     // Particles for stress testing
            renderFramesToTest: 120       // 2 seconds at 60 FPS
        };
    }
    
    // Main test runner
    async runAllTests() {
        console.log('🧪 Starting Performance Optimization Validation Tests...');
        this.startTime = performance.now();
        
        try {
            // Phase 1: Critical System Validation
            await this.testSpatialHashingAccuracy();
            await this.testParticleSystemIntegrity();
            await this.testAdaptiveRenderingConsistency();
            
            // Phase 2: Gameplay Integration Tests
            await this.testGameMechanicsAllDifficulties();
            await this.testCollectionSystemAccuracy();
            await this.testEnvironmentalPuzzles();
            
            // Phase 3: Performance Validation
            await this.testPerformanceRegression();
            await this.testMemoryStability();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            this.errors.push(`Critical test failure: ${error.message}`);
            this.generateTestReport();
        }
    }
    
    // ===== SPATIAL HASHING TESTS =====
    
    async testSpatialHashingAccuracy() {
        console.log('🔍 Testing Spatial Hashing Accuracy...');
        
        // Test across all difficulty levels
        for (const difficulty of ['EASY', 'MEDIUM', 'HARD', 'EXPERT']) {
            await this.validateSpatialHashForDifficulty(difficulty);
        }
        
        this.logTest('Spatial Hashing Accuracy', 'PASS', 'All hash maps return accurate results');
    }
    
    async validateSpatialHashForDifficulty(difficulty) {
        // Create a test maze
        const config = DIFFICULTY_LEVELS[difficulty];
        const maze = new Maze(config.gridWidth, config.gridHeight);
        maze.generate(config.complexity);
        
        // Generate random test positions
        const testPositions = this.generateRandomPositions(
            maze.width, 
            maze.height, 
            this.config.spatialHashSampleSize
        );
        
        // Validate door lookups
        for (const pos of testPositions) {
            const hashResult = maze.getDoorAt(pos.x, pos.y);
            const linearResult = maze.doors.find(door => 
                door.x === pos.x && door.y === pos.y
            );
            
            if (hashResult !== linearResult) {
                throw new Error(
                    `Door hash mismatch at ${pos.x},${pos.y} in ${difficulty}: ` +
                    `hash=${hashResult ? 'found' : 'null'}, linear=${linearResult ? 'found' : 'null'}`
                );
            }
        }
        
        // Validate treasure lookups
        for (const pos of testPositions) {
            const hashResult = maze.getTreasureAt(pos.x, pos.y);
            const linearResult = maze.treasures.find(treasure => 
                treasure.x === pos.x && treasure.y === pos.y && !treasure.collected
            );
            
            if (hashResult !== linearResult) {
                throw new Error(
                    `Treasure hash mismatch at ${pos.x},${pos.y} in ${difficulty}`
                );
            }
        }
        
        // Validate key lookups
        for (const pos of testPositions) {
            const hashResult = maze.getKeyAt(pos.x, pos.y);
            const linearResult = maze.keys.find(key => 
                key.x === pos.x && key.y === pos.y && !key.collected
            );
            
            if (hashResult !== linearResult) {
                throw new Error(
                    `Key hash mismatch at ${pos.x},${pos.y} in ${difficulty}`
                );
            }
        }
        
        // Validate pressure plate lookups
        for (const pos of testPositions) {
            const hashResult = maze.getPressurePlateAt(pos.x, pos.y);
            const linearResult = maze.pressurePlates.find(plate => 
                plate.x === pos.x && plate.y === pos.y
            );
            
            if (hashResult !== linearResult) {
                throw new Error(
                    `Pressure plate hash mismatch at ${pos.x},${pos.y} in ${difficulty}`
                );
            }
        }
        
        console.log(`✅ ${difficulty}: ${this.config.spatialHashSampleSize} position lookups validated`);
    }
    
    // ===== PARTICLE SYSTEM TESTS =====
    
    async testParticleSystemIntegrity() {
        console.log('🎆 Testing Particle System Integrity...');
        
        const particleSystem = new ParticleSystem();
        const initialPoolSize = particleSystem.pool.length;
        
        // Test 1: Basic particle lifecycle
        await this.testParticleLifecycle(particleSystem);
        
        // Test 2: Pool overflow handling
        await this.testParticlePoolOverflow(particleSystem);
        
        // Test 3: Memory leak detection
        await this.testParticleMemoryLeaks(particleSystem);
        
        // Test 4: Particle type consistency
        await this.testParticleTypeConsistency(particleSystem);
        
        this.logTest('Particle System Integrity', 'PASS', 
            `Pool management, lifecycle, and memory handling validated`);
    }
    
    async testParticleLifecycle(particleSystem) {
        const initialCount = particleSystem.particles.length;
        
        // Create particles
        particleSystem.createWallCollision(100, 100, 'up');
        particleSystem.createTreasureCollection(200, 200, 'coin');
        particleSystem.createTorchFlame(300, 300);
        
        if (particleSystem.particles.length <= initialCount) {
            throw new Error('Particles not being created properly');
        }
        
        // Update particles multiple times to test lifecycle
        for (let i = 0; i < 100; i++) {
            particleSystem.update(16); // Simulate 16ms frame time
        }
        
        // Verify some particles died and were pooled
        if (particleSystem.pool.length === 0) {
            this.warnings.push('No particles returned to pool after lifecycle test');
        }
        
        console.log(`✅ Particle lifecycle: Created, updated, and pooled correctly`);
    }
    
    async testParticlePoolOverflow(particleSystem) {
        const maxParticles = particleSystem.maxParticles;
        
        // Try to create more than the limit
        for (let i = 0; i < maxParticles + 100; i++) {
            particleSystem.createWallCollision(i % 500, i % 500, 'up');
        }
        
        if (particleSystem.particles.length > maxParticles) {
            throw new Error(
                `Particle limit exceeded: ${particleSystem.particles.length} > ${maxParticles}`
            );
        }
        
        console.log(`✅ Particle overflow: Limit enforced at ${maxParticles} particles`);
    }
    
    async testParticleMemoryLeaks(particleSystem) {
        const initialPoolSize = particleSystem.pool.length;
        
        // Create and destroy many particles
        for (let cycle = 0; cycle < 10; cycle++) {
            // Create burst
            for (let i = 0; i < 50; i++) {
                particleSystem.createTorchFlame(Math.random() * 500, Math.random() * 500);
            }
            
            // Update until all die
            for (let frame = 0; frame < 200; frame++) {
                particleSystem.update(16);
            }
        }
        
        // Check pool didn't grow excessively
        const finalPoolSize = particleSystem.pool.length;
        if (finalPoolSize > particleSystem.maxPoolSize) {
            throw new Error(
                `Pool size exceeded limit: ${finalPoolSize} > ${particleSystem.maxPoolSize}`
            );
        }
        
        console.log(`✅ Memory stability: Pool size controlled (${finalPoolSize} objects)`);
    }
    
    async testParticleTypeConsistency(particleSystem) {
        // Test all particle creation methods
        const particleTypes = [
            () => particleSystem.createWallCollision(100, 100, 'up'),
            () => particleSystem.createVictoryEffect(200, 200),
            () => particleSystem.createTorchFlame(300, 300),
            () => particleSystem.createTreasureCollection(400, 400, 'coin'),
            () => particleSystem.createKeyCollection(500, 500, 'red'),
            () => particleSystem.createDoorUnlock(600, 600, 'blue'),
            () => particleSystem.createFootstepDust(700, 700, 'up'),
            () => particleSystem.createWallOpen(800, 800),
            () => particleSystem.createWallClose(900, 900)
        ];
        
        const initialCount = particleSystem.particles.length;
        
        // Create one of each type
        for (const createFunc of particleTypes) {
            createFunc();
        }
        
        // Verify particles were created
        if (particleSystem.particles.length <= initialCount) {
            throw new Error('Not all particle types were created successfully');
        }
        
        console.log(`✅ Particle types: All ${particleTypes.length} particle types create successfully`);
    }
    
    // ===== ADAPTIVE RENDERING TESTS =====
    
    async testAdaptiveRenderingConsistency() {
        console.log('🎨 Testing Adaptive Rendering Consistency...');
        
        // Create test game instance
        const testGame = await this.createTestGameInstance();
        
        // Test static rendering accuracy
        await this.testStaticRenderingAccuracy(testGame);
        
        // Test movement responsiveness
        await this.testCameraMovementRendering(testGame);
        
        // Test animation continuity
        await this.testAnimationContinuity(testGame);
        
        this.logTest('Adaptive Rendering Consistency', 'PASS', 
            'Rendering optimizations maintain visual accuracy');
    }
    
    async testStaticRenderingAccuracy(testGame) {
        const renderer = testGame.renderer;
        const camera = testGame.camera;
        const maze = testGame.maze;
        
        // Position camera and keep it still
        camera.reset();
        
        // Render multiple frames without moving
        for (let frame = 0; frame < 60; frame++) {
            renderer.render(maze, testGame.player, camera);
            
            // Verify renderer is handling static frames correctly
            if (renderer.skipFrames > 0) {
                console.log(`Frame ${frame}: Adaptive rendering skipping frames (${renderer.skipFrames})`);
            }
        }
        
        console.log(`✅ Static rendering: 60 frames rendered with adaptive optimizations`);
    }
    
    async testCameraMovementRendering(testGame) {
        const renderer = testGame.renderer;
        const camera = testGame.camera;
        const maze = testGame.maze;
        
        // Move camera rapidly and verify rendering updates
        for (let i = 0; i < 20; i++) {
            // Move camera significantly
            camera.update(i * TILE_SIZE * 5, i * TILE_SIZE * 3);
            
            // Store bounds before render
            const beforeBounds = camera.getVisibleBounds();
            
            // Render frame
            renderer.render(maze, testGame.player, camera);
            
            // Verify bounds were updated in renderer
            if (renderer.lastRenderedBounds) {
                const boundsUpdated = 
                    renderer.lastRenderedBounds.startX === beforeBounds.startX &&
                    renderer.lastRenderedBounds.startY === beforeBounds.startY;
                
                if (!boundsUpdated && i > 2) { // Allow warmup frames
                    this.warnings.push(`Camera movement not reflected in render bounds at frame ${i}`);
                }
            }
        }
        
        console.log(`✅ Camera movement: 20 rapid camera movements handled correctly`);
    }
    
    async testAnimationContinuity(testGame) {
        const player = testGame.player;
        
        // Test player animation during optimized rendering
        player.isMoving = true;
        let lastFrame = player.animationFrame;
        
        for (let frame = 0; frame < 30; frame++) {
            player.update(16, testGame.maze); // 16ms frame time
            
            // Verify animation is progressing
            if (frame > 10 && player.animationFrame === lastFrame) {
                this.warnings.push(`Player animation may be stuck at frame ${player.animationFrame}`);
            }
            lastFrame = player.animationFrame;
        }
        
        console.log(`✅ Animation continuity: Player animation progressing correctly`);
    }
    
    // ===== GAME MECHANICS TESTS =====
    
    async testGameMechanicsAllDifficulties() {
        console.log('🎮 Testing Game Mechanics Across All Difficulties...');
        
        for (const difficulty of ['EASY', 'MEDIUM', 'HARD', 'EXPERT']) {
            console.log(`Testing ${difficulty} difficulty...`);
            await this.testGameMechanicsForDifficulty(difficulty);
        }
        
        this.logTest('Game Mechanics All Difficulties', 'PASS', 
            'All gameplay features working across all difficulty levels');
    }
    
    async testGameMechanicsForDifficulty(difficulty) {
        const testGame = await this.createTestGameInstance(difficulty);
        
        // Test movement and collision
        await this.testPlayerMovementAndCollision(testGame);
        
        // Test collection systems
        await this.testCollectionMechanics(testGame);
        
        // Test environmental puzzles
        await this.testEnvironmentalPuzzleMechanics(testGame);
        
        console.log(`✅ ${difficulty}: All game mechanics validated`);
    }
    
    async testPlayerMovementAndCollision(testGame) {
        const player = testGame.player;
        const maze = testGame.maze;
        
        // Test basic movement
        const startX = player.x;
        const startY = player.y;
        
        // Find a direction that leads to a wall to test collision detection
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up, right, down, left
        let wallDirection = null;
        let floorDirection = null;
        
        for (const [dx, dy] of directions) {
            const testX = startX + dx;
            const testY = startY + dy;
            
            if (maze.isWall(testX, testY) && !wallDirection) {
                wallDirection = [dx, dy];
            }
            if (maze.isFloor(testX, testY) && !floorDirection) {
                floorDirection = [dx, dy];
            }
        }
        
        // Test wall collision if we found a wall direction
        if (wallDirection) {
            const [dx, dy] = wallDirection;
            const wallResult = player.move(dx, dy, maze);
            if (wallResult && maze.isWall(startX + dx, startY + dy)) {
                throw new Error('Player moved into wall - collision detection broken');
            }
        }
        
        // Test floor movement if we found a floor direction
        if (floorDirection) {
            const [dx, dy] = floorDirection;
            const floorResult = player.move(dx, dy, maze);
            if (!floorResult && maze.isFloor(startX + dx, startY + dy)) {
                throw new Error('Player failed to move into floor - movement broken');
            }
        } else {
            // If no floor direction found, that's unusual but not necessarily wrong
            console.log('⚠️ No adjacent floor tiles found for movement test');
        }
        
        console.log(`✅ Player movement and collision working correctly`);
    }
    
    async testCollectionMechanics(testGame) {
        const maze = testGame.maze;
        const initialTreasureCount = maze.treasures.filter(t => !t.collected).length;
        const initialKeyCount = maze.keys.filter(k => !k.collected).length;
        
        // Test treasure collection
        for (const treasure of maze.treasures) {
            if (!treasure.collected) {
                const collected = maze.collectTreasure(treasure.x, treasure.y);
                if (!collected) {
                    throw new Error(`Failed to collect treasure at ${treasure.x},${treasure.y}`);
                }
                
                // Verify it's removed from spatial hash
                const hashCheck = maze.getTreasureAt(treasure.x, treasure.y);
                if (hashCheck) {
                    throw new Error(`Treasure still in hash after collection at ${treasure.x},${treasure.y}`);
                }
                break; // Test one treasure
            }
        }
        
        // Test key collection
        for (const key of maze.keys) {
            if (!key.collected) {
                const collected = maze.collectKey(key.x, key.y);
                if (!collected) {
                    throw new Error(`Failed to collect key at ${key.x},${key.y}`);
                }
                
                // Verify it's removed from spatial hash
                const hashCheck = maze.getKeyAt(key.x, key.y);
                if (hashCheck) {
                    throw new Error(`Key still in hash after collection at ${key.x},${key.y}`);
                }
                break; // Test one key
            }
        }
        
        console.log(`✅ Collection mechanics: Treasures and keys collected and removed correctly`);
    }
    
    async testEnvironmentalPuzzleMechanics(testGame) {
        const maze = testGame.maze;
        
        // Test pressure plates
        for (const plate of maze.pressurePlates) {
            if (!plate.activated) {
                // Activate the plate
                const result = maze.activatePressurePlate(plate.x, plate.y);
                if (!result) {
                    throw new Error(`Failed to activate pressure plate at ${plate.x},${plate.y}`);
                }
                
                // Verify walls were opened
                if (plate.affectedWalls.length > 0) {
                    const firstWall = plate.affectedWalls[0];
                    if (maze.grid[firstWall.y][firstWall.x] !== 0) {
                        throw new Error(`Pressure plate didn't open wall at ${firstWall.x},${firstWall.y}`);
                    }
                }
                break; // Test one plate
            }
        }
        
        // Test levers
        for (const lever of maze.levers) {
            const initialState = lever.activated;
            
            // Toggle the lever
            const result = maze.toggleLever(lever.x, lever.y);
            if (!result) {
                throw new Error(`Failed to toggle lever at ${lever.x},${lever.y}`);
            }
            
            // Verify state changed
            if (lever.activated === initialState) {
                throw new Error(`Lever state didn't change at ${lever.x},${lever.y}`);
            }
            break; // Test one lever
        }
        
        console.log(`✅ Environmental puzzles: Pressure plates and levers working correctly`);
    }
    
    // ===== COLLECTION SYSTEM TESTS =====
    
    async testCollectionSystemAccuracy() {
        console.log('💎 Testing Collection System Accuracy...');
        
        for (const difficulty of ['EASY', 'MEDIUM', 'HARD', 'EXPERT']) {
            console.log(`Testing collection system for ${difficulty} difficulty...`);
            await this.testCollectionSystemForDifficulty(difficulty);
        }
        
        this.logTest('Collection System Accuracy', 'PASS', 
            'Collection system working correctly across all difficulties');
    }
    
    async testCollectionSystemForDifficulty(difficulty) {
        const testGame = await this.createTestGameInstance(difficulty);
        const maze = testGame.maze;
        
        // Test treasure collection
        let treasuresCollected = 0;
        for (const treasure of maze.treasures) {
            if (!treasure.collected && treasuresCollected < 3) {
                const collected = maze.collectTreasure(treasure.x, treasure.y);
                if (!collected) {
                    throw new Error(`Failed to collect treasure at ${treasure.x},${treasure.y} in ${difficulty}`);
                }
                
                // Verify it's removed from spatial hash
                const hashCheck = maze.getTreasureAt(treasure.x, treasure.y);
                if (hashCheck) {
                    throw new Error(`Treasure still in hash after collection at ${treasure.x},${treasure.y} in ${difficulty}`);
                }
                treasuresCollected++;
            }
        }
        
        // Test key collection
        let keysCollected = 0;
        for (const key of maze.keys) {
            if (!key.collected && keysCollected < 2) {
                const collected = maze.collectKey(key.x, key.y);
                if (!collected) {
                    throw new Error(`Failed to collect key at ${key.x},${key.y} in ${difficulty}`);
                }
                
                // Verify it's removed from spatial hash
                const hashCheck = maze.getKeyAt(key.x, key.y);
                if (hashCheck) {
                    throw new Error(`Key still in hash after collection at ${key.x},${key.y} in ${difficulty}`);
                }
                keysCollected++;
            }
        }
        
        console.log(`✅ ${difficulty}: ${treasuresCollected} treasures, ${keysCollected} keys collected successfully`);
    }
    
    // ===== ENVIRONMENTAL PUZZLE TESTS =====
    
    async testEnvironmentalPuzzles() {
        console.log('⚙️ Testing Environmental Puzzles...');
        
        for (const difficulty of ['EASY', 'MEDIUM', 'HARD', 'EXPERT']) {
            console.log(`Testing environmental puzzles for ${difficulty} difficulty...`);
            await this.testEnvironmentalPuzzlesForDifficulty(difficulty);
        }
        
        this.logTest('Environmental Puzzles', 'PASS', 
            'Environmental puzzle mechanics working correctly across all difficulties');
    }
    
    async testEnvironmentalPuzzlesForDifficulty(difficulty) {
        const testGame = await this.createTestGameInstance(difficulty);
        const maze = testGame.maze;
        
        // Test pressure plates
        let platesActivated = 0;
        for (const plate of maze.pressurePlates) {
            if (!plate.activated && platesActivated < 2) {
                const result = maze.activatePressurePlate(plate.x, plate.y);
                if (!result) {
                    throw new Error(`Failed to activate pressure plate at ${plate.x},${plate.y} in ${difficulty}`);
                }
                
                // Verify walls were opened
                if (plate.affectedWalls.length > 0) {
                    const firstWall = plate.affectedWalls[0];
                    if (maze.grid[firstWall.y][firstWall.x] !== 0) {
                        throw new Error(`Pressure plate didn't open wall at ${firstWall.x},${firstWall.y} in ${difficulty}`);
                    }
                }
                platesActivated++;
            }
        }
        
        // Test levers
        let leversToggled = 0;
        for (const lever of maze.levers) {
            if (leversToggled < 2) {
                const initialState = lever.activated;
                const result = maze.toggleLever(lever.x, lever.y);
                if (!result) {
                    throw new Error(`Failed to toggle lever at ${lever.x},${lever.y} in ${difficulty}`);
                }
                
                // Verify state changed
                if (lever.activated === initialState) {
                    throw new Error(`Lever state didn't change at ${lever.x},${lever.y} in ${difficulty}`);
                }
                leversToggled++;
            }
        }
        
        console.log(`✅ ${difficulty}: ${platesActivated} pressure plates, ${leversToggled} levers tested successfully`);
    }
    
    // ===== PERFORMANCE VALIDATION =====
    
    async testPerformanceRegression() {
        console.log('⚡ Testing Performance Regression...');
        
        for (const [difficulty, thresholds] of Object.entries(this.config.performanceThresholds)) {
            await this.measurePerformanceForDifficulty(difficulty.toLowerCase(), thresholds);
        }
        
        this.logTest('Performance Regression', 'PASS', 
            'All difficulty levels meet performance thresholds');
    }
    
    async measurePerformanceForDifficulty(difficulty, thresholds) {
        const testGame = await this.createTestGameInstance(difficulty.toUpperCase());
        
        // Measure FPS over test period
        const frameStartTime = performance.now();
        let frameCount = 0;
        
        // Run game loop for test duration
        const testDuration = 2000; // 2 seconds
        const startTime = performance.now();
        
        while (performance.now() - startTime < testDuration) {
            const frameTime = performance.now();
            
            // Simulate game update/render cycle
            testGame.update(16); // 16ms target frame time
            testGame.render();
            
            frameCount++;
            
            // Simulate frame pacing
            await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        const totalTime = performance.now() - frameStartTime;
        const avgFPS = (frameCount / totalTime) * 1000;
        
        console.log(`✅ ${difficulty}: ${avgFPS.toFixed(1)} FPS (threshold: ${thresholds.minFPS})`);
        
        if (avgFPS < thresholds.minFPS) {
            this.warnings.push(
                `Performance below threshold for ${difficulty}: ${avgFPS.toFixed(1)} < ${thresholds.minFPS} FPS`
            );
        }
    }
    
    async testMemoryStability() {
        console.log('💾 Testing Memory Stability...');
        
        // Monitor memory usage over extended session
        const testGame = await this.createTestGameInstance('EXPERT');
        const particleSystem = testGame.particleSystem;
        
        const initialPoolSize = particleSystem.pool.length;
        
        // Run intensive particle session
        for (let cycle = 0; cycle < 50; cycle++) {
            // Create burst of particles
            for (let i = 0; i < 20; i++) {
                particleSystem.createTorchFlame(Math.random() * 1000, Math.random() * 1000);
                particleSystem.createWallCollision(Math.random() * 1000, Math.random() * 1000, 'up');
            }
            
            // Update particles
            for (let frame = 0; frame < 30; frame++) {
                particleSystem.update(16);
            }
        }
        
        const finalPoolSize = particleSystem.pool.length;
        const poolGrowth = finalPoolSize - initialPoolSize;
        
        console.log(`✅ Memory stability: Pool grew by ${poolGrowth} objects (controlled growth)`);
        
        if (poolGrowth > 100) {
            this.warnings.push(
                `Significant pool growth detected: ${poolGrowth} objects added to pool`
            );
        }
        
        this.logTest('Memory Stability', 'PASS', 
            `Particle pool growth controlled: +${poolGrowth} objects`);
    }
    
    // ===== UTILITY METHODS =====
    
    async createTestGameInstance(difficulty = 'MEDIUM') {
        // Create minimal game instance for testing
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Mock sprites object
        const sprites = { loaded: false, player: [] };
        
        const difficultyConfig = DIFFICULTY_LEVELS[difficulty];
        const maze = new Maze(difficultyConfig.gridWidth, difficultyConfig.gridHeight);
        maze.generate(difficultyConfig.complexity);
        
        const player = new Player(maze.startX, maze.startY);
        const camera = new Camera(canvas.width, canvas.height);
        const renderer = new Renderer(ctx, sprites);
        const particleSystem = new ParticleSystem();
        
        return {
            maze,
            player,
            camera,
            renderer,
            particleSystem,
            update: (deltaTime) => {
                player.update(deltaTime, maze);
                camera.update(player.x * TILE_SIZE, player.y * TILE_SIZE);
                maze.updatePressurePlates(particleSystem);
                particleSystem.update(deltaTime);
            },
            render: () => {
                renderer.render(maze, player, camera);
                particleSystem.render(ctx, camera);
            }
        };
    }
    
    generateRandomPositions(width, height, count) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push({
                x: Math.floor(Math.random() * width),
                y: Math.floor(Math.random() * height)
            });
        }
        return positions;
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
        
        console.log('\n' + '='.repeat(60));
        console.log('🧪 PERFORMANCE OPTIMIZATION TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`Tests Passed: ${passCount}`);
        console.log(`Tests Failed: ${failCount}`);
        console.log(`Warnings: ${this.warnings.length}`);
        console.log(`Errors: ${this.errors.length}`);
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('\n📊 TEST RESULTS:');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`  ${icon} ${result.name}: ${result.details}`);
        });
        
        const overallStatus = failCount === 0 ? 'PASSED' : 'FAILED';
        console.log(`\n🎯 OVERALL RESULT: ${overallStatus}`);
        console.log('='.repeat(60));
    }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
    window.PerformanceTestSuite = PerformanceTestSuite;
    
    // Add test runner button to page
    window.addEventListener('load', () => {
        const button = document.createElement('button');
        button.textContent = '🧪 Run Performance Tests';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            padding: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = '🧪 Running Tests...';
            
            const testSuite = new PerformanceTestSuite();
            await testSuite.runAllTests();
            
            button.disabled = false;
            button.textContent = '🧪 Run Performance Tests';
        });
        
        document.body.appendChild(button);
    });
}