// Main game class and game loop
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.status = document.getElementById('status');
        
        // Game state
        this.state = 'start'; // 'start', 'playing', 'won'
        this.lastTime = 0;
        
        // Game stats
        this.startTime = 0;
        this.currentTime = 0;
        this.stepCount = 0;
        this.stats = this.loadStats();
        
        // Game objects
        this.maze = null;
        this.player = null;
        this.camera = null;
        this.renderer = null;
        this.audio = null;
        this.miniMap = null;
        
        // Input handling
        this.keys = {};
        this.keyPressed = {};
        
        this.init();
    }
    
    init() {
        // Set up pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        
        // Initialize game objects
        this.maze = new Maze(GRID_WIDTH, GRID_HEIGHT);
        this.player = new Player(1, 1); // Start position
        this.camera = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT);
        this.renderer = new Renderer(this.ctx);
        this.audio = new AudioSystem();
        
        // Create mini-map canvas
        this.miniMapCanvas = document.createElement('canvas');
        this.miniMap = new MiniMap(this.miniMapCanvas, this.maze);
        
        // Set up input handling
        this.setupInput();
        
        // Set up control buttons
        this.setupControls();
        
        // Set up stats display
        this.setupStatsDisplay();
        
        // Start game loop
        this.gameLoop(0);
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
    }
    
    setupControls() {
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
    }
    
    setupStatsDisplay() {
        // Create stats display elements
        const gameInfo = document.querySelector('.game-info');
        
        // Timer display
        const timerDiv = document.createElement('div');
        timerDiv.className = 'timer-display';
        timerDiv.innerHTML = '<span id="timer">00:00</span>';
        
        // Stats display
        const statsDiv = document.createElement('div');
        statsDiv.className = 'stats-display';
        statsDiv.innerHTML = `
            <div class="stat-item">Steps: <span id="steps">0</span></div>
            <div class="stat-item">Best: <span id="bestTime">${this.formatTime(this.stats.bestTime)}</span></div>
        `;
        
        gameInfo.appendChild(timerDiv);
        gameInfo.appendChild(statsDiv);
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
            
            // Update timer
            this.currentTime = (Date.now() - this.startTime) / 1000;
            this.updateTimerDisplay();
            
            // Check win condition
            if (this.player.x === this.maze.endX && this.player.y === this.maze.endY) {
                this.state = 'won';
                this.completeGame();
                this.audio.playVictory();
            }
        }
        
        // Clear key pressed flags
        this.keyPressed = {};
    }
    
    handleInput() {
        if (this.keyPressed['Space']) {
            if (this.state === 'start' || this.state === 'won') {
                this.startNewGame();
            }
        }
        
        if (this.state === 'playing') {
            let moved = false;
            let attemptedMove = false;
            
            if (this.keyPressed['ArrowUp']) {
                attemptedMove = true;
                moved = this.player.move(0, -1, this.maze);
            } else if (this.keyPressed['ArrowDown']) {
                attemptedMove = true;
                moved = this.player.move(0, 1, this.maze);
            } else if (this.keyPressed['ArrowLeft']) {
                attemptedMove = true;
                moved = this.player.move(-1, 0, this.maze);
            } else if (this.keyPressed['ArrowRight']) {
                attemptedMove = true;
                moved = this.player.move(1, 0, this.maze);
            }
            
            // Play sound effects
            if (attemptedMove) {
                // Resume audio context on first user interaction
                this.audio.resume();
                
                if (moved) {
                    this.audio.playFootstep();
                    this.stepCount++;
                    this.updateStepsDisplay();
                } else {
                    this.audio.playWallCollision();
                }
            }
        }
    }
    
    startNewGame() {
        this.maze.generate();
        this.player.reset(this.maze.startX, this.maze.startY);
        this.camera.reset();
        this.state = 'playing';
        this.status.textContent = 'Find the exit!';
        
        // Reset game stats
        this.startTime = Date.now();
        this.currentTime = 0;
        this.stepCount = 0;
        this.updateTimerDisplay();
        this.updateStepsDisplay();
        
        // Reset mini-map
        this.miniMap.reset();
        
        // Play game start sound
        this.audio.resume();
        this.audio.playGameStart();
    }
    
    completeGame() {
        const completionTime = this.currentTime;
        
        // Update stats
        this.stats.totalGames++;
        this.stats.totalSteps += this.stepCount;
        
        if (completionTime < this.stats.bestTime) {
            this.stats.bestTime = completionTime;
            this.status.textContent = `New best time! ${this.formatTime(completionTime)} - Press SPACE to play again`;
            document.getElementById('bestTime').textContent = this.formatTime(completionTime);
        } else {
            this.status.textContent = `Completed in ${this.formatTime(completionTime)}! Press SPACE to play again`;
        }
        
        this.stats.averageTime = (this.stats.averageTime * (this.stats.totalGames - 1) + completionTime) / this.stats.totalGames;
        this.saveStats();
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
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (this.state !== 'start') {
            this.renderer.render(this.maze, this.player, this.camera);
            this.miniMap.render(this.player);
        } else {
            // Show start screen
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MAZE RUNNER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
            this.ctx.font = '16px Courier New';
            this.ctx.fillText('Use arrow keys to navigate', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            this.ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
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