// Utility functions for the maze game

const TILE_SIZE = 32;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Difficulty configurations
const DIFFICULTY_LEVELS = {
    EASY: {
        name: 'Easy',
        gridWidth: 20,
        gridHeight: 15,
        complexity: 0.3, // Lower = simpler maze
        description: 'Wider paths, simple layout'
    },
    MEDIUM: {
        name: 'Medium', 
        gridWidth: 32,
        gridHeight: 24,
        complexity: 0.5, // Standard complexity
        description: 'Standard maze difficulty'
    },
    HARD: {
        name: 'Hard',
        gridWidth: 40,
        gridHeight: 30, 
        complexity: 0.7, // Higher = more complex
        description: 'Narrow paths, complex layout'
    },
    EXPERT: {
        name: 'Expert',
        gridWidth: 48,
        gridHeight: 36,
        complexity: 0.9, // Maximum complexity
        description: 'Maximum challenge'
    }
};

// Default difficulty (maintains backward compatibility)
const MAP_WIDTH = CANVAS_WIDTH * 4;
const MAP_HEIGHT = CANVAS_HEIGHT * 4;
const GRID_WIDTH = MAP_WIDTH / TILE_SIZE;
const GRID_HEIGHT = MAP_HEIGHT / TILE_SIZE;

// Direction constants
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Key codes
const KEYS = {
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    SPACE: ' '
};

// Colors for pixel art style
const COLORS = {
    WALL: '#2d2d2d',
    WALL_DARK: '#1a1a1a',
    WALL_LIGHT: '#404040',
    FLOOR: '#f0f0f0',
    FLOOR_DARK: '#e0e0e0',
    PLAYER: '#4a90e2',
    PLAYER_OUTLINE: '#ffffff',
    START: '#5cb85c',
    START_GLOW: '#7dd87d',
    END: '#d9534f',
    END_GLOW: '#ff6b6b',
    COMPASS_BG: 'rgba(0, 0, 0, 0.8)',
    COMPASS_BORDER: '#ffffff'
};

// Utility functions
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}