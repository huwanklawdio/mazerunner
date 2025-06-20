// Utility functions for the maze game

const TILE_SIZE = 32;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
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
    FLOOR: '#f0f0f0',
    PLAYER: '#4a90e2',
    START: '#5cb85c',
    END: '#d9534f'
};

// Utility functions
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}