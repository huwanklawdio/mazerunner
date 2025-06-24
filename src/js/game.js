// Main game class and game loop
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.status = document.getElementById('status');
        
        // Game state
        this.state = 'start'; // 'start', 'playing', 'won'
        this.lastTime = 0;
        
        // Difficulty settings
        this.currentDifficulty = 'MEDIUM';
        this.difficultyConfig = DIFFICULTY_LEVELS[this.currentDifficulty];
        
        // Game stats
        this.startTime = 0;
        this.currentTime = 0;
        this.stepCount = 0;
        this.treasureScore = 0;
        this.collectedKeys = []; // Array of collected key colors
        this.stats = this.loadStats();
        
        // Achievement tracking
        this.wallCollisions = 0;
        this.perfectStreak = this.loadStreakData().perfectStreak || 0;
        this.winStreak = this.loadStreakData().winStreak || 0;
        this.completedDifficulties = this.loadCompletedDifficulties();
        
        // Game objects
        this.maze = null;
        this.player = null;
        this.camera = null;
        this.renderer = null;
        this.audio = null;
        this.miniMap = null;
        this.achievementSystem = null;
        this.achievementUI = null;
        this.particleSystem = null;
        
        // Sprite resources
        this.sprites = {
            player: [],
            loaded: false
        };
        
        // Input handling
        this.keys = {};
        this.keyPressed = {};
        
        this.loadSprites().then(() => {
            this.init();
        });
    }
    
    async loadSprites() {
        const spriteFiles = ['step-1.png', 'step-2.png', 'step-3.png', 'step-4.png', 'step-5.png'];
        const loadPromises = spriteFiles.map(filename => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = `sprites/${filename}`;
            });
        });
        
        try {
            this.sprites.player = await Promise.all(loadPromises);
            this.sprites.loaded = true;
            console.log('Successfully loaded 5 sprite frames');
        } catch (error) {
            console.warn('Failed to load sprites, falling back to simple rendering:', error);
            this.sprites.loaded = false;
        }
    }
    
    init() {
        // Set up pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        
        // Initialize game objects with current difficulty
        this.maze = new Maze(this.difficultyConfig.gridWidth, this.difficultyConfig.gridHeight);
        this.player = new Player(1, 1); // Start position
        this.camera = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT);
        this.renderer = new Renderer(this.ctx, this.sprites);
        this.audio = new AudioSystem();
        
        // Create mini-map canvas
        this.miniMapCanvas = document.createElement('canvas');
        this.miniMap = new MiniMap(this.miniMapCanvas, this.maze);
        
        // Initialize achievement system
        this.achievementSystem = new AchievementSystem();
        this.achievementUI = new AchievementUI(this.achievementSystem);
        
        // Initialize particle system
        this.particleSystem = new ParticleSystem();
        
        // Set up input handling
        this.setupInput();
        
        // Set up control buttons and difficulty selector
        this.setupControls();
        
        // Set up stats display
        this.setupStatsDisplay();
        
        // Set up side panel
        this.setupSidePanel();
        
        // Set initial status message
        this.status.textContent = `${this.difficultyConfig.name} - ${this.difficultyConfig.description}. Press SPACE to start`;
        
        // Start game loop
        this.gameLoop(0);
    }
    
    setupSidePanel() {
        const panelToggle = document.getElementById('panelToggle');
        const sidePanel = document.getElementById('sidePanel');
        
        panelToggle.addEventListener('click', () => {
            sidePanel.classList.toggle('collapsed');
            
            // Update toggle button text
            if (sidePanel.classList.contains('collapsed')) {
                panelToggle.textContent = '▶';
            } else {
                panelToggle.textContent = '◀';
            }
        });
        
        // Auto-collapse panel during gameplay
        const originalStartGame = this.startNewGame.bind(this);
        this.startNewGame = () => {
            originalStartGame();
            // Auto-collapse panel when game starts
            if (window.innerWidth < 1200) { // Only on smaller screens
                sidePanel.classList.add('collapsed');
                panelToggle.textContent = '▶';
            }
        };
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.keyPressed[e.code] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Add click handling for start button
        this.canvas.addEventListener('click', (e) => {
            if (this.state === 'start' && this.startButtonBounds) {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                if (clickX >= this.startButtonBounds.x && 
                    clickX <= this.startButtonBounds.x + this.startButtonBounds.width &&
                    clickY >= this.startButtonBounds.y && 
                    clickY <= this.startButtonBounds.y + this.startButtonBounds.height) {
                    this.startNewGame();
                }
            }
        });
    }
    
    setupControls() {
        // Difficulty selector
        const difficultySelect = document.getElementById('difficulty');
        difficultySelect.style.pointerEvents = 'auto';
        
        difficultySelect.addEventListener('change', (e) => {
            if (this.state === 'start') {
                this.changeDifficulty(e.target.value);
            }
        });
        
        // Sound toggle
        const soundToggle = document.getElementById('soundToggle');
        soundToggle.style.pointerEvents = 'auto';
        
        soundToggle.addEventListener('click', () => {
            const enabled = this.audio.toggleSound();
            soundToggle.textContent = enabled ? '🔊' : '🔇';
            soundToggle.classList.toggle('disabled', !enabled);
        });
        
        // Mini-map toggle
        const mapToggle = document.getElementById('mapToggle');
        mapToggle.style.pointerEvents = 'auto';
        
        mapToggle.addEventListener('click', () => {
            const visible = this.miniMap.toggle();
            mapToggle.classList.toggle('disabled', !visible);
            mapToggle.title = visible ? 'Hide Mini-map' : 'Show Mini-map';
        });
        
        // Achievements button
        const achievementsBtn = document.getElementById('achievementsBtn');
        if (achievementsBtn) {
            achievementsBtn.style.pointerEvents = 'auto';
            achievementsBtn.addEventListener('click', () => {
                if (this.achievementUI) {
                    this.achievementUI.showModal();
                }
            });
        }
    }
    
    setupStatsDisplay() {
        // Stats are now in the side panel, just initialize best time display
        const bestTimeElement = document.getElementById('bestTime');
        if (bestTimeElement) {
            bestTimeElement.textContent = this.formatTime(this.stats.bestTime);
        }
    }
    
    loadStats() {
        const saved = localStorage.getItem('mazerunner-stats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            bestTime: Infinity,
            totalGames: 0,
            totalSteps: 0,
            averageTime: 0
        };
    }
    
    loadCompletedDifficulties() {
        const saved = localStorage.getItem('mazerunner-completed-difficulties');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }
    
    saveCompletedDifficulties() {
        localStorage.setItem('mazerunner-completed-difficulties', JSON.stringify(this.completedDifficulties));
    }
    
    loadStreakData() {
        const saved = localStorage.getItem('mazerunner-streaks');
        if (saved) {
            return JSON.parse(saved);
        }
        return { perfectStreak: 0, winStreak: 0 };
    }
    
    saveStreakData() {
        const streakData = {
            perfectStreak: this.perfectStreak,
            winStreak: this.winStreak
        };
        localStorage.setItem('mazerunner-streaks', JSON.stringify(streakData));
    }
    
    saveStats() {
        localStorage.setItem('mazerunner-stats', JSON.stringify(this.stats));
    }
    
    formatTime(seconds) {
        if (seconds === Infinity) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    update(deltaTime) {
        // Handle input
        this.handleInput();
        
        // Update game objects based on state
        if (this.state === 'playing') {
            this.player.update(deltaTime, this.maze);
            this.camera.update(this.player.x * TILE_SIZE, this.player.y * TILE_SIZE);
            
            // Check for treasure collection after player position update
            this.checkTreasureCollection();
            
            // Update environmental puzzles
            this.maze.updatePressurePlates(this.particleSystem);
            
            // Update timer
            this.currentTime = (Date.now() - this.startTime) / 1000;
            this.updateTimerDisplay();
            
            // Check win condition
            if (this.player.x === this.maze.endX && this.player.y === this.maze.endY) {
                this.state = 'won';
                
                // Clear any existing notifications before game completion
                window.notificationSystem.clear();
                
                this.completeGame();
                this.audio.playVictory();
                
                // Show level complete notification with immediate priority
                const stats = {
                    time: this.formatTime(this.currentTime),
                    steps: this.stepCount
                };
                window.notificationSystem.showLevelComplete(stats);
                
                // Create victory particles
                this.particleSystem.createVictoryEffect(
                    this.maze.endX * TILE_SIZE + TILE_SIZE / 2,
                    this.maze.endY * TILE_SIZE + TILE_SIZE / 2
                );
            }
            
            // Create portal effects
            if (Math.random() < 0.1) { // 10% chance per frame
                this.particleSystem.createPortalEffect(
                    this.maze.startX * TILE_SIZE + TILE_SIZE / 2,
                    this.maze.startY * TILE_SIZE + TILE_SIZE / 2,
                    COLORS.START_GLOW
                );
                this.particleSystem.createPortalEffect(
                    this.maze.endX * TILE_SIZE + TILE_SIZE / 2,
                    this.maze.endY * TILE_SIZE + TILE_SIZE / 2,
                    COLORS.END_GLOW
                );
            }
            
            // Create torch flame particles (optimized with budget system)
            this.updateTorchParticles();
        }
        
        // Update particle system
        this.particleSystem.update(deltaTime);
        
        // Clear key pressed flags
        this.keyPressed = {};
    }
    
    updateTorchParticles() {
        // Performance optimization: limit torch particles with budget system
        const maxTorchParticles = 8; // Max particles per frame from all torches
        let particleBudget = maxTorchParticles;
        
        const bounds = this.camera.getVisibleBounds();
        const visibleTorches = this.maze.torches.filter(torch => 
            torch.x >= bounds.startX && torch.x < bounds.endX &&
            torch.y >= bounds.startY && torch.y < bounds.endY
        );
        
        // Distribute particles fairly among visible torches
        if (visibleTorches.length > 0) {
            const particlesPerTorch = Math.floor(particleBudget / visibleTorches.length);
            const remainder = particleBudget % visibleTorches.length;
            
            for (let i = 0; i < visibleTorches.length && particleBudget > 0; i++) {
                const torch = visibleTorches[i];
                let torchParticles = particlesPerTorch;
                
                // Give remainder particles to first few torches
                if (i < remainder) torchParticles++;
                
                // Only create particles if we have budget and random chance
                if (torchParticles > 0 && Math.random() < 0.4) {
                    let torchX = torch.x * TILE_SIZE + TILE_SIZE / 2;
                    let torchY = torch.y * TILE_SIZE + TILE_SIZE / 2;
                    
                    // Offset based on wall side
                    switch (torch.side) {
                        case 'top':
                            torchY = torch.y * TILE_SIZE + 8;
                            break;
                        case 'bottom':
                            torchY = torch.y * TILE_SIZE + TILE_SIZE - 8;
                            break;
                        case 'left':
                            torchX = torch.x * TILE_SIZE + 8;
                            break;
                        case 'right':
                            torchX = torch.x * TILE_SIZE + TILE_SIZE - 8;
                            break;
                    }
                    
                    // Create limited particles
                    for (let j = 0; j < Math.min(torchParticles, 2); j++) {
                        this.particleSystem.createTorchFlame(torchX, torchY - 8);
                        particleBudget--;
                    }
                }
            }
        }
    }
    
    handleInput() {
        if (this.keyPressed['Space'] || this.keyPressed['Enter']) {
            if (this.state === 'start' || this.state === 'won') {
                this.startNewGame();
            }
        }
        
        // Reset streak if player restarts during game
        if (this.keyPressed['KeyR'] && this.state === 'playing') {
            this.winStreak = 0;
            this.perfectStreak = 0;
            this.saveStreakData();
            this.startNewGame();
        }
        
        if (this.state === 'playing') {
            let moved = false;
            let attemptedMove = false;
            
            let direction = null;
            
            if (this.keyPressed['ArrowUp']) {
                attemptedMove = true;
                direction = 'up';
                // Check if we're trying to move into a locked door
                const targetX = this.player.x;
                const targetY = this.player.y - 1;
                this.checkDoorUnlock(targetX, targetY);
                
                const moveResult = this.player.move(0, -1, this.maze);
                moved = moveResult.success || moveResult === true;
                if (moved && moveResult.newX !== undefined) {
                    this.checkPressurePlateActivation(moveResult.newX, moveResult.newY);
                }
            } else if (this.keyPressed['ArrowDown']) {
                attemptedMove = true;
                direction = 'down';
                // Check if we're trying to move into a locked door
                const targetX = this.player.x;
                const targetY = this.player.y + 1;
                this.checkDoorUnlock(targetX, targetY);
                
                const moveResult = this.player.move(0, 1, this.maze);
                moved = moveResult.success || moveResult === true;
                if (moved && moveResult.newX !== undefined) {
                    this.checkPressurePlateActivation(moveResult.newX, moveResult.newY);
                }
            } else if (this.keyPressed['ArrowLeft']) {
                attemptedMove = true;
                direction = 'left';
                // Check if we're trying to move into a locked door
                const targetX = this.player.x - 1;
                const targetY = this.player.y;
                this.checkDoorUnlock(targetX, targetY);
                
                const moveResult = this.player.move(-1, 0, this.maze);
                moved = moveResult.success || moveResult === true;
                if (moved && moveResult.newX !== undefined) {
                    this.checkPressurePlateActivation(moveResult.newX, moveResult.newY);
                }
            } else if (this.keyPressed['ArrowRight']) {
                attemptedMove = true;
                direction = 'right';
                // Check if we're trying to move into a locked door
                const targetX = this.player.x + 1;
                const targetY = this.player.y;
                this.checkDoorUnlock(targetX, targetY);
                
                const moveResult = this.player.move(1, 0, this.maze);
                moved = moveResult.success || moveResult === true;
                if (moved && moveResult.newX !== undefined) {
                    this.checkPressurePlateActivation(moveResult.newX, moveResult.newY);
                }
            }
            
            // Check for lever activation
            if (this.keyPressed['KeyE']) {
                const lever = this.maze.getLeverAt(this.player.x, this.player.y);
                if (lever) {
                    const result = this.maze.toggleLever(this.player.x, this.player.y);
                    if (result) {
                        // Show parchment notification for puzzle solved
                        window.notificationSystem.showPuzzleSolved('lever');
                    }
                    this.audio.playKeyCollect(); // Reuse key collection sound for lever
                }
            }
            
            // Play sound effects and create particles
            if (attemptedMove) {
                // Resume audio context on first user interaction
                this.audio.resume();
                
                if (moved) {
                    this.audio.playFootstep();
                    this.stepCount++;
                    this.updateStepsDisplay();
                    
                    // Create footstep dust particles
                    const playerPos = this.player.getRenderPosition();
                    this.particleSystem.createFootstepDust(
                        playerPos.x * TILE_SIZE + TILE_SIZE / 2,
                        playerPos.y * TILE_SIZE + TILE_SIZE / 2,
                        direction
                    );
                    
                } else {
                    // Check if collision was with a door that can be unlocked
                    let newX = this.player.x;
                    let newY = this.player.y;
                    
                    if (direction === 'up') newY--;
                    else if (direction === 'down') newY++;
                    else if (direction === 'left') newX--;
                    else if (direction === 'right') newX++;
                    
                    const door = this.maze.getDoorAt(newX, newY);
                    if (door && !door.unlocked && this.collectedKeys.includes(door.color)) {
                        // Unlock the door
                        door.unlocked = true;
                        
                        // Create door unlock particles
                        this.particleSystem.createDoorUnlock(
                            newX * TILE_SIZE + TILE_SIZE / 2,
                            newY * TILE_SIZE + TILE_SIZE / 2,
                            door.color
                        );
                        
                        // Play door unlock sound
                        this.audio.playDoorUnlock();
                    } else {
                        this.audio.playWallCollision();
                        this.wallCollisions++;
                        
                        // Create wall collision particles
                        const playerPos = this.player.getRenderPosition();
                        this.particleSystem.createWallCollision(
                            playerPos.x * TILE_SIZE + TILE_SIZE / 2,
                            playerPos.y * TILE_SIZE + TILE_SIZE / 2,
                            direction
                        );
                    }
                }
            }
        }
    }
    
    checkPressurePlateActivation(x, y) {
        const plate = this.maze.getPressurePlateAt(x, y);
        if (plate && !plate.activated) {
            const result = this.maze.activatePressurePlate(x, y, this.particleSystem);
            if (result) {
                // Show parchment notification for puzzle solved
                window.notificationSystem.showPuzzleSolved('pressure_plate');
            }
        }
    }
    
    checkDoorUnlock(x, y) {
        const door = this.maze.tryUnlockDoor(x, y, this.collectedKeys);
        if (door) {
            // Create door unlock particles
            this.particleSystem.createDoorUnlock(
                x * TILE_SIZE + TILE_SIZE / 2,
                y * TILE_SIZE + TILE_SIZE / 2,
                door.color
            );
            
            // Show parchment notification
            window.notificationSystem.showDoorUnlocked(door.color);
            
            // Play door unlock sound
            this.audio.playDoorUnlock();
        }
    }
    
    changeDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.difficultyConfig = DIFFICULTY_LEVELS[difficulty];
        
        // Recreate maze with new difficulty
        this.maze = new Maze(this.difficultyConfig.gridWidth, this.difficultyConfig.gridHeight);
        
        // Recreate mini-map with new maze
        this.miniMap = new MiniMap(this.miniMapCanvas, this.maze);
        
        // Update status to show difficulty
        this.status.textContent = `${this.difficultyConfig.name} - ${this.difficultyConfig.description}. Press SPACE to start`;
    }
    
    startNewGame() {
        // Generate maze with difficulty-based complexity
        this.maze.generate(this.difficultyConfig.complexity);
        this.player.reset(this.maze.startX, this.maze.startY);
        this.camera.reset();
        this.state = 'playing';
        this.status.textContent = `${this.difficultyConfig.name} - Find the exit!`;
        
        // Disable difficulty selector during game
        document.getElementById('difficulty').disabled = true;
        
        // Reset game stats
        this.startTime = Date.now();
        this.currentTime = 0;
        this.stepCount = 0;
        this.treasureScore = 0;
        this.collectedKeys = [];
        this.wallCollisions = 0;
        this.updateTimerDisplay();
        this.updateStepsDisplay();
        this.updateTreasureDisplay();
        this.updateKeyDisplay();
        
        // Reset mini-map
        this.miniMap.reset();
        
        // Clear particles
        this.particleSystem.clear();
        
        // Clear any lingering notifications from previous game
        window.notificationSystem.clear();
        
        // Play game start sound
        this.audio.resume();
        this.audio.playGameStart();
        
        // Show quest start notification
        window.notificationSystem.showQuestStart(`${this.difficultyConfig.name} Dungeon`);
    }
    
    completeGame() {
        const completionTime = this.currentTime;
        
        // Re-enable difficulty selector
        document.getElementById('difficulty').disabled = false;
        
        // Track difficulty completion
        if (!this.completedDifficulties.includes(this.currentDifficulty)) {
            this.completedDifficulties.push(this.currentDifficulty);
            this.saveCompletedDifficulties();
        }
        
        // Update streak tracking
        this.winStreak++;
        if (this.wallCollisions === 0) {
            this.perfectStreak++;
        } else {
            this.perfectStreak = 0;
        }
        
        // Calculate exploration percentage
        const totalTiles = this.maze.width * this.maze.height;
        const exploredTiles = this.miniMap.explored.size;
        const explorationPercentage = (exploredTiles / totalTiles) * 100;
        
        // Check for achievements
        const gameData = {
            completionTime: completionTime,
            difficulty: this.currentDifficulty,
            wallCollisions: this.wallCollisions,
            explorationPercentage: explorationPercentage,
            winStreak: this.winStreak,
            perfectStreak: this.perfectStreak,
            completedDifficulties: this.completedDifficulties
        };
        
        const newAchievements = this.achievementSystem.checkAchievements(gameData);
        if (newAchievements.length > 0) {
            this.achievementUI.showMultipleAchievements(newAchievements);
        }
        
        // Update stats
        this.stats.totalGames++;
        this.stats.totalSteps += this.stepCount;
        
        if (completionTime < this.stats.bestTime) {
            this.stats.bestTime = completionTime;
            this.status.textContent = `${this.difficultyConfig.name} completed! New best: ${this.formatTime(completionTime)} - Press SPACE to play again`;
            document.getElementById('bestTime').textContent = this.formatTime(completionTime);
        } else {
            this.status.textContent = `${this.difficultyConfig.name} completed in ${this.formatTime(completionTime)}! Press SPACE to play again`;
        }
        
        this.stats.averageTime = (this.stats.averageTime * (this.stats.totalGames - 1) + completionTime) / this.stats.totalGames;
        this.saveStats();
        this.saveStreakData();
    }
    
    updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.formatTime(this.currentTime);
        }
    }
    
    updateStepsDisplay() {
        const stepsElement = document.getElementById('steps');
        if (stepsElement) {
            stepsElement.textContent = this.stepCount.toString();
        }
    }
    
    updateTreasureDisplay() {
        const treasureElement = document.getElementById('treasure');
        if (treasureElement) {
            treasureElement.textContent = this.treasureScore.toString();
        }
    }
    
    updateKeyDisplay() {
        const keyElement = document.getElementById('keys');
        if (keyElement) {
            if (this.collectedKeys.length === 0) {
                keyElement.textContent = 'None';
            } else {
                // Show colored key icons
                const keyIcons = this.collectedKeys.map(color => {
                    const colorEmojis = {
                        'red': '🔴',
                        'blue': '🔵', 
                        'green': '🟢',
                        'yellow': '🟡'
                    };
                    return colorEmojis[color] || '🔑';
                }).join(' ');
                keyElement.innerHTML = keyIcons;
            }
        }
    }
    
    checkTreasureCollection() {
        // Use actual player grid position, not render position
        const treasure = this.maze.collectTreasure(this.player.x, this.player.y);
        
        if (treasure) {
            this.treasureScore += treasure.value;
            this.updateTreasureDisplay();
            
            // Create treasure collection particles at player's world position
            this.particleSystem.createTreasureCollection(
                this.player.x * TILE_SIZE + TILE_SIZE / 2,
                this.player.y * TILE_SIZE + TILE_SIZE / 2,
                treasure.type
            );
            
            // Show parchment notification
            const treasureName = treasure.type === 'chest' ? 'Treasure Chest' : 
                               treasure.type === 'gem' ? 'Precious Gem' : 'Gold Coins';
            window.notificationSystem.showTreasureCollected(treasureName, treasure.value);
            
            // Play treasure collection sound
            this.audio.playTreasureCollect();
        }
        
        // Check for key collection
        const key = this.maze.collectKey(this.player.x, this.player.y);
        if (key) {
            this.collectedKeys.push(key.color);
            this.updateKeyDisplay();
            
            // Create key collection particles
            this.particleSystem.createKeyCollection(
                this.player.x * TILE_SIZE + TILE_SIZE / 2,
                this.player.y * TILE_SIZE + TILE_SIZE / 2,
                key.color
            );
            
            // Show parchment notification
            window.notificationSystem.showKeyCollected(key.color);
            
            // Play key collection sound
            this.audio.playKeyCollect();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (this.state === 'start') {
            // Show medieval start screen
            this.renderStartScreen();
        } else {
            this.renderer.render(this.maze, this.player, this.camera);
            
            // Render particles
            this.particleSystem.render(this.ctx, this.camera);
            
            this.miniMap.render(this.player);
            
            // Show victory overlay if won
            if (this.state === 'won') {
                this.renderVictoryScreen();
            }
        }
    }
    
    renderStartScreen() {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        
        // Draw parchment background
        this.ctx.fillStyle = '#f4e8d0';
        this.ctx.fillRect(50, 80, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 160);
        
        // Parchment border - dark brown frame
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(50, 80, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 160);
        
        // Inner border decoration
        this.ctx.strokeStyle = '#A0522D';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(60, 90, CANVAS_WIDTH - 120, CANVAS_HEIGHT - 180);
        
        // Add aged paper texture
        this.ctx.fillStyle = 'rgba(139, 115, 85, 0.1)';
        for (let i = 0; i < 20; i++) {
            const x = 70 + Math.random() * (CANVAS_WIDTH - 140);
            const y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
            this.ctx.fillRect(x, y, 2 + Math.random() * 3, 1);
        }
        
        // Title - "DUNGEON ESCAPE"
        this.ctx.fillStyle = '#2F1B14';
        this.ctx.font = 'bold 36px serif';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('DUNGEON ESCAPE', centerX, centerY - 120);
        this.ctx.fillText('DUNGEON ESCAPE', centerX, centerY - 120);
        
        // Subtitle
        this.ctx.font = 'italic 18px serif';
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillText('~ Quest of the Armored Knight ~', centerX, centerY - 85);
        
        // Draw decorative elements
        this.drawScrollDecorations(centerX, centerY);
        
        // Instructions
        this.ctx.font = '16px serif';
        this.ctx.fillStyle = '#3E2723';
        this.ctx.fillText('A brave knight seeks treasure in the ancient dungeon', centerX, centerY - 20);
        this.ctx.fillText('Use ⬆️ ⬇️ ⬅️ ➡️ to navigate the stone corridors', centerX, centerY + 10);
        
        // Difficulty display
        this.ctx.font = 'bold 14px serif';
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillText(`Current Quest: ${this.difficultyConfig.name}`, centerX, centerY + 50);
        this.ctx.font = '12px serif';
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillText(this.difficultyConfig.description, centerX, centerY + 70);
        
        // Start prompt with animation
        const pulseAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 500);
        this.ctx.font = 'bold 20px serif';
        this.ctx.fillStyle = `rgba(139, 69, 19, ${pulseAlpha})`;
        this.ctx.strokeStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.strokeText('⚔️ Press SPACE to begin your quest ⚔️', centerX, centerY + 120);
        this.ctx.fillText('⚔️ Press SPACE to begin your quest ⚔️', centerX, centerY + 120);
        
        // Draw clickable start button
        const buttonWidth = 200;
        const buttonHeight = 40;
        const buttonX = centerX - buttonWidth / 2;
        const buttonY = centerY + 140;
        
        // Button background
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.8)';
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button border
        this.ctx.strokeStyle = '#DAA520';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px serif';
        this.ctx.fillText('START QUEST', centerX, buttonY + 25);
        
        // Store button bounds for click detection
        this.startButtonBounds = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
    }
    
    drawScrollDecorations(centerX, centerY) {
        const ctx = this.ctx;
        
        // Decorative corner elements
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        
        // Top left corner
        ctx.beginPath();
        ctx.moveTo(80, 110);
        ctx.lineTo(120, 110);
        ctx.moveTo(80, 110);
        ctx.lineTo(80, 150);
        ctx.stroke();
        
        // Top right corner
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH - 80, 110);
        ctx.lineTo(CANVAS_WIDTH - 120, 110);
        ctx.moveTo(CANVAS_WIDTH - 80, 110);
        ctx.lineTo(CANVAS_WIDTH - 80, 150);
        ctx.stroke();
        
        // Bottom left corner
        ctx.beginPath();
        ctx.moveTo(80, CANVAS_HEIGHT - 110);
        ctx.lineTo(120, CANVAS_HEIGHT - 110);
        ctx.moveTo(80, CANVAS_HEIGHT - 110);
        ctx.lineTo(80, CANVAS_HEIGHT - 150);
        ctx.stroke();
        
        // Bottom right corner
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 110);
        ctx.lineTo(CANVAS_WIDTH - 120, CANVAS_HEIGHT - 110);
        ctx.moveTo(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 110);
        ctx.lineTo(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 150);
        ctx.stroke();
        
        // Central decorative emblem
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 50, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Shield shape around emblem
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, centerY - 60);
        ctx.lineTo(centerX + 15, centerY - 60);
        ctx.lineTo(centerX + 15, centerY - 45);
        ctx.lineTo(centerX, centerY - 35);
        ctx.lineTo(centerX - 15, centerY - 45);
        ctx.closePath();
        ctx.stroke();
    }
    
    renderVictoryScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        
        // Victory parchment
        this.ctx.fillStyle = '#f4e8d0';
        this.ctx.fillRect(100, 150, CANVAS_WIDTH - 200, CANVAS_HEIGHT - 300);
        
        // Parchment border
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(100, 150, CANVAS_WIDTH - 200, CANVAS_HEIGHT - 300);
        
        // Inner border
        this.ctx.strokeStyle = '#DAA520';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(110, 160, CANVAS_WIDTH - 220, CANVAS_HEIGHT - 320);
        
        // Treasure chest animation
        const chestBob = Math.sin(Date.now() / 300) * 3;
        this.drawTreasureChest(centerX, centerY - 80 + chestBob);
        
        // Victory title
        this.ctx.fillStyle = '#8B4513';
        this.ctx.font = 'bold 28px serif';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#DAA520';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('🏆 QUEST COMPLETE! 🏆', centerX, centerY - 20);
        this.ctx.fillText('🏆 QUEST COMPLETE! 🏆', centerX, centerY - 20);
        
        // Completion details
        this.ctx.font = '16px serif';
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillText(`Difficulty: ${this.difficultyConfig.name}`, centerX, centerY + 10);
        this.ctx.fillText(`Time: ${this.formatTime(this.currentTime)}`, centerX, centerY + 30);
        this.ctx.fillText(`Steps: ${this.stepCount}`, centerX, centerY + 50);
        
        // Best time indicator
        if (this.currentTime < this.stats.bestTime) {
            this.ctx.font = 'bold 14px serif';
            this.ctx.fillStyle = '#DAA520';
            this.ctx.fillText('✨ NEW BEST TIME! ✨', centerX, centerY + 75);
        }
        
        // Continue prompt with animation
        const pulseAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 400);
        this.ctx.font = 'bold 18px serif';
        this.ctx.fillStyle = `rgba(139, 69, 19, ${pulseAlpha})`;
        this.ctx.strokeStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.strokeText('Press SPACE for another quest', centerX, centerY + 110);
        this.ctx.fillText('Press SPACE for another quest', centerX, centerY + 110);
    }
    
    drawTreasureChest(x, y) {
        const ctx = this.ctx;
        
        // Chest base
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 25, y + 5, 50, 20);
        
        // Chest lid
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x - 25, y - 10, 50, 15);
        
        // Chest lock
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(x - 3, y - 2, 6, 8);
        
        // Chest hinges
        ctx.fillStyle = '#696969';
        ctx.fillRect(x - 20, y - 8, 3, 5);
        ctx.fillRect(x + 17, y - 8, 3, 5);
        
        // Sparkles around chest
        const sparkleTime = Date.now() / 200;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + sparkleTime;
            const sparkleX = x + Math.cos(angle) * 35;
            const sparkleY = y + Math.sin(angle) * 25;
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});