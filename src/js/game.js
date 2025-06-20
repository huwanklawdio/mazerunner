// Main game class and game loop
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.status = document.getElementById('status');
        
        // Game state
        this.state = 'start'; // 'start', 'playing', 'won'
        this.lastTime = 0;
        
        // Game objects
        this.maze = null;
        this.player = null;
        this.camera = null;
        this.renderer = null;
        this.audio = null;
        
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
        
        // Set up input handling
        this.setupInput();
        
        // Set up sound toggle button
        this.setupSoundToggle();
        
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
    
    setupSoundToggle() {
        const soundToggle = document.getElementById('soundToggle');
        soundToggle.style.pointerEvents = 'auto'; // Enable clicking
        
        soundToggle.addEventListener('click', () => {
            const enabled = this.audio.toggleSound();
            soundToggle.textContent = enabled ? '🔊' : '🔇';
            soundToggle.classList.toggle('disabled', !enabled);
        });
    }
    
    update(deltaTime) {
        // Handle input
        this.handleInput();
        
        // Update game objects based on state
        if (this.state === 'playing') {
            this.player.update(deltaTime, this.maze);
            this.camera.update(this.player.x * TILE_SIZE, this.player.y * TILE_SIZE);
            
            // Check win condition
            if (this.player.x === this.maze.endX && this.player.y === this.maze.endY) {
                this.state = 'won';
                this.status.textContent = 'You won! Press SPACE to play again';
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
        
        // Play game start sound
        this.audio.resume();
        this.audio.playGameStart();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (this.state !== 'start') {
            this.renderer.render(this.maze, this.player, this.camera);
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