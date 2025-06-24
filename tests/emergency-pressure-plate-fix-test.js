// Emergency Pressure Plate Fix Validation Test
// Specifically tests that pressure plates cannot appear on walls

class EmergencyPressurePlateFixTest {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.startTime = 0;
    }
    
    async runEmergencyTest() {
        console.log('🚨 EMERGENCY PRESSURE PLATE FIX VALIDATION TEST');
        console.log('Testing that pressure plates cannot appear on walls...\n');
        this.startTime = performance.now();
        
        try {
            // Test 1: Basic validation function
            await this.testValidationFunction();
            
            // Test 2: Multiple maze generations 
            await this.testMultipleMazeGenerations();
            
            // Test 3: Stress test with complex mazes
            await this.testComplexMazeStress();
            
            // Test 4: Phase 2 multi-path interaction
            await this.testPhase2Interaction();
            
            this.generateEmergencyReport();
            
        } catch (error) {
            this.errors.push(`Critical emergency test failure: ${error.message}`);
            this.generateEmergencyReport();
        }
    }
    
    async testValidationFunction() {
        console.log('🔧 Testing validation function...');
        
        // Create a test maze
        const maze = new Maze(20, 20);
        maze.generate(0.5);
        
        // Artificially create a pressure plate on a wall to test validation
        maze.grid[5][5] = 1; // Make it a wall
        maze.pressurePlates.push({
            x: 5,
            y: 5,
            activated: false,
            affectedWalls: [],
            timer: 0
        });
        
        const beforeCount = maze.pressurePlates.length;
        
        // Test the validation function
        maze.validatePressurePlatePositions();
        
        const afterCount = maze.pressurePlates.length;
        const removed = beforeCount - afterCount;
        
        const success = removed === 1; // Should have removed the wall-placed pressure plate
        
        this.logTest(
            'Validation Function',
            success ? 'PASS' : 'FAIL',
            `Removed ${removed} pressure plate(s) from walls`
        );
        
        if (!success) {
            this.errors.push(`Validation function failed: expected 1 removal, got ${removed}`);
        }
    }
    
    async testMultipleMazeGenerations() {
        console.log('🏗️ Testing multiple maze generations...');
        
        let totalMazes = 0;
        let mazesWithWallPlates = 0;
        let totalPlatesOnWalls = 0;
        
        // Test 20 different maze configurations
        for (let i = 0; i < 20; i++) {
            const maze = new Maze(25, 25);
            maze.generate(Math.random() * 0.8 + 0.2); // Random complexity 0.2-1.0
            
            totalMazes++;
            
            // Check every pressure plate position
            let wallPlatesInThisMaze = 0;
            for (const plate of maze.pressurePlates) {
                if (maze.grid[plate.y][plate.x] !== 0) {
                    wallPlatesInThisMaze++;
                    totalPlatesOnWalls++;
                }
            }
            
            if (wallPlatesInThisMaze > 0) {
                mazesWithWallPlates++;
            }
        }
        
        const success = totalPlatesOnWalls === 0;
        
        this.logTest(
            'Multiple Maze Generations',
            success ? 'PASS' : 'FAIL',
            `${totalPlatesOnWalls} pressure plates found on walls across ${totalMazes} mazes`
        );
        
        if (!success) {
            this.errors.push(`Found ${totalPlatesOnWalls} pressure plates on walls in ${mazesWithWallPlates} mazes`);
        }
    }
    
    async testComplexMazeStress() {
        console.log('💪 Stress testing complex mazes...');
        
        let totalPlatesOnWalls = 0;
        let totalMazes = 0;
        
        // Test larger, more complex mazes that trigger more solvability attempts
        for (let i = 0; i < 10; i++) {
            const maze = new Maze(35, 30); // Large maze
            maze.generate(0.9); // High complexity
            
            totalMazes++;
            
            // Check all pressure plates
            for (const plate of maze.pressurePlates) {
                if (maze.grid[plate.y][plate.x] !== 0) {
                    totalPlatesOnWalls++;
                    console.error(`🚨 FOUND PRESSURE PLATE ON WALL: (${plate.x},${plate.y}) in maze ${i + 1}`);
                }
            }
        }
        
        const success = totalPlatesOnWalls === 0;
        
        this.logTest(
            'Complex Maze Stress Test',
            success ? 'PASS' : 'FAIL',
            `${totalPlatesOnWalls} pressure plates found on walls in ${totalMazes} complex mazes`
        );
        
        if (!success) {
            this.errors.push(`Stress test found ${totalPlatesOnWalls} pressure plates on walls`);
        }
    }
    
    async testPhase2Interaction() {
        console.log('🛤️ Testing Phase 2 multi-path interaction...');
        
        let totalPlatesOnWalls = 0;
        let totalMazes = 0;
        let phase2Activations = 0;
        
        // Test mazes that should trigger Phase 2 multi-path
        for (let i = 0; i < 10; i++) {
            const maze = new Maze(30, 25); // Size that should trigger Phase 2
            maze.generate(0.7);
            
            totalMazes++;
            
            // Check if Phase 2 was activated (look for alternative route pressure plates)
            const hasAlternativeRoutes = maze.pressurePlates.some(p => p.isAlternativeRoute);
            if (hasAlternativeRoutes) {
                phase2Activations++;
            }
            
            // Check all pressure plates (including Phase 2 ones)
            for (const plate of maze.pressurePlates) {
                if (maze.grid[plate.y][plate.x] !== 0) {
                    totalPlatesOnWalls++;
                    console.error(`🚨 PHASE 2 PRESSURE PLATE ON WALL: (${plate.x},${plate.y}) alternative=${!!plate.isAlternativeRoute}`);
                }
            }
        }
        
        const success = totalPlatesOnWalls === 0;
        
        this.logTest(
            'Phase 2 Multi-Path Interaction',
            success ? 'PASS' : 'FAIL',
            `${totalPlatesOnWalls} pressure plates on walls, ${phase2Activations} Phase 2 activations`
        );
        
        if (!success) {
            this.errors.push(`Phase 2 test found ${totalPlatesOnWalls} pressure plates on walls`);
        }
    }
    
    // Utility methods
    
    logTest(testName, status, details) {
        this.testResults.push({
            name: testName,
            status,
            details,
            timestamp: performance.now() - this.startTime
        });
    }
    
    generateEmergencyReport() {
        const totalTime = performance.now() - this.startTime;
        const passCount = this.testResults.filter(t => t.status === 'PASS').length;
        const failCount = this.testResults.filter(t => t.status === 'FAIL').length;
        
        console.log('\\n' + '='.repeat(60));
        console.log('🚨 EMERGENCY PRESSURE PLATE FIX TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`Tests Passed: ${passCount}`);
        console.log(`Tests Failed: ${failCount}`);
        console.log(`Errors: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\\n❌ CRITICAL ERRORS:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('\\n📊 TEST RESULTS:');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`  ${icon} ${result.name}: ${result.details}`);
        });
        
        const overallStatus = failCount === 0 ? 'EMERGENCY FIX SUCCESSFUL' : 'EMERGENCY FIX FAILED';
        const statusIcon = overallStatus === 'EMERGENCY FIX SUCCESSFUL' ? '🟢' : '🔴';
        
        console.log(`\\n${statusIcon} EMERGENCY STATUS: ${overallStatus}`);
        
        if (overallStatus === 'EMERGENCY FIX SUCCESSFUL') {
            console.log('✅ Pressure plates are no longer appearing on walls!');
            console.log('🛡️ Emergency validation system is working correctly');
        } else {
            console.log('⚠️ CRITICAL: Pressure plates are still appearing on walls');
            console.log('🔧 Additional fixes required immediately');
        }
        
        console.log('='.repeat(60));
    }
}

// Export for use in test runner
if (typeof window !== 'undefined') {
    window.EmergencyPressurePlateFixTest = EmergencyPressurePlateFixTest;
}