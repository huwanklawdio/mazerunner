// Achievement system for tracking player progress and unlocks
class AchievementSystem {
    constructor() {
        this.achievements = this.defineAchievements();
        this.unlockedAchievements = this.loadUnlockedAchievements();
        this.gameStats = {
            wallCollisions: 0,
            explorationPercentage: 0,
            currentStreak: 0,
            maxStreak: 0
        };
    }
    
    defineAchievements() {
        return {
            // Speed Runner achievements
            SPEED_RUNNER_1: {
                id: 'SPEED_RUNNER_1',
                name: 'Quick Steps',
                description: 'Complete any maze in under 30 seconds',
                category: 'Speed Runner',
                icon: '⚡',
                requirement: { type: 'time', value: 30, difficulty: 'any' },
                rarity: 'common'
            },
            SPEED_RUNNER_2: {
                id: 'SPEED_RUNNER_2', 
                name: 'Lightning Fast',
                description: 'Complete any maze in under 15 seconds',
                category: 'Speed Runner',
                icon: '🏃‍♂️',
                requirement: { type: 'time', value: 15, difficulty: 'any' },
                rarity: 'rare'
            },
            SPEED_RUNNER_3: {
                id: 'SPEED_RUNNER_3',
                name: 'The Flash',
                description: 'Complete Hard maze in under 45 seconds',
                category: 'Speed Runner', 
                icon: '💨',
                requirement: { type: 'time', value: 45, difficulty: 'HARD' },
                rarity: 'epic'
            },
            
            // Explorer achievements
            EXPLORER_1: {
                id: 'EXPLORER_1',
                name: 'Curious Wanderer',
                description: 'Explore 75% of the maze before finishing',
                category: 'Explorer',
                icon: '🗺️',
                requirement: { type: 'exploration', value: 75 },
                rarity: 'common'
            },
            EXPLORER_2: {
                id: 'EXPLORER_2',
                name: 'Thorough Investigator', 
                description: 'Explore 90% of the maze before finishing',
                category: 'Explorer',
                icon: '🔍',
                requirement: { type: 'exploration', value: 90 },
                rarity: 'rare'
            },
            EXPLORER_3: {
                id: 'EXPLORER_3',
                name: 'Master Cartographer',
                description: 'Explore 95% of the maze before finishing',
                category: 'Explorer',
                icon: '🧭',
                requirement: { type: 'exploration', value: 95 },
                rarity: 'epic'
            },
            
            // Perfectionist achievements
            PERFECTIONIST_1: {
                id: 'PERFECTIONIST_1',
                name: 'Clean Navigation',
                description: 'Complete a maze without hitting any walls',
                category: 'Perfectionist',
                icon: '✨',
                requirement: { type: 'perfect', value: 0 },
                rarity: 'common'
            },
            PERFECTIONIST_2: {
                id: 'PERFECTIONIST_2',
                name: 'Flawless Path',
                description: 'Complete 3 mazes in a row without hitting walls',
                category: 'Perfectionist',
                icon: '💎',
                requirement: { type: 'perfect_streak', value: 3 },
                rarity: 'rare'
            },
            PERFECTIONIST_3: {
                id: 'PERFECTIONIST_3',
                name: 'Untouchable',
                description: 'Complete Hard maze without hitting any walls',
                category: 'Perfectionist',
                icon: '👑',
                requirement: { type: 'perfect', value: 0, difficulty: 'HARD' },
                rarity: 'epic'
            },
            
            // Streak Master achievements
            STREAK_1: {
                id: 'STREAK_1',
                name: 'On a Roll',
                description: 'Win 3 mazes in a row',
                category: 'Streak Master',
                icon: '🔥',
                requirement: { type: 'streak', value: 3 },
                rarity: 'common'
            },
            STREAK_2: {
                id: 'STREAK_2',
                name: 'Unstoppable',
                description: 'Win 7 mazes in a row',
                category: 'Streak Master',
                icon: '🚀',
                requirement: { type: 'streak', value: 7 },
                rarity: 'rare'
            },
            STREAK_3: {
                id: 'STREAK_3',
                name: 'Legendary Streak',
                description: 'Win 15 mazes in a row',
                category: 'Streak Master',
                icon: '🏆',
                requirement: { type: 'streak', value: 15 },
                rarity: 'legendary'
            },
            
            // Difficulty Master achievements
            DIFFICULTY_1: {
                id: 'DIFFICULTY_1',
                name: 'Getting Serious',
                description: 'Complete your first Hard maze',
                category: 'Difficulty Master',
                icon: '💪',
                requirement: { type: 'difficulty_complete', value: 'HARD' },
                rarity: 'common'
            },
            DIFFICULTY_2: {
                id: 'DIFFICULTY_2',
                name: 'Elite Player',
                description: 'Complete your first Expert maze',
                category: 'Difficulty Master',
                icon: '🎯',
                requirement: { type: 'difficulty_complete', value: 'EXPERT' },
                rarity: 'rare'
            },
            DIFFICULTY_3: {
                id: 'DIFFICULTY_3',
                name: 'Master of All',
                description: 'Complete mazes on all difficulty levels',
                category: 'Difficulty Master',
                icon: '🌟',
                requirement: { type: 'all_difficulties', value: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] },
                rarity: 'epic'
            }
        };
    }
    
    loadUnlockedAchievements() {
        const saved = localStorage.getItem('mazerunner-achievements');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }
    
    saveUnlockedAchievements() {
        localStorage.setItem('mazerunner-achievements', JSON.stringify(this.unlockedAchievements));
    }
    
    checkAchievements(gameData) {
        const newlyUnlocked = [];
        
        for (const [id, achievement] of Object.entries(this.achievements)) {
            if (this.unlockedAchievements.includes(id)) {
                continue; // Already unlocked
            }
            
            if (this.isAchievementUnlocked(achievement, gameData)) {
                this.unlockedAchievements.push(id);
                newlyUnlocked.push(achievement);
            }
        }
        
        if (newlyUnlocked.length > 0) {
            this.saveUnlockedAchievements();
        }
        
        return newlyUnlocked;
    }
    
    isAchievementUnlocked(achievement, gameData) {
        const req = achievement.requirement;
        
        switch (req.type) {
            case 'time':
                return gameData.completionTime <= req.value && 
                       (req.difficulty === 'any' || gameData.difficulty === req.difficulty);
                       
            case 'exploration':
                return gameData.explorationPercentage >= req.value;
                
            case 'perfect':
                return gameData.wallCollisions === req.value &&
                       (req.difficulty === undefined || gameData.difficulty === req.difficulty);
                       
            case 'perfect_streak':
                return gameData.perfectStreak >= req.value;
                
            case 'streak':
                return gameData.winStreak >= req.value;
                
            case 'difficulty_complete':
                return gameData.difficulty === req.value;
                
            case 'all_difficulties':
                return req.value.every(diff => gameData.completedDifficulties.includes(diff));
                
            default:
                return false;
        }
    }
    
    getAchievementsByCategory() {
        const categories = {};
        
        for (const achievement of Object.values(this.achievements)) {
            if (!categories[achievement.category]) {
                categories[achievement.category] = [];
            }
            categories[achievement.category].push({
                ...achievement,
                unlocked: this.unlockedAchievements.includes(achievement.id)
            });
        }
        
        return categories;
    }
    
    getUnlockedCount() {
        return this.unlockedAchievements.length;
    }
    
    getTotalCount() {
        return Object.keys(this.achievements).length;
    }
    
    getCompletionPercentage() {
        return Math.round((this.getUnlockedCount() / this.getTotalCount()) * 100);
    }
    
    // Reset achievements (for testing or new game+)
    resetAchievements() {
        this.unlockedAchievements = [];
        this.saveUnlockedAchievements();
    }
}