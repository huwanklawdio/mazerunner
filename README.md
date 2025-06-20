# Maze Runner

A top-down maze game built with HTML5 Canvas and vanilla JavaScript.

## Features

- **Procedural maze generation** using recursive backtracking algorithm
- **Grid-based movement** with smooth interpolation
- **4x screen-sized map** with camera following player
- **Pixel art style** rendering
- **Arrow key controls** for navigation
- **Random start/end positions** each game

## How to Play

1. Open the game in a web browser
2. Press **SPACE** to start a new game
3. Use **arrow keys** to navigate through the maze
4. Find the red exit square to win
5. Press **SPACE** to play again

## Running the Game

Since the game uses ES6 modules, it needs to be served over HTTP:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Game Controls

- **Arrow Keys**: Move player
- **Space**: Start new game / Restart

## Technical Details

- Built with HTML5 Canvas for pixel-perfect rendering
- Vanilla JavaScript with modular architecture
- Recursive backtracking maze generation
- Smooth camera following with viewport culling
- Grid-based collision detection

## File Structure

```
├── index.html          # Main HTML file
├── style.css           # Game styling
├── src/js/
│   ├── game.js         # Main game loop and state management
│   ├── maze.js         # Maze generation and collision detection
│   ├── player.js       # Player movement and animation
│   ├── camera.js       # Camera and viewport management
│   ├── renderer.js     # Rendering system
│   └── utils.js        # Utility functions and constants
└── todo.md             # Development task tracking
```

## Development

See `todo.md` for current development tasks and progress.