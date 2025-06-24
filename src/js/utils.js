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

// Colors for dungeon theme
const COLORS = {
    // Stone wall colors
    WALL: '#4a4a4a',
    WALL_DARK: '#2d2d2d',
    WALL_LIGHT: '#666666',
    WALL_MOSS: '#5a7c5a',
    
    // Floor colors
    FLOOR: '#8b7355',
    FLOOR_DARK: '#6b5d4f',
    FLOOR_LIGHT: '#9b8365',
    
    // Knight colors
    ARMOR_BASE: '#c0c0c0',
    ARMOR_DARK: '#8b8b8b',
    ARMOR_LIGHT: '#e8e8e8',
    ARMOR_ACCENT: '#ffd700',
    
    // Game elements
    START: '#5cb85c',
    START_GLOW: '#7dd87d',
    END: '#ffd700',
    END_GLOW: '#ffed4e',
    
    // Torch/Fire colors
    FIRE_CORE: '#fff2cc',
    FIRE_MID: '#ff9500',
    FIRE_OUTER: '#ff6b00',
    
    // UI colors
    COMPASS_BG: 'rgba(0, 0, 0, 0.8)',
    COMPASS_BORDER: '#daa520',
    
    // Treasure colors
    TREASURE_GOLD: '#ffd700',
    TREASURE_SILVER: '#c0c0c0',
    TREASURE_BRONZE: '#cd7f32',
    TREASURE_GEM_RED: '#dc143c',
    TREASURE_GEM_BLUE: '#4169e1',
    TREASURE_GEM_GREEN: '#32cd32',
    TREASURE_CHEST: '#8b4513',
    TREASURE_GLOW: '#ffed4e'
};

// Utility functions
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}